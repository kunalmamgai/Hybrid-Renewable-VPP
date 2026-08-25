import assert from "node:assert/strict";
import test from "node:test";
import {
  analyseForecast,
  buildForecast,
  calculateCampusEnergy,
  createDefaultEnergyConfig,
} from "../src/energyIntelligence.js";
import { CAMPUSES } from "../src/campuses.js";

const campus = {
  id: "test-campus",
  shortName: "Test Campus",
  city: "Jaipur",
  category: "Technical",
  baseDemand: 5,
  solarMw: 3,
  windMw: 2,
};

const clearWeather = {
  temperature: 30,
  feelsLike: 32,
  cloudCover: 8,
  precipitation: 0,
  radiation: 900,
  windSpeed: 36,
  time: "2026-07-29T13:00:00",
};

const calculate = (overrides = {}) => {
  const config = {
    ...createDefaultEnergyConfig(campus),
    ...(overrides.config || {}),
  };
  return calculateCampusEnergy({
    campus,
    config,
    weather: clearWeather,
    occupancy: 70,
    batterySoc: 60,
    planningSummary: {},
    hazardImpact: {},
    ...overrides,
    config,
  });
};

test("creates campus-specific defaults with usable PV, BESS, wind and diesel assets", () => {
  const config = createDefaultEnergyConfig(campus);
  assert.equal(config.panelWatt, 550);
  assert.ok(config.panelCount > 5_000);
  assert.ok(config.batteryKwh >= 4_000);
  assert.equal(config.windCapacityMw, 2);
  assert.ok(config.dieselCapacityMw > 0);
  assert.ok(config.offPeakTariff < config.peakTariff);
  assert.ok(config.panelsPerString * config.parallelStrings >= config.panelCount);
});

test("builds a complete 48-hour offline forecast", () => {
  const forecast = buildForecast(clearWeather);
  assert.equal(forecast.length, 48);
  assert.ok(forecast.every((hour) => Number.isFinite(hour.radiation)));
  assert.ok(forecast.every((hour) => hour.cloudCover >= 0 && hour.cloudCover <= 100));
});

test("normalises a live hourly weather payload", () => {
  const start = Date.now();
  const time = Array.from({ length: 60 }, (_, index) =>
    new Date(start + index * 3_600_000).toISOString(),
  );
  const hourlyWeather = {
    ...clearWeather,
    hourly: {
      time,
      temperature_2m: time.map(() => 31),
      cloud_cover: time.map(() => 20),
      precipitation_probability: time.map(() => 5),
      wind_speed_10m: time.map(() => 18),
      shortwave_radiation: time.map((_, index) => index * 10),
    },
  };
  const forecast = buildForecast(hourlyWeather);
  assert.equal(forecast.length, 48);
  assert.equal(forecast[0].temperature, 31);
  assert.equal(forecast[0].cloudCover, 20);
});

test("classifies clear and stormy forecast risk", () => {
  const clear = Array.from({ length: 48 }, (_, index) => ({
    radiation: index % 24 >= 7 && index % 24 <= 17 ? 750 : 0,
    cloudCover: 10,
    precipitationProbability: 0,
  }));
  const storm = Array.from({ length: 48 }, () => ({
    radiation: 90,
    cloudCover: 98,
    precipitationProbability: 90,
  }));
  assert.equal(analyseForecast(clear).level, "low");
  assert.equal(analyseForecast(storm).level, "high");
  assert.equal(analyseForecast(storm).poorSolarExpected, true);
});

test("limits generation to electrically wired panels", () => {
  const result = calculate({
    config: {
      panelCount: 1_000,
      panelsPerString: 20,
      parallelStrings: 40,
      topology: "series",
    },
  });
  assert.equal(result.array.installedPanels, 1_000);
  assert.equal(result.array.wiredPanels, 800);
  assert.equal(result.array.unwiredPanels, 200);
  assert.equal(result.array.dcCapacityMw, 0.44);
});

test("microinverters connect every installed panel and improve shade tolerance", () => {
  const series = calculate({
    weather: { ...clearWeather, cloudCover: 85 },
    config: { panelCount: 1_000, panelsPerString: 20, parallelStrings: 40, topology: "series" },
  });
  const micro = calculate({
    weather: { ...clearWeather, cloudCover: 85 },
    config: { panelCount: 1_000, panelsPerString: 20, parallelStrings: 40, topology: "microinverter" },
  });
  assert.equal(micro.array.wiredPanels, 1_000);
  assert.equal(micro.array.unwiredPanels, 0);
  assert.ok(micro.solar > series.solar);
});

test("uses the turbine cut-in, cubic, rated and cut-out regions", () => {
  const belowCutIn = calculate({ weather: { ...clearWeather, windSpeed: 7.2 } });
  const cubic = calculate({ weather: { ...clearWeather, windSpeed: 28.8 } });
  const rated = calculate({ weather: { ...clearWeather, windSpeed: 50.4 } });
  const cutOut = calculate({ weather: { ...clearWeather, windSpeed: 97.2 } });
  assert.equal(belowCutIn.wind, 0);
  assert.ok(cubic.wind > 0 && cubic.wind < rated.wind);
  assert.ok(rated.wind > 1.7);
  assert.equal(cutOut.wind, 0);
});

test("charges BESS from renewable surplus within its C-rate", () => {
  const result = calculate({
    occupancy: 15,
    batterySoc: 40,
    config: {
      panelCount: 30_000,
      panelsPerString: 25,
      parallelStrings: 1_200,
      batteryKwh: 10_000,
      batteryCRate: 0.25,
    },
  });
  assert.ok(result.batteryCharge > 0);
  assert.ok(result.batteryCharge <= 2.5);
  assert.ok(result.batteryFlow > 0);
});

