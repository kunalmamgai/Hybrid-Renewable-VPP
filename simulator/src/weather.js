const LATITUDE = 23.07551;
const LONGITUDE = 76.84978;
const WEATHER_CACHE_TTL = 10 * 60 * 1000;
const WEATHER_RETRY_COOLDOWN = 2 * 60 * 1000;
const WEATHER_REQUEST_TIMEOUT = 12 * 1000;
const weatherRequests = new Map();
const weatherFailures = new Map();

const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "cloud_cover",
  "precipitation",
  "rain",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "shortwave_radiation",
  "is_day",
].join(",");

const HOURLY_FIELDS = [
  "temperature_2m",
  "cloud_cover",
  "precipitation_probability",
  "wind_speed_10m",
  "shortwave_radiation",
].join(",");

export const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}` +
  `&longitude=${LONGITUDE}&current=${CURRENT_FIELDS}` +
  `&hourly=${HOURLY_FIELDS}&forecast_days=3&timezone=Asia%2FKolkata`;

export const WTTR_URL = `https://wttr.in/${LATITUDE},${LONGITUDE}?format=j1`;

export const FALLBACK_WEATHER = {
  temperature: 29,
  feelsLike: 31,
  cloudCover: 32,
  precipitation: 0,
  rain: 0,
  weatherCode: 1,
  windSpeed: 11,
  windDirection: 238,
  radiation: 610,
  isDay: true,
  time: new Date().toISOString(),
  source: "offline model",
};

export const SCENARIOS = {
  clear: {
    label: "Clear summer",
    temperature: 34,
    feelsLike: 37,
    cloudCover: 8,
    precipitation: 0,
    rain: 0,
    weatherCode: 0,
    windSpeed: 9,
    windDirection: 245,
    radiation: 850,
    isDay: true,
  },
  monsoon: {
    label: "Monsoon rain",
    temperature: 25,
    feelsLike: 28,
    cloudCover: 94,
    precipitation: 5.8,
    rain: 5.8,
    weatherCode: 63,
    windSpeed: 23,
    windDirection: 218,
    radiation: 115,
    isDay: true,
  },
  storm: {
    label: "Thunderstorm",
    temperature: 23,
    feelsLike: 26,
    cloudCover: 100,
    precipitation: 13,
    rain: 13,
    weatherCode: 95,
    windSpeed: 42,
    windDirection: 202,
    radiation: 40,
    isDay: true,
  },
  winter: {
    label: "Winter morning",
    temperature: 14,
    feelsLike: 13,
    cloudCover: 18,
    precipitation: 0,
    rain: 0,
    weatherCode: 1,
    windSpeed: 6,
    windDirection: 70,
    radiation: 370,
    isDay: true,
  },
  night: {
    label: "Clear night",
    temperature: 22,
    feelsLike: 22,
    cloudCover: 16,
    precipitation: 0,
    rain: 0,
    weatherCode: 0,
    windSpeed: 8,
    windDirection: 245,
    radiation: 0,
    isDay: false,
  },
};

export async function fetchLiveWeather(signal) {
  return fetchCampusWeather(LATITUDE, LONGITUDE, signal);
}

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function weatherCodeFromDescription(description = "") {
  const label = description.toLowerCase();
  if (label.includes("thunder")) return 95;
  if (label.includes("snow") || label.includes("sleet")) return 71;
  if (label.includes("shower")) return 80;
  if (label.includes("rain") || label.includes("drizzle")) return 61;
  if (label.includes("fog") || label.includes("mist")) return 45;
  if (label.includes("cloud") || label.includes("overcast")) return 3;
  return 0;
}

function indiaHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
}

function resilientLocalWeather() {
  const now = new Date();
  const hour = indiaHour(now);
  const isDay = hour >= 6 && hour < 19;
  const daylight = isDay
    ? Math.max(0, Math.sin(((hour - 6) / 13) * Math.PI))
    : 0;
  return {
    ...FALLBACK_WEATHER,
    temperature: Number((25 + daylight * 6).toFixed(1)),
    feelsLike: Number((26 + daylight * 7).toFixed(1)),
    radiation: Math.round(daylight * 760),
    isDay,
    time: now.toISOString(),
    source: "resilient local weather",
  };
}

