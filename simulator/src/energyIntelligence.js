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
    fixedDailyCharge: campus.category === "Medical" ? 18_000 : 12_000,
    demandChargePerKwMonth: 300,
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
    const normalisedForecast = futureIndexes.map(({ time, index }) => ({
      time,
      temperature: hourly.temperature_2m?.[index] ?? weather.temperature ?? 28,
      cloudCover: hourly.cloud_cover?.[index] ?? weather.cloudCover ?? 30,
      precipitationProbability: hourly.precipitation_probability?.[index] ?? 0,
      windSpeed: hourly.wind_speed_10m?.[index] ?? weather.windSpeed ?? 10,
      radiation: hourly.shortwave_radiation?.[index] ?? 0,
    }));
    if (normalisedForecast.length >= 24) return normalisedForecast;
  }

  const stormy = (weather.precipitation || 0) > 1 || (weather.cloudCover || 0) > 80;
  const startCandidate = new Date(weather.time || Date.now());
  const start = Number.isNaN(startCandidate.getTime()) ? new Date() : startCandidate;
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
    const prechargeHeadroom = Math.max(
      0,
      baseDemand * medicalFactor * 1.05 - (shortfall + batteryChargeMw),
    );
    prechargeMw = Math.min(
      batteryPowerLimitMw - batteryChargeMw,
      availableChargeMwh / chargeEfficiency,
      prechargeHeadroom,
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
    ? clamp(directRenewable / demand * 100, 0, 100)
    : 0;

  // Project the next 24 hours one hour at a time. The previous implementation
  // multiplied the current instant by 24, so a sunny moment could incorrectly
  // become a zero-grid, zero-bill day. This rolling dispatch keeps weather,
  // time-of-use load, storage state and utility charges coupled.
  const dailyProfile = [];
  const dayTotals = {
    demandMwh: 0,
    baselineGridMwh: 0,
    gridImportMwh: 0,
    gridExportMwh: 0,
    dieselMwh: 0,
    renewableGeneratedMwh: 0,
    renewableUsedMwh: 0,
    baselineEnergyCost: 0,
    hybridEnergyCost: 0,
    exportCredit: 0,
    dieselCost: 0,
    baselineEmissionsKg: 0,
    hybridEmissionsKg: 0,
    conversionLossMwh: 0,
    sourceInputMwh: 0,
    peakDemandMw: 0,
    peakGridImportMw: 0,
  };
  let projectedBatteryMwh = batteryCapacityMwh * clamp(batterySoc / 100, 0, 1);
  const reserveBatteryMwh = batteryCapacityMwh * settings.reserveSocPct / 100;
  const targetBatteryMwh = batteryCapacityMwh * settings.targetSocPct / 100;
  const projection = forecast.slice(0, 24);

  projection.forEach((item) => {
    const itemTime = new Date(item.time);
    const profileHour = Number.isNaN(itemTime.getTime()) ? 12 : itemTime.getHours();
    const profileTimeFactor = profileHour >= 9 && profileHour <= 17
      ? 1
      : profileHour >= 18 && profileHour <= 23
        ? 0.82
        : 0.54;
    const profileComfortDelta = Math.max(0, (item.temperature || 25) - 24);
    const profileColdDelta = Math.max(0, 18 - (item.temperature || 25));
    const profileDemand =
      (baseDemand * (0.43 + occupancy / 145) * profileTimeFactor +
        profileComfortDelta * 0.13 + profileColdDelta * 0.07) * medicalFactor +
      (planningSummary.peakDemandMw || 0) * (0.46 + occupancy / 190) * profileTimeFactor;

    const profileTemperatureFactor = clamp(
      1 - Math.max(0, (item.temperature || 25) - 25) * 0.004,
      0.82,
      1,
    );
    const profileShadingFactor = clamp(
      topology.shadeTolerance - (item.cloudCover || 0) *
        (settings.topology === "series" ? 0.00035 : 0.00016),
      0.82,
      1,
    );
    const profilePvDc = proposalVisible
      ? dcCapacityMw * clamp((item.radiation || 0) / 1_000, 0, 1.1) *
        profileTemperatureFactor * tiltFactor * profileShadingFactor
      : 0;
    const profileSolarBase = profilePvDc * topology.efficiency * inverterEfficiency * lineEfficiency;
    const profilePlannedSolar = proposalVisible
      ? (planningSummary.requiredSolarMw || 0) *
        clamp((item.radiation || 0) / 1_000, 0, 1.05) * 0.91
      : 0;
    const profileSolar = (profileSolarBase + profilePlannedSolar) *
      (hazardImpact.solarFactor ?? 1);
    const profileWindGross = proposalVisible
      ? settings.windCapacityMw * windCapacityFactor(item.windSpeed)
      : 0;
    const profileWind = profileWindGross * 0.94 * lineEfficiency *
      (hazardImpact.windFactor ?? 1);
    const profileRenewable = profileSolar + profileWind;
    let profileSurplus = Math.max(0, profileRenewable - profileDemand);
    let profileShortfall = Math.max(0, profileDemand - profileRenewable);
    let profileCharge = 0;
    let profileDischarge = 0;
    let profileGridPrecharge = 0;

    if (
      batteryAvailable && batteryMode !== "reserve" &&
      profileSurplus > 0 && projectedBatteryMwh < targetBatteryMwh
    ) {
      profileCharge = Math.min(
        profileSurplus,
        batteryPowerLimitMw,
        (targetBatteryMwh - projectedBatteryMwh) / chargeEfficiency,
      );
      projectedBatteryMwh += profileCharge * chargeEfficiency;
      profileSurplus -= profileCharge;
    }
    if (
      batteryAvailable && batteryMode !== "charge" &&
      profileShortfall > 0 && projectedBatteryMwh > reserveBatteryMwh
    ) {
      const maxFromStoredEnergy = (projectedBatteryMwh - reserveBatteryMwh) * dischargeEfficiency;
      profileDischarge = Math.min(profileShortfall, batteryPowerLimitMw, maxFromStoredEnergy);
      projectedBatteryMwh -= profileDischarge / dischargeEfficiency;
      profileShortfall -= profileDischarge;
    }

    const profileOffPeak = isOffPeakHour(profileHour);
    if (
      !effectiveGridOutage && batteryAvailable && settings.smartPrecharge &&
      forecastRisk.poorSolarExpected && profileOffPeak &&
      projectedBatteryMwh < targetBatteryMwh && profileCharge < batteryPowerLimitMw
    ) {
      const profilePrechargeHeadroom = Math.max(
        0,
        baseDemand * medicalFactor * 1.05 - profileShortfall,
      );
      profileGridPrecharge = Math.min(
        batteryPowerLimitMw - profileCharge,
        (targetBatteryMwh - projectedBatteryMwh) / chargeEfficiency,
        profilePrechargeHeadroom,
      );
      projectedBatteryMwh += profileGridPrecharge * chargeEfficiency;
      profileCharge += profileGridPrecharge;
    }

    let profileDiesel = 0;
    if (effectiveGridOutage && profileShortfall > 0) {
      profileDiesel = Math.min(profileShortfall, settings.dieselCapacityMw);
      if (profileDiesel > 0) {
        const minimumStable = settings.dieselCapacityMw * settings.dieselMinLoadPct / 100;
        profileDiesel = Math.min(settings.dieselCapacityMw, Math.max(profileDiesel, minimumStable));
        profileShortfall = Math.max(0, profileShortfall - profileDiesel);
      }
    }

    const profileGridImport = effectiveGridOutage
      ? 0
      : profileShortfall + profileGridPrecharge;
    const profileGridExport = effectiveGridOutage ? 0 : profileSurplus;
    const profileTariff = profileOffPeak ? settings.offPeakTariff : settings.peakTariff;
    const profileBaselineGrid = profileDemand / lineEfficiency;
    const profileRenewableUsed = Math.min(profileRenewable, profileDemand) +
      Math.max(0, profileCharge - profileGridPrecharge);
    const profileBatteryLoss =
      profileCharge * (1 - chargeEfficiency) +
      profileDischarge * (1 / dischargeEfficiency - 1);
    const profileConversionLoss =
      profilePvDc * Math.max(0, 1 - topology.efficiency * inverterEfficiency) +
      (profileSolarBase + profileWindGross) * Math.max(0, 1 - lineEfficiency) +
      profileBatteryLoss;

    dayTotals.demandMwh += profileDemand;
    dayTotals.baselineGridMwh += profileBaselineGrid;
    dayTotals.gridImportMwh += profileGridImport;
    dayTotals.gridExportMwh += profileGridExport;
    dayTotals.dieselMwh += profileDiesel;
    dayTotals.renewableGeneratedMwh += profileRenewable;
    dayTotals.renewableUsedMwh += profileRenewableUsed;
    dayTotals.baselineEnergyCost += profileBaselineGrid * 1_000 * profileTariff;
    dayTotals.hybridEnergyCost += profileGridImport * 1_000 * profileTariff;
    dayTotals.exportCredit += profileGridExport * 1_000 * settings.exportTariff;
    dayTotals.dieselCost += profileDiesel * 1_000 * 22;
    dayTotals.baselineEmissionsKg += profileBaselineGrid * 1_000 * settings.gridEmissionKgKwh;
    dayTotals.hybridEmissionsKg +=
      profileGridImport * 1_000 * settings.gridEmissionKgKwh +
      profileDiesel * 1_000 * settings.dieselEmissionKgKwh;
    dayTotals.conversionLossMwh += profileConversionLoss;
    dayTotals.sourceInputMwh += profileRenewable + profileGridImport + profileDiesel + profileDischarge;
    dayTotals.peakDemandMw = Math.max(dayTotals.peakDemandMw, profileDemand);
    dayTotals.peakGridImportMw = Math.max(dayTotals.peakGridImportMw, profileGridImport);

    dailyProfile.push({
      time: item.time,
      demand: round(profileDemand),
      renewable: round(profileRenewable),
      gridImport: round(profileGridImport),
      gridExport: round(profileGridExport),
      battery: round(profileDischarge - profileCharge),
      batterySoc: round(projectedBatteryMwh / batteryCapacityMwh * 100, 1),
    });
  });

  const fixedDailyCharge = Math.max(0, Number(settings.fixedDailyCharge) || 0);
  const demandRateDaily = Math.max(0, Number(settings.demandChargePerKwMonth) || 0) / 30;
  const baselineDemandCharge = dayTotals.peakDemandMw * 1_000 * demandRateDaily;
  // A 25% contract-demand ratchet prevents an unrealistic zero network bill
  // while the campus remains grid connected.
  const billedHybridDemandMw = effectiveGridOutage
    ? 0
    : Math.max(dayTotals.peakGridImportMw, dayTotals.peakDemandMw * 0.25);
  const hybridDemandCharge = billedHybridDemandMw * 1_000 * demandRateDaily;
  const baselineCostDay = dayTotals.baselineEnergyCost + fixedDailyCharge + baselineDemandCharge;
  const hybridCostDay = Math.max(
    fixedDailyCharge + hybridDemandCharge,
    dayTotals.hybridEnergyCost + dayTotals.dieselCost - dayTotals.exportCredit +
      fixedDailyCharge + hybridDemandCharge,
  );
  const baselineGridMwhDay = dayTotals.baselineGridMwh;
  const hybridGridMwhDay = dayTotals.gridImportMwh;
  const baselineEmissionsKgDay = dayTotals.baselineEmissionsKg;
  const hybridEmissionsKgDay = dayTotals.hybridEmissionsKg;
  const baselineEfficiency = lineEfficiency * 100;
  const solarSelfConsumption = dayTotals.renewableGeneratedMwh > 0
    ? clamp(dayTotals.renewableUsedMwh / dayTotals.renewableGeneratedMwh * 100, 0, 100)
    : 0;
  const projectedHybridEfficiency = dayTotals.sourceInputMwh > 0
    ? clamp((1 - dayTotals.conversionLossMwh / dayTotals.sourceInputMwh) * 100, 0, 100)
    : 100;

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
    dailyProfile,
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
        costDay: round(hybridCostDay, 0),
        efficiencyPct: round(projectedHybridEfficiency, 1),
        emissionsKgDay: round(hybridEmissionsKgDay, 0),
      },
      solarSelfConsumptionPct: round(solarSelfConsumption, 1),
      autonomyPct: round(dayTotals.demandMwh
        ? clamp((1 - dayTotals.gridImportMwh / dayTotals.demandMwh) * 100, 0, 100)
        : 0, 1),
      efficiencyGainPct: round(projectedHybridEfficiency - baselineEfficiency, 1),
      peakShavingPct: round(dayTotals.peakDemandMw
        ? clamp((1 - dayTotals.peakGridImportMw / dayTotals.peakDemandMw) * 100, 0, 100)
        : 0, 1),
      billReductionPct: round(baselineCostDay
        ? clamp((baselineCostDay - hybridCostDay) / baselineCostDay * 100, -100, 99.9)
        : 0, 1),
      carbonOffsetTonsYear: round(Math.max(0, baselineEmissionsKgDay - hybridEmissionsKgDay) * 365 / 1_000, 1),
      basis: {
        hours: projection.length,
        demandMwhDay: round(dayTotals.demandMwh, 1),
        renewableMwhDay: round(dayTotals.renewableGeneratedMwh, 1),
        gridExportMwhDay: round(dayTotals.gridExportMwh, 1),
        startSocPct: round(batterySoc, 1),
        endSocPct: round(projectedBatteryMwh / batteryCapacityMwh * 100, 1),
        fixedChargeDay: round(fixedDailyCharge, 0),
        baselineDemandCharge: round(baselineDemandCharge, 0),
        hybridDemandCharge: round(hybridDemandCharge, 0),
      },
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
