const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const round = (value, digits = 3) => Number((Number(value) || 0).toFixed(digits));

export const TOPOLOGY_OPTIONS = {
  series: {
    label: "Series string inverter",
    efficiency: 0.965,
    shadeTolerance: 0.92,
  },
  parallel: {
    label: "Parallel string inverter",
    efficiency: 0.955,
    shadeTolerance: 0.96,
  },
  microinverter: {
    label: "Module microinverters",
    efficiency: 0.98,
    shadeTolerance: 0.99,
  },
};

export function createDefaultEnergyConfig(campus = {}) {
  const solarMw = campus.id === "vit-bhopal" ? 5.8 : campus.solarMw || 2.4;
  const panelWatt = 550;
  return {
    panelCount: Math.max(1, Math.round((solarMw * 1_000_000) / panelWatt)),
    panelWatt,
    tiltDeg: campus.city?.toLowerCase().includes("jodhpur") ? 25 : 23,
    topology: "series",
    panelsPerString: 22,
    parallelStrings: Math.max(1, Math.ceil((solarMw * 1_000_000) / panelWatt / 22)),
    batteryKwh: campus.id === "vit-bhopal" ? 12_000 : Math.max(4_000, Math.round((campus.baseDemand || 5) * 1_500)),
    batteryCRate: 0.5,
    batteryRtePct: 90,
    inverterEfficiencyPct: 97,
    lineLossPct: 2.2,
    windCapacityMw: campus.id === "vit-bhopal" ? 4.2 : campus.windMw || 1.8,
    dieselCapacityMw: campus.category === "Medical" ? 5.5 : Math.max(2, round((campus.baseDemand || 5) * 0.62, 1)),
    dieselMinLoadPct: 30,
    smartPrecharge: true,
    reserveSocPct: 22,
    targetSocPct: 82,
    offPeakTariff: 5.2,
    peakTariff: 9.4,
    exportTariff: 3.1,
    gridEmissionKgKwh: 0.71,
    dieselEmissionKgKwh: 0.82,
  };
}

export function buildForecast(weather = {}) {
  const hourly = weather.hourly;
  if (hourly?.time?.length) {
    const cutoff = Date.now() - 60 * 60 * 1_000;
    const futureIndexes = hourly.time
      .map((time, index) => ({ time, index }))
      .filter((item) => new Date(item.time).getTime() >= cutoff)
      .slice(0, 48);
    return futureIndexes.map(({ time, index }) => ({
      time,
      temperature: hourly.temperature_2m?.[index] ?? weather.temperature ?? 28,
      cloudCover: hourly.cloud_cover?.[index] ?? weather.cloudCover ?? 30,
      precipitationProbability: hourly.precipitation_probability?.[index] ?? 0,
      windSpeed: hourly.wind_speed_10m?.[index] ?? weather.windSpeed ?? 10,
      radiation: hourly.shortwave_radiation?.[index] ?? 0,
    }));
  }

  const stormy = (weather.precipitation || 0) > 1 || (weather.cloudCover || 0) > 80;
  const start = new Date();
  return Array.from({ length: 48 }, (_, index) => {
    const hour = (start.getHours() + index) % 24;
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const cloudTrend = clamp(
      (weather.cloudCover || 25) + (stormy ? Math.sin(index / 7) * 8 : Math.sin(index / 9) * 12),
      0,
      100,
    );
    return {
      time: new Date(start.getTime() + index * 3_600_000).toISOString(),
      temperature: round((weather.temperature || 28) + daylight * 5 - 2, 1),
      cloudCover: round(cloudTrend, 0),
      precipitationProbability: stormy ? clamp(55 + cloudTrend * 0.35, 0, 100) : clamp(cloudTrend - 35, 0, 55),
      windSpeed: round(Math.max(2, (weather.windSpeed || 10) + Math.sin(index / 4) * 4), 1),
      radiation: round(daylight * 900 * (1 - cloudTrend * 0.0075), 0),
    };
  });
}

export function analyseForecast(forecast = []) {
  const nextDay = forecast.slice(8, 32);
  const daylight = nextDay.filter((item) => item.radiation > 40);
  const meanCloud = daylight.length
    ? daylight.reduce((sum, item) => sum + item.cloudCover, 0) / daylight.length
    : 100;
  const meanRadiation = daylight.length
    ? daylight.reduce((sum, item) => sum + item.radiation, 0) / daylight.length
    : 0;
  const rainHours = nextDay.filter((item) => item.precipitationProbability >= 60).length;
  const score = clamp(meanCloud * 0.52 + rainHours * 4.5 + (meanRadiation < 280 ? 25 : 0), 0, 100);
  return {
    score: round(score, 0),
    level: score >= 70 ? "high" : score >= 45 ? "moderate" : "low",
    meanCloud: round(meanCloud, 0),
    meanRadiation: round(meanRadiation, 0),
    rainHours,
    poorSolarExpected: score >= 58,
  };
}