export function normaliseOpenMeteoWeather(payload) {
  const current = payload?.current;
  if (!current || !Number.isFinite(Number(current.temperature_2m))) {
    throw new Error("Open-Meteo returned incomplete weather data");
  }
  return {
    temperature: numberValue(current.temperature_2m),
    feelsLike: numberValue(current.apparent_temperature, current.temperature_2m),
    cloudCover: numberValue(current.cloud_cover),
    precipitation: numberValue(current.precipitation),
    rain: numberValue(current.rain),
    weatherCode: numberValue(current.weather_code),
    windSpeed: numberValue(current.wind_speed_10m),
    windDirection: numberValue(current.wind_direction_10m),
    radiation: numberValue(current.shortwave_radiation),
    isDay: Boolean(current.is_day),
    time: current.time || new Date().toISOString(),
    source: "Open-Meteo live",
    hourly: payload.hourly,
  };
}

function interpolateWttrHourly(weatherDays = []) {
  const samples = weatherDays.flatMap((day) =>
    (day.hourly || []).map((hour) => {
      const rawHour = String(hour.time || "0").padStart(4, "0");
      const hours = rawHour.slice(0, -2).padStart(2, "0");
      const minutes = rawHour.slice(-2);
      return {
        time: new Date(`${day.date}T${hours}:${minutes}:00+05:30`).getTime(),
        temperature: numberValue(hour.tempC),
        cloudCover: numberValue(hour.cloudcover),
        precipitationProbability: numberValue(hour.chanceofrain),
        windSpeed: numberValue(hour.windspeedKmph),
        radiation: numberValue(hour.shortRad),
      };
    }),
  ).filter((sample) => Number.isFinite(sample.time));

  const interpolated = [];
  for (let index = 0; index < samples.length - 1; index += 1) {
    const current = samples[index];
    const next = samples[index + 1];
    const hoursBetween = Math.max(1, Math.round((next.time - current.time) / 3_600_000));
    for (let step = 0; step < hoursBetween; step += 1) {
      const ratio = step / hoursBetween;
      interpolated.push({
        time: new Date(current.time + step * 3_600_000).toISOString(),
        temperature: current.temperature + (next.temperature - current.temperature) * ratio,
        cloudCover: current.cloudCover + (next.cloudCover - current.cloudCover) * ratio,
        precipitationProbability:
          current.precipitationProbability +
          (next.precipitationProbability - current.precipitationProbability) * ratio,
        windSpeed: current.windSpeed + (next.windSpeed - current.windSpeed) * ratio,
        radiation: current.radiation + (next.radiation - current.radiation) * ratio,
      });
    }
  }
  if (samples.length) {
    const last = samples[samples.length - 1];
    interpolated.push({ ...last, time: new Date(last.time).toISOString() });
  }

  return {
    time: interpolated.map((item) => item.time),
    temperature_2m: interpolated.map((item) => Number(item.temperature.toFixed(1))),
    cloud_cover: interpolated.map((item) => Math.round(item.cloudCover)),
    precipitation_probability: interpolated.map((item) => Math.round(item.precipitationProbability)),
    wind_speed_10m: interpolated.map((item) => Number(item.windSpeed.toFixed(1))),
    shortwave_radiation: interpolated.map((item) => Math.round(item.radiation)),
  };
}

