/**
 * TypeScript type definitions for the Hybrid Renewable VPP Platform frontend.
 * These mirror the backend's Pydantic schemas.
 */

// ============================================================================
// Digital Twin Types
// ============================================================================

export type CriticalityTier = 'critical' | 'non_critical';

export interface BuildingTwin {
  building_id: string;
  name?: string;
  criticality_tier: CriticalityTier;
  solar_generation_kwh: number;
  wind_generation_kwh: number;
  consumption_kwh: number;
  battery_soc_pct: number;
  battery_health_pct: number;
  grid_import_kwh: number;
  grid_export_kwh: number;
  net_meter_units: number;
  tariff_inr_per_unit: number;
  predicted_solar_tomorrow_kwh: number;
  predicted_wind_tomorrow_kwh: number;
  predicted_demand_tomorrow_kwh: number;
  last_updated?: string;
}

export interface TurbineTwin {
  turbine_id: string;
  building_id: string;
  wind_speed_mps: number;
  wind_direction_deg: number;
  power_output_kw: number;
  cut_in_speed_mps: number;
  rated_speed_mps: number;
  cut_out_speed_mps: number;
  rated_power_kw: number;
  status: string;
}

export interface BatteryTwin {
  battery_id: string;
  building_id: string;
  soc_pct: number;
  health_pct: number;
  capacity_kwh: number;
  charge_rate_max_kw: number;
  discharge_rate_max_kw: number;
  temperature_c: number;
  voltage_v: number;
  current_a: number;
  power_kw: number;
}

export interface CampusState {
  buildings: BuildingTwin[];
  turbines: TurbineTwin[];
  batteries: BatteryTwin[];
  last_updated?: string;
}

// ============================================================================
// Decision Types
// ============================================================================

export type DecisionType = 'dispatch' | 'battery' | 'load_shift' | 'reliability' | 'vnm';

export interface Decision {
  decision_id: string;
  timestamp: string;
  decision_type: DecisionType;
  action: string;
  confidence_pct: number;
  reason: string;
  alternative_considered: string;
  expected_savings_inr: number;
  expected_carbon_reduction_kg: number;
  building_id?: string;
  battery_soc_after_pct: number;
  context?: Record<string, unknown>;
}

export interface DecisionStats {
  total_decisions: number;
  total_savings_inr: number;
  total_carbon_reduction_kg: number;
  timestamp: string;
}

// ============================================================================
// WebSocket Types
// ============================================================================

export interface WebSocketMessage {
  type: 'decision' | 'twin_update' | 'health' | 'full_cycle' | 'error';
  cycle_number?: number;
  timestamp?: string;
  data?: Decision;
  result?: FullCycleResult;
  buildings?: Record<string, BuildingTwin>;
  timestamp_of_data?: string;
  adapter?: Record<string, unknown>;
  scheduler_cycles?: number;
  clients?: number;
  message?: string;
}

export interface FullCycleResult {
  cycle_number: number;
  timestamp: string;
  decisions: Decision[];
  strategies_evaluated: number;
  reliability: ReliabilityStatus;
}

export interface ReliabilityStatus {
  reserve_floor_pct: number;
  critical_load_kw: number;
  non_critical_load_kw: number;
  shedding_priority: SheddingPriorityEntry[];
  emergency_mode: boolean;
  shortfall_predicted_kwh: number;
  reserve_duration_hours: number;
}

export interface SheddingPriorityEntry {
  building_id: string;
  criticality_tier: string;
  current_load_kw: number;
  peak_load_kw: number;
  priority: number;
}

// ============================================================================
// Live Snapshot (raw adapter data)
// ============================================================================

export interface LiveReading {
  building_id: string;
  criticality_tier: CriticalityTier;
  solar_generation_kwh: number;
  wind_generation_kwh: number;
  consumption_kwh: number;
  battery_soc_pct: number;
  battery_health_pct: number;
  grid_import_kwh: number;
  grid_export_kwh: number;
  net_meter_units: number;
  tariff_inr_per_unit: number;
}

export interface LiveSnapshot {
  data: Record<string, unknown>;
  adapter_type: string;
}

// ============================================================================
// Export Stats Types
// ============================================================================

export interface ExportStats {
  period: string;
  total_solar_generation_kwh: number;
  total_wind_generation_kwh: number;
  total_grid_import_kwh: number;
  total_grid_export_kwh: number;
  total_cost_savings_inr: number;
  total_carbon_reduction_kg: number;
  renewable_self_consumption_pct: number;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export interface SchedulerHealth {
  running: boolean;
  last_cycle?: string;
  cycles_completed: number;
}

// ============================================================================
// Settings Types [NEW]
// ============================================================================

export interface AlertThreshold {
  id: string;
  name: string;
  description?: string;
  threshold_value: number;
  unit: string;
  active: boolean;
  severity: 'warning' | 'critical';
}

export interface BuildingTierConfig {
  building_id: string;
  tier: string;
  description?: string;
}

export interface VnmSharingRule {
  building_id: string;
  sharing_ratio: number;
  rerc_rule_reference?: string;
}

// ============================================================================
// Scenario Types [NEW]
// ============================================================================

export interface Scenario {
  id: string;
  name: string;
  description: string;
  cloud_cover_base: number;
  wind_base: number;
  demand_peak_kw: number;
}

export interface ScenariosResponse {
  scenarios: Scenario[];
  current_scenario: string;
}

// ============================================================================
// Control Types [NEW]
// ============================================================================

export interface ForceCycleResponse {
  cycle_number: number;
  timestamp: string;
  decision?: FullCycleResult;
}
