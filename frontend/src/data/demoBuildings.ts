import type { BuildingTwin } from '../types';

export const DEMO_BUILDINGS: BuildingTwin[] = [
  {
    building_id: 'academic_block', name: 'Academic Block', criticality_tier: 'critical',
    solar_generation_kwh: 15.8, wind_generation_kwh: 4.1, consumption_kwh: 24.2,
    battery_soc_pct: 68, battery_health_pct: 96, grid_import_kwh: 5.2,
    grid_export_kwh: 0, net_meter_units: 0, tariff_inr_per_unit: 8.4,
    predicted_solar_tomorrow_kwh: 920, predicted_wind_tomorrow_kwh: 270,
    predicted_demand_tomorrow_kwh: 1440,
  },
  {
    building_id: 'hostel_zone', name: 'Hostel Zone', criticality_tier: 'critical',
    solar_generation_kwh: 11.4, wind_generation_kwh: 3.2, consumption_kwh: 19.6,
    battery_soc_pct: 64, battery_health_pct: 94, grid_import_kwh: 5,
    grid_export_kwh: 0, net_meter_units: 0, tariff_inr_per_unit: 8.4,
    predicted_solar_tomorrow_kwh: 740, predicted_wind_tomorrow_kwh: 210,
    predicted_demand_tomorrow_kwh: 1180,
  },
  {
    building_id: 'lab_complex', name: 'Lab Complex', criticality_tier: 'non_critical',
    solar_generation_kwh: 8.6, wind_generation_kwh: 2.5, consumption_kwh: 14.8,
    battery_soc_pct: 71, battery_health_pct: 97, grid_import_kwh: 3.7,
    grid_export_kwh: 0, net_meter_units: 0, tariff_inr_per_unit: 8.4,
    predicted_solar_tomorrow_kwh: 560, predicted_wind_tomorrow_kwh: 170,
    predicted_demand_tomorrow_kwh: 890,
  },
  {
    building_id: 'campus_services', name: 'Campus Services', criticality_tier: 'non_critical',
    solar_generation_kwh: 6.9, wind_generation_kwh: 1.8, consumption_kwh: 10.1,
    battery_soc_pct: 66, battery_health_pct: 95, grid_import_kwh: 1.4,
    grid_export_kwh: 0, net_meter_units: 0, tariff_inr_per_unit: 8.4,
    predicted_solar_tomorrow_kwh: 430, predicted_wind_tomorrow_kwh: 120,
    predicted_demand_tomorrow_kwh: 610,
  },
];
