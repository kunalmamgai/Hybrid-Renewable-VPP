export const BUILDING_TEMPLATES = {
  academic: {
    label: "Academic block",
    loadDensity: 62,
    hours: 10,
    color: "#5aaed0",
    criticality: "Medium",
  },
  laboratory: {
    label: "Research laboratory",
    loadDensity: 138,
    hours: 14,
    color: "#8b79d1",
    criticality: "High",
  },
  hostel: {
    label: "Student hostel",
    loadDensity: 48,
    hours: 20,
    color: "#d69a58",
    criticality: "Medium",
  },
  hospital: {
    label: "Hospital / clinical block",
    loadDensity: 172,
    hours: 24,
    color: "#d65f68",
    criticality: "Life safety",
  },
  library: {
    label: "Library and learning centre",
    loadDensity: 58,
    hours: 14,
    color: "#55a987",
    criticality: "Medium",
  },
  commercial: {
    label: "Shops and food court",
    loadDensity: 96,
    hours: 16,
    color: "#d28457",
    criticality: "Low",
  },
  sports: {
    label: "Indoor sports complex",
    loadDensity: 42,
    hours: 9,
    color: "#63a66e",
    criticality: "Low",
  },
};

export const SITE_OPTIONS = {
  north: { label: "North expansion zone", distance: 0.82 },
  south: { label: "South entrance zone", distance: 0.56 },
  east: { label: "East residential zone", distance: 0.74 },
  west: { label: "West academic zone", distance: 0.48 },
  energy: { label: "Energy infrastructure zone", distance: 0.22 },
};