function windCapacityFactor(windKmh) {
  const speed = Math.max(0, windKmh || 0) / 3.6;
  if (speed < 3 || speed > 25) return 0;
  if (speed >= 12) return 1;
  return Math.pow((speed - 3) / 9, 3);
}

function isOffPeakHour(hour) {
  return hour >= 22 || hour < 6;
}

export function calculateCampusEnergy({
  campus = {},
  config,
  weather = {},
  occupancy = 70,
  batterySoc = 65,
  batteryMode = "auto",
  gridOutage = false,
  proposalVisible = true,
  planningSummary = {},
  hazardImpact = {},
}) {
  const settings = { ...createDefaultEnergyConfig(campus), ...config };
  const forecast = buildForecast(weather);
  const forecastRisk = analyseForecast(forecast);
  const topology = TOPOLOGY_OPTIONS[settings.topology] || TOPOLOGY_OPTIONS.series;
  const radiation = Math.max(0, weather.radiation || 0);
  const temperatureFactor = clamp(1 - Math.max(0, (weather.temperature || 25) - 25) * 0.004, 0.82, 1);
  const tiltFactor = clamp(Math.cos(((settings.tiltDeg - 23.5) * Math.PI) / 180), 0.78, 1);
  const shadingFactor = clamp(
    topology.shadeTolerance - (weather.cloudCover || 0) * (settings.topology === "series" ? 0.00035 : 0.00016),
    0.82,
    1,
  );
  const installedPanels = Math.max(1, Math.round(settings.panelCount));
  const wiredPanels = settings.topology === "microinverter"
    ? installedPanels
    : Math.min(
        installedPanels,
        Math.max(1, Math.round(settings.panelsPerString)) *
          Math.max(1, Math.round(settings.parallelStrings)),
      );
  const dcCapacityMw = (wiredPanels * settings.panelWatt) / 1_000_000;
  const pvDcMw = proposalVisible
    ? dcCapacityMw * clamp(radiation / 1_000, 0, 1.1) * temperatureFactor * tiltFactor * shadingFactor
    : 0;
  const inverterEfficiency = clamp(settings.inverterEfficiencyPct / 100, 0.7, 1);
  const lineEfficiency = clamp(1 - settings.lineLossPct / 100, 0.7, 1);
  const solarBeforeHazard = pvDcMw * topology.efficiency * inverterEfficiency * lineEfficiency;
  const plannedSolarMw = proposalVisible
    ? (planningSummary.requiredSolarMw || 0) * clamp(radiation / 1_000, 0, 1.05) * 0.91
    : 0;
  const solar = (solarBeforeHazard + plannedSolarMw) * (hazardImpact.solarFactor ?? 1);
  const windGross = proposalVisible
    ? settings.windCapacityMw * windCapacityFactor(weather.windSpeed)
    : 0;
  const wind = windGross * 0.94 * lineEfficiency * (hazardImpact.windFactor ?? 1);

  const time = new Date(weather.time || Date.now());
  const hour = Number.isNaN(time.getTime()) ? new Date().getHours() : time.getHours();
  const timeFactor = hour >= 9 && hour <= 17 ? 1 : hour >= 18 && hour <= 23 ? 0.82 : 0.54;
  const medicalFactor = campus.category === "Medical" ? 1.18 : 1;
  const baseDemand = campus.id === "vit-bhopal" ? 7.7 : campus.baseDemand || 5;
  const comfortDelta = Math.max(0, (weather.feelsLike || weather.temperature || 25) - 24);
  const coldDelta = Math.max(0, 18 - (weather.temperature || 25));
  const hvacMw = comfortDelta * 0.13 + coldDelta * 0.07;
  const plannedDemandMw =
    (planningSummary.peakDemandMw || 0) * (0.46 + occupancy / 190) * timeFactor;
  const demand =
    (baseDemand * (0.43 + occupancy / 145) * timeFactor + hvacMw) * medicalFactor +
    plannedDemandMw;

  const renewable = solar + wind;
  const directRenewable = Math.min(demand, renewable);
  let surplus = Math.max(0, renewable - demand);
  let shortfall = Math.max(0, demand - renewable);
  const batteryAvailable = proposalVisible && (hazardImpact.batteryAvailable ?? true);
  const batteryCapacityMwh = Math.max(0.1, settings.batteryKwh / 1_000);
  const batteryPowerLimitMw = Math.max(0.05, batteryCapacityMwh * settings.batteryCRate);
  const chargeEfficiency = Math.sqrt(clamp(settings.batteryRtePct / 100, 0.5, 1));
  const dischargeEfficiency = chargeEfficiency;
  const usableDischargeMwh = Math.max(0, batteryCapacityMwh * (batterySoc - settings.reserveSocPct) / 100);
  const availableChargeMwh = Math.max(0, batteryCapacityMwh * (settings.targetSocPct - batterySoc) / 100);
  const canDischarge = batteryAvailable && batterySoc > settings.reserveSocPct;
  const canCharge = batteryAvailable && batterySoc < settings.targetSocPct;
  const smartPrechargeScheduled =
    settings.smartPrecharge && forecastRisk.poorSolarExpected && batterySoc < settings.targetSocPct;
  const offPeak = isOffPeakHour(hour);

  let batteryChargeMw = 0;
  let batteryDischargeMw = 0;
  let prechargeMw = 0;
  if (canCharge && surplus > 0 && batteryMode !== "reserve") {
    batteryChargeMw = Math.min(surplus, batteryPowerLimitMw, availableChargeMwh / chargeEfficiency);
    surplus -= batteryChargeMw;
  }
  if (
    canDischarge &&
    shortfall > 0 &&
    batteryMode !== "charge" &&
    !(smartPrechargeScheduled && offPeak)
  ) {
    batteryDischargeMw = Math.min(shortfall / dischargeEfficiency, batteryPowerLimitMw, usableDischargeMwh);
    shortfall = Math.max(0, shortfall - batteryDischargeMw * dischargeEfficiency);
  }
  if (
    !gridOutage &&
    canCharge &&
    smartPrechargeScheduled &&
    offPeak &&
    batteryChargeMw < batteryPowerLimitMw
  ) {
    prechargeMw = Math.min(
      batteryPowerLimitMw - batteryChargeMw,
      availableChargeMwh / chargeEfficiency,
    );
    batteryChargeMw += prechargeMw;
  }

  const effectiveGridOutage = gridOutage || Boolean(hazardImpact.gridTrip);
  let diesel = 0;
  if (effectiveGridOutage && shortfall > 0) {
    diesel = Math.min(shortfall, settings.dieselCapacityMw);
    if (diesel > 0) {
      const minimumStable = settings.dieselCapacityMw * settings.dieselMinLoadPct / 100;
      diesel = Math.min(settings.dieselCapacityMw, Math.max(diesel, minimumStable));
      shortfall = Math.max(0, shortfall - diesel);
    }
  }

  const gridImport = effectiveGridOutage ? 0 : shortfall + prechargeMw;
  const gridExport = effectiveGridOutage ? 0 : surplus;
  const grid = gridImport - gridExport;
  const unmet = effectiveGridOutage ? shortfall : 0;
  const batteryFlow = batteryChargeMw - batteryDischargeMw;
  const inverterLossMw = pvDcMw * Math.max(0, 1 - topology.efficiency * inverterEfficiency);
  const lineLossMw = (solarBeforeHazard + windGross) * Math.max(0, 1 - lineEfficiency);
  const batteryLossMw =
    batteryChargeMw * (1 - chargeEfficiency) +
    batteryDischargeMw * (1 - dischargeEfficiency);
  const totalLossMw = inverterLossMw + lineLossMw + batteryLossMw;
  const renewableUsed = directRenewable + batteryChargeMw - prechargeMw;
  const renewableShare = demand
    ? clamp((directRenewable + batteryDischargeMw * dischargeEfficiency) / demand * 100, 0, 100)
    : 0;

  const tariff = offPeak ? settings.offPeakTariff : settings.peakTariff;
  const hoursPerDay = 24;
  const baselineGridMwhDay = demand * hoursPerDay / lineEfficiency;
  const recurringGridImportMw = Math.max(0, gridImport - prechargeMw);
  const hybridGridMwhDay = recurringGridImportMw * hoursPerDay + prechargeMw * 4;
  const dieselMwhDay = diesel * hoursPerDay;
  const exportMwhDay = gridExport * hoursPerDay;
  const baselineCostDay = baselineGridMwhDay * 1_000 * tariff;
  const hybridCostDay =
    recurringGridImportMw * hoursPerDay * 1_000 * tariff +
    prechargeMw * 4 * 1_000 * settings.offPeakTariff +
    dieselMwhDay * 1_000 * 22 -
    exportMwhDay * 1_000 * settings.exportTariff;
  const baselineEmissionsKgDay = baselineGridMwhDay * 1_000 * settings.gridEmissionKgKwh;
  const hybridEmissionsKgDay =
    hybridGridMwhDay * 1_000 * settings.gridEmissionKgKwh +
    dieselMwhDay * 1_000 * settings.dieselEmissionKgKwh;
  const sourceInputMw = renewable + gridImport + diesel + batteryDischargeMw;
  const hybridEfficiency = sourceInputMw > 0
    ? clamp((demand + batteryChargeMw + gridExport) / sourceInputMw * 100, 0, 100)
    : 100;
  const baselineEfficiency = lineEfficiency * 100;
  const solarSelfConsumption = solar > 0
    ? clamp((Math.min(solar, demand) + Math.min(batteryChargeMw, Math.max(0, solar - demand))) / solar * 100, 0, 100)
    : 0;

  return {
    solar: round(solar),
    solarDc: round(pvDcMw),
    wind: round(wind),
    diesel: round(diesel),
    renewable: round(renewable),
    renewableUsed: round(renewableUsed),
    demand: round(demand),
    batteryFlow: round(batteryFlow),
    batteryCharge: round(batteryChargeMw),
    batteryDischarge: round(batteryDischargeMw),
    grid: round(grid),
    gridImport: round(gridImport),
    gridExport: round(gridExport),
    unmet: round(unmet),
    share: round(renewableShare, 1),
    renewableShare: round(renewableShare, 1),
    gridOffline: effectiveGridOutage,
    prechargeScheduled: smartPrechargeScheduled,
    prechargeActive: prechargeMw > 0,
    prechargeMw: round(prechargeMw),
    forecast,
    forecastRisk,
    config: settings,
    topology,
    array: {
      installedPanels,
      wiredPanels,
      unwiredPanels: Math.max(0, installedPanels - wiredPanels),
      dcCapacityMw: round(dcCapacityMw, 3),
    },
    losses: {
      inverterMw: round(inverterLossMw),
      lineMw: round(lineLossMw),
      batteryMw: round(batteryLossMw),
      totalMw: round(totalLossMw),
    },
    comparison: {
      baseline: {
        gridMwhDay: round(baselineGridMwhDay, 1),
        costDay: round(baselineCostDay, 0),
        efficiencyPct: round(baselineEfficiency, 1),
        emissionsKgDay: round(baselineEmissionsKgDay, 0),
      },
      hybrid: {
        gridMwhDay: round(hybridGridMwhDay, 1),
        costDay: round(Math.max(0, hybridCostDay), 0),
        efficiencyPct: round(hybridEfficiency, 1),
        emissionsKgDay: round(hybridEmissionsKgDay, 0),
      },
      solarSelfConsumptionPct: round(solarSelfConsumption, 1),
      autonomyPct: round(demand ? clamp((1 - recurringGridImportMw / demand) * 100, 0, 100) : 100, 1),
      efficiencyGainPct: round(hybridEfficiency - baselineEfficiency, 1),
      peakShavingPct: round(demand ? clamp((1 - recurringGridImportMw / demand) * 100, 0, 100) : 100, 1),
      billReductionPct: round(baselineCostDay ? clamp((baselineCostDay - hybridCostDay) / baselineCostDay * 100, -100, 100) : 0, 1),
      carbonOffsetTonsYear: round(Math.max(0, baselineEmissionsKgDay - hybridEmissionsKgDay) * 365 / 1_000, 1),
    },
    dispatchRules: [
      renewable >= demand
        ? "Renewables serve the campus load first; surplus is routed to BESS, then export."
        : "Renewables serve the load first; BESS discharges above its reserve SoC.",
      smartPrechargeScheduled
        ? `${forecastRisk.level} forecast risk detected; off-peak grid pre-charge is ${offPeak ? "active" : "scheduled"}.`
        : "Forecast is acceptable; no grid pre-charge is required.",
      effectiveGridOutage
        ? "Grid is unavailable; diesel starts only after renewable and BESS support."
        : "Grid supplies the residual deficit and receives exportable surplus.",
    ],
  };
}
