import test from "node:test";
import assert from "node:assert/strict";

import {
  normaliseOpenMeteoWeather,
  normaliseWttrWeather,
} from "../src/weather.js";

test("normalises Open-Meteo current and hourly weather", () => {
  const weather = normaliseOpenMeteoWeather({
    current: {
      temperature_2m: 27.4,
      apparent_temperature: 30.1,
      cloud_cover: 72,
      precipitation: 0.4,
      rain: 0.4,
      weather_code: 61,
      wind_speed_10m: 13,
      wind_direction_10m: 290,
      shortwave_radiation: 240,
      is_day: 1,
      time: "2026-08-08T17:00",
    },
    hourly: { time: ["2026-08-08T17:00"] },
  });

  assert.equal(weather.temperature, 27.4);
  assert.equal(weather.weatherCode, 61);
  assert.equal(weather.isDay, true);
  assert.equal(weather.source, "Open-Meteo live");
});

test("normalises wttr.in and expands its three-hour forecast", () => {
  const weather = normaliseWttrWeather({
    current_condition: [{
      temp_C: "25",
      FeelsLikeC: "27",
      cloudcover: "87",
      precipMM: "0.4",
      windspeedKmph: "13",
      winddirDegree: "297",
      weatherDesc: [{ value: "Light rain shower" }],
    }],
    weather: [{
      date: "2026-08-08",
      hourly: [
        { time: "0", tempC: "24", cloudcover: "90", chanceofrain: "60", windspeedKmph: "12", shortRad: "0" },
        { time: "300", tempC: "25", cloudcover: "80", chanceofrain: "50", windspeedKmph: "15", shortRad: "0" },
        { time: "600", tempC: "26", cloudcover: "70", chanceofrain: "40", windspeedKmph: "18", shortRad: "75" },
      ],
    }],
  });

  assert.equal(weather.temperature, 25);
  assert.equal(weather.weatherCode, 80);
  assert.equal(weather.source, "wttr.in live");
  assert.ok(weather.hourly.time.length >= 7);
  assert.equal(weather.hourly.temperature_2m.length, weather.hourly.time.length);
});

test("rejects incomplete live-weather responses", () => {
  assert.throws(() => normaliseOpenMeteoWeather({}), /incomplete/);
  assert.throws(() => normaliseWttrWeather({}), /incomplete/);
});