export const HAZARD_SCENARIOS = {
  overload: {
    label: "Transformer overload and arc flash",
    asset: "33 kV substation",
    description: "Demand exceeds transformer capacity. Protection detects overcurrent, an arc-flash event is visualised and the feeder trips.",
    tripDelay: 2600,
  },
  transformerFire: {
    label: "Transformer fire",
    asset: "Main transformer",
    description: "A simulated insulation failure produces fire and smoke before differential protection isolates the transformer.",
    tripDelay: 2200,
  },
  batteryThermal: {
    label: "Battery thermal runaway",
    asset: "Battery energy storage system",
    description: "Battery temperature rises abnormally. The battery contactor opens and the storage system becomes unavailable.",
    tripDelay: 2400,
  },
  solarDcFire: {
    label: "Solar DC cable fire",
    asset: "Solar inverter feeder",
    description: "A simulated DC cable fault isolates the affected solar array and reduces available photovoltaic generation.",
    tripDelay: 2100,
  },
  windOverspeed: {
    label: "Wind turbine overspeed",
    asset: "Wind generation zone",
    description: "A turbine detects unsafe rotor speed and applies its emergency brake, removing wind generation from service.",
    tripDelay: 1800,
  },
  lightningStrike: {
    label: "Lightning strike and feeder trip",
    asset: "Campus distribution feeder",
    description: "A lightning impulse is visualised at the feeder. Surge protection operates and the affected circuit trips.",
    tripDelay: 1600,
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function predictBuilding(input, campusBaseDemand = 6) {
  const template = BUILDING_TEMPLATES[input.type] || BUILDING_TEMPLATES.academic;
  const footprint = clamp(Number(input.footprint) || 1800, 300, 20000);
  const floors = clamp(Number(input.floors) || 3, 1, 15);
  const occupancy = clamp(Number(input.occupancy) || 75, 10, 100);
  const efficiency = clamp(Number(input.efficiency) || 15, 0, 50);
  const operatingHours = clamp(Number(input.operatingHours) || template.hours, 4, 24);
  const site = SITE_OPTIONS[input.site] || SITE_OPTIONS.north;
  const grossArea = footprint * floors;
  const diversity = 0.58 + occupancy / 238;
  const peakDemandMw =
    (grossArea * template.loadDensity * (occupancy / 100) * (1 - efficiency / 100)) /
    1_000_000;
  const dailyEnergyMwh = peakDemandMw * operatingHours * diversity;
  const annualEnergyMwh = dailyEnergyMwh * 330;
  const requiredSolarMw = dailyEnergyMwh / (5.4 * 0.81);
  const panelWatt = 550;
  const panelArea = 2.58;
  const recommendedPanels = Math.ceil((requiredSolarMw * 1_000_000) / panelWatt);
  const rooftopPanels = Math.floor((footprint * 0.72) / panelArea);
  const groundPanels = Math.max(0, recommendedPanels - rooftopPanels);
  const installedSolarMw = (recommendedPanels * panelWatt) / 1_000_000;
  const transformerUnits = Math.max(1, Math.ceil(peakDemandMw / 1.25));
  const recommendedBatteryMwh = Math.max(0.5, peakDemandMw * 2.25);
  const reserveMarginMw = campusBaseDemand * 0.18 - peakDemandMw;
  const distributionLossPct = clamp(
    1.7 + site.distance * 2.4 + Math.max(0, peakDemandMw - campusBaseDemand * 0.12) * 1.2,
    1.7,
    9.8,
  );
  const dailyLossMwh = dailyEnergyMwh * (distributionLossPct / 100);
  const estimatedAnnualCostLakh = annualEnergyMwh * 0.082;
  const avoidedCo2Tonnes = installedSolarMw * 5.4 * 330 * 0.71;

  return {
    ...input,
    id: input.id || `proposal-${Date.now()}`,
    name: input.name?.trim() || template.label,
    footprint,
    floors,
    occupancy,
    efficiency,
    operatingHours,
    grossArea,
    peakDemandMw,
    dailyEnergyMwh,
    annualEnergyMwh,
    requiredSolarMw,
    installedSolarMw,
    recommendedPanels,
    rooftopPanels,
    groundPanels,
    transformerUnits,
    recommendedBatteryMwh,
    reserveMarginMw,
    distributionLossPct,
    dailyLossMwh,
    estimatedAnnualCostLakh,
    avoidedCo2Tonnes,
    template,
    siteLabel: site.label,
  };
}

export function aggregateProposals(proposals = []) {
  return proposals.reduce(
    (total, proposal) => ({
      peakDemandMw: total.peakDemandMw + proposal.peakDemandMw,
      dailyEnergyMwh: total.dailyEnergyMwh + proposal.dailyEnergyMwh,
      installedSolarMw: total.installedSolarMw + proposal.installedSolarMw,
      recommendedPanels: total.recommendedPanels + proposal.recommendedPanels,
      recommendedBatteryMwh:
        total.recommendedBatteryMwh + proposal.recommendedBatteryMwh,
      dailyLossMwh: total.dailyLossMwh + proposal.dailyLossMwh,
    }),
    {
      peakDemandMw: 0,
      dailyEnergyMwh: 0,
      installedSolarMw: 0,
      recommendedPanels: 0,
      recommendedBatteryMwh: 0,
      dailyLossMwh: 0,
    },
  );
}

export function proposalEnergyAtWeather(summary, weather) {
  const irradianceFactor = clamp((weather?.radiation || 0) / 1000, 0, 1.08);
  return summary.installedSolarMw * irradianceFactor * 0.88;
}

export function getHazardImpact(hazard) {
  if (!hazard || hazard.phase === "idle" || hazard.phase === "warning") {
    return {
      gridTrip: false,
      solarFactor: 1,
      windFactor: 1,
      batteryAvailable: true,
      capacityFactor: 1,
    };
  }

  const tripped = hazard.phase === "tripped";
  switch (hazard.type) {
    case "overload":
      return { gridTrip: tripped, solarFactor: 1, windFactor: 1, batteryAvailable: true, capacityFactor: tripped ? 0 : 0.35 };
    case "transformerFire":
      return { gridTrip: true, solarFactor: 1, windFactor: 1, batteryAvailable: true, capacityFactor: 0 };
    case "batteryThermal":
      return { gridTrip: false, solarFactor: 1, windFactor: 1, batteryAvailable: false, capacityFactor: 0.8 };
    case "solarDcFire":
      return { gridTrip: false, solarFactor: 0.16, windFactor: 1, batteryAvailable: true, capacityFactor: 0.82 };
    case "windOverspeed":
      return { gridTrip: false, solarFactor: 1, windFactor: 0, batteryAvailable: true, capacityFactor: 0.86 };
    case "lightningStrike":
      return { gridTrip: tripped, solarFactor: 0.72, windFactor: 0.35, batteryAvailable: true, capacityFactor: tripped ? 0 : 0.4 };
    default:
      return { gridTrip: false, solarFactor: 1, windFactor: 1, batteryAvailable: true, capacityFactor: 1 };
  }
}