export function normaliseWttrWeather(payload) {
  const current = payload?.current_condition?.[0];
  if (!current || !Number.isFinite(Number(current.temp_C))) {
    throw new Error("wttr.in returned incomplete weather data");
  }
  const description = current.weatherDesc?.[0]?.value || "";
  const hourly = interpolateWttrHourly(payload.weather || []);
  const now = Date.now();
  let closestIndex = 0;
  hourly.time.forEach((time, index) => {
    if (
      Math.abs(new Date(time).getTime() - now) <
      Math.abs(new Date(hourly.time[closestIndex]).getTime() - now)
    ) {
      closestIndex = index;
    }
  });
  const hour = indiaHour();
  const isDay = hour >= 6 && hour < 19;
  return {
    temperature: numberValue(current.temp_C),
    feelsLike: numberValue(current.FeelsLikeC, current.temp_C),
    cloudCover: numberValue(current.cloudcover),
    precipitation: numberValue(current.precipMM),
    rain: numberValue(current.precipMM),
    weatherCode: weatherCodeFromDescription(description),
    windSpeed: numberValue(current.windspeedKmph),
    windDirection: numberValue(current.winddirDegree),
    radiation: isDay ? numberValue(hourly.shortwave_radiation[closestIndex]) : 0,
    isDay,
    time: new Date().toISOString(),
    source: "wttr.in live",
    hourly,
  };
}

async function fetchJson(url, signal) {
  const controller = new AbortController();
  const abortRequest = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortRequest();
  signal?.addEventListener("abort", abortRequest, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), WEATHER_REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Weather request failed (${response.status})`);
    return response.json();
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
  }
}

export async function fetchCampusWeather(latitude, longitude, signal) {
  const cacheKey = `surya-weather:${Number(latitude).toFixed(4)}:${Number(longitude).toFixed(4)}`;
  let cachedWeather = null;
  let persistedFailure = 0;
  try {
    const cachedValue = window.localStorage.getItem(cacheKey);
    if (cachedValue) {
      const parsed = JSON.parse(cachedValue);
      cachedWeather = parsed?.weather || null;
      if (cachedWeather && Date.now() - parsed.savedAt < WEATHER_CACHE_TTL) {
        return { ...cachedWeather, source: `${cachedWeather.source || "live weather"} • cached` };
      }
    }
    persistedFailure = Number(window.localStorage.getItem(`${cacheKey}:failure`)) || 0;
  } catch {
    // Storage can be unavailable in privacy modes; live weather still works without it.
  }

  const lastFailure = Math.max(weatherFailures.get(cacheKey) || 0, persistedFailure);
  if (Date.now() - lastFailure < WEATHER_RETRY_COOLDOWN) {
    if (cachedWeather) return { ...cachedWeather, source: "cached weather" };
    return resilientLocalWeather();
  }

  const inFlight = weatherRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const openMeteoUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}&current=${CURRENT_FIELDS}` +
    `&hourly=${HOURLY_FIELDS}&forecast_days=3&timezone=Asia%2FKolkata`;
  const wttrUrl = `https://wttr.in/${latitude},${longitude}?format=j1`;
  const request = (async () => {
    try {
      let weather;
      try {
        weather = normaliseWttrWeather(await fetchJson(wttrUrl, signal));
      } catch (wttrError) {
        if (signal?.aborted) throw wttrError;
        weather = normaliseOpenMeteoWeather(await fetchJson(openMeteoUrl, signal));
      }
      weatherFailures.delete(cacheKey);
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), weather }));
        window.localStorage.removeItem(`${cacheKey}:failure`);
      } catch {
        // The cache is an optimization and must never block the simulator.
      }
      return weather;
    } catch (error) {
      const failedAt = Date.now();
      weatherFailures.set(cacheKey, failedAt);
      try {
        window.localStorage.setItem(`${cacheKey}:failure`, String(failedAt));
      } catch {
        // A memory-only cooldown still prevents duplicate requests in this session.
      }
      if (cachedWeather) return { ...cachedWeather, source: "cached weather" };
      return resilientLocalWeather();
    } finally {
      weatherRequests.delete(cacheKey);
    }
  })();
  weatherRequests.set(cacheKey, request);
  return request;
}

export function weatherLabel(code) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorm";
}

export function compassDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}