test("discharges BESS during a deficit while respecting reserve and C-rate", () => {
  const result = calculate({
    weather: { ...clearWeather, radiation: 0, windSpeed: 0 },
    batterySoc: 50,
    config: { batteryKwh: 4_000, batteryCRate: 0.25 },
  });
  assert.ok(result.batteryDischarge > 0);
  assert.ok(result.batteryDischarge <= 1);
  assert.ok(result.batteryFlow < 0);
});

test("does not discharge BESS below its reserve SoC", () => {
  const result = calculate({
    weather: { ...clearWeather, radiation: 0, windSpeed: 0 },
    batterySoc: 20,
  });
  assert.equal(result.batteryDischarge, 0);
});

test("schedules poor-weather pre-charge but activates it only off-peak", () => {
  const stormHourly = Array.from({ length: 72 }, (_, index) =>
    new Date(`2026-07-29T12:00:00`).getTime() + index * 3_600_000,
  );
  const stormWeather = (time) => ({
    temperature: 25,
    feelsLike: 27,
    cloudCover: 98,
    precipitation: 6,
    radiation: 80,
    windSpeed: 20,
    time,
    hourly: {
      time: stormHourly.map((value) => new Date(value).toISOString()),
      temperature_2m: stormHourly.map(() => 25),
      cloud_cover: stormHourly.map(() => 98),
      precipitation_probability: stormHourly.map(() => 90),
      wind_speed_10m: stormHourly.map(() => 20),
      shortwave_radiation: stormHourly.map(() => 80),
    },
  });
  const daytime = calculate({ weather: stormWeather("2026-07-29T14:00:00"), batterySoc: 40 });
  const night = calculate({ weather: stormWeather("2026-07-29T23:00:00"), batterySoc: 40 });
  assert.equal(daytime.prechargeScheduled, true);
  assert.equal(daytime.prechargeActive, false);
  assert.equal(night.prechargeScheduled, true);
  assert.equal(night.prechargeActive, true);
  assert.ok(night.prechargeMw > 0);
  assert.equal(night.batteryDischarge, 0);
});

test("uses diesel only after grid isolation and reports unsupported load", () => {
  const connected = calculate({
    weather: { ...clearWeather, radiation: 0, windSpeed: 0 },
    batterySoc: 20,
  });
  const islanded = calculate({
    weather: { ...clearWeather, radiation: 0, windSpeed: 0 },
    batterySoc: 20,
    gridOutage: true,
    config: { dieselCapacityMw: 2, dieselMinLoadPct: 30 },
  });
  assert.equal(connected.diesel, 0);
  assert.ok(connected.gridImport > 0);
  assert.ok(islanded.diesel > 0 && islanded.diesel <= 2);
  assert.equal(islanded.gridImport, 0);
  assert.ok(islanded.unmet > 0);
});

test("applies inverter, line and battery losses", () => {
  const result = calculate({
    occupancy: 15,
    batterySoc: 40,
    config: {
      panelCount: 30_000,
      panelsPerString: 25,
      parallelStrings: 1_200,
      inverterEfficiencyPct: 90,
      lineLossPct: 8,
      batteryRtePct: 75,
    },
  });
  assert.ok(result.losses.inverterMw > 0);
  assert.ok(result.losses.lineMw > 0);
  assert.ok(result.losses.batteryMw > 0);
  assert.ok(result.losses.totalMw > result.losses.lineMw);
});

test("returns finite baseline, hybrid, financial, efficiency and carbon metrics", () => {
  const result = calculate();
  const comparison = result.comparison;
  const values = [
    comparison.baseline.gridMwhDay,
    comparison.baseline.costDay,
    comparison.hybrid.gridMwhDay,
    comparison.hybrid.costDay,
    comparison.solarSelfConsumptionPct,
    comparison.autonomyPct,
    comparison.efficiencyGainPct,
    comparison.peakShavingPct,
    comparison.billReductionPct,
    comparison.carbonOffsetTonsYear,
  ];
  assert.ok(values.every(Number.isFinite));
  assert.ok(comparison.solarSelfConsumptionPct >= 0 && comparison.solarSelfConsumptionPct <= 100);
  assert.ok(comparison.autonomyPct >= 0 && comparison.autonomyPct <= 100);
});

test("hazard impacts can trip grid, disable battery and reduce renewable output", () => {
  const normal = calculate();
  const hazard = calculate({
    hazardImpact: {
      gridTrip: true,
      batteryAvailable: false,
      solarFactor: 0.5,
      windFactor: 0.4,
    },
  });
  assert.equal(hazard.gridOffline, true);
  assert.equal(hazard.batteryFlow, 0);
  assert.ok(hazard.solar < normal.solar);
  assert.ok(hazard.wind < normal.wind);
});

test("runs the complete energy model for every configured campus", () => {
  for (const configuredCampus of CAMPUSES) {
    const config = createDefaultEnergyConfig(configuredCampus);
    const result = calculateCampusEnergy({
      campus: configuredCampus,
      config,
      weather: clearWeather,
      occupancy: 72,
      batterySoc: 65,
      planningSummary: {},
      hazardImpact: {},
    });
    assert.ok(
      config.panelsPerString * config.parallelStrings >= config.panelCount,
      `${configuredCampus.shortName} has unwired default panels`,
    );
    assert.ok(Number.isFinite(result.solar), `${configuredCampus.shortName} solar is invalid`);
    assert.ok(Number.isFinite(result.demand), `${configuredCampus.shortName} demand is invalid`);
    assert.ok(Number.isFinite(result.grid), `${configuredCampus.shortName} grid is invalid`);
    assert.equal(result.forecast.length, 48, `${configuredCampus.shortName} forecast is incomplete`);
    assert.ok(result.comparison, `${configuredCampus.shortName} comparison is missing`);
  }
});
