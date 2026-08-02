"""Pydantic schemas for API request/response serialization."""
from __future__ import annotations
from typing import Literal, Optional
from datetime import datetime

from pydantic import BaseModel, Field


class BuildingTwinResponse(BaseModel):
    building_id: str
    name: Optional[str] = None
    criticality_tier: Literal["critical", "non_critical"] = "non_critical"
    solar_generation_kwh: float
    wind_generation_kwh: float
    consumption_kwh: float
    battery_soc_pct: float
    battery_health_pct: float
    grid_import_kwh: float
    grid_export_kwh: float
    net_meter_units: float
    tariff_inr_per_unit: float
    predicted_solar_tomorrow_kwh: float
    predicted_wind_tomorrow_kwh: float
    predicted_demand_tomorrow_kwh: float
    last_updated: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TurbineTwinResponse(BaseModel):
    turbine_id: str
    building_id: str
    wind_speed_mps: float
    wind_direction_deg: float
    power_output_kw: float
    cut_in_speed_mps: float
    rated_speed_mps: float
    cut_out_speed_mps: float
    rated_power_kw: float
    status: str


class BatteryTwinResponse(BaseModel):
    battery_id: str
    building_id: str
    soc_pct: float
    health_pct: float
    capacity_kwh: float
    charge_rate_max_kw: float
    discharge_rate_max_kw: float
    temperature_c: float
    voltage_v: float
    current_a: float
    power_kw: float


class DecisionResponse(BaseModel):
    decision_id: str
    timestamp: datetime
    decision_type: str
    action: str
    confidence_pct: float
    reason: str
    alternative_considered: str
    expected_savings_inr: float
    expected_carbon_reduction_kg: float
    building_id: Optional[str] = None
    battery_soc_after_pct: float
    context: dict = Field(default_factory=dict)


class DecisionEvent(BaseModel):
    decision_id: str
    timestamp: str
    decision_type: str
    action: str
    confidence_pct: float
    reason: str
    alternative_considered: str
    expected_savings_inr: float
    expected_carbon_reduction_kg: float
    building_id: Optional[str] = None
    battery_soc_after_pct: float
    context: dict = Field(default_factory=dict)
