"""Canonical site configuration — the single source of truth for the demo campus.

Used by the FastAPI app (backend/main.py), the scheduler standalone mode, and
the 24h simulation CLI (backend/simulator/run_simulation.py).
"""
from __future__ import annotations

from dataclasses import replace

from backend.adapters.simulated import SimulatedBuilding

# Standard campus configuration matching the PS requirements.
DEFAULT_BUILDINGS: list[SimulatedBuilding] = [
    SimulatedBuilding(
        building_id="academic_block",
        name="Academic Block A",
        criticality_tier="critical",
        solar_capacity_kw=150.0,
        wind_capacity_kw=60.0,
        battery_capacity_kwh=300.0,
        battery_soc_initial_pct=50.0,
        tariff_inr_per_unit=9.0,
        vnm_sharing_ratio=0.3,
    ),
    SimulatedBuilding(
        building_id="hostel_block",
        name="Girls Hostel",
        criticality_tier="critical",
        solar_capacity_kw=80.0,
        wind_capacity_kw=30.0,
        battery_capacity_kwh=150.0,
        battery_soc_initial_pct=60.0,
        tariff_inr_per_unit=9.0,
        vnm_sharing_ratio=0.4,
    ),
    SimulatedBuilding(
        building_id="admin_block",
        name="Admin Block",
        criticality_tier="non_critical",
        solar_capacity_kw=40.0,
        wind_capacity_kw=20.0,
        battery_capacity_kwh=100.0,
        battery_soc_initial_pct=40.0,
        tariff_inr_per_unit=9.0,
        vnm_sharing_ratio=0.2,
    ),
    SimulatedBuilding(
        building_id="lab_block",
        name="Science Lab Complex",
        criticality_tier="critical",
        solar_capacity_kw=60.0,
        wind_capacity_kw=25.0,
        battery_capacity_kwh=150.0,
        battery_soc_initial_pct=45.0,
        tariff_inr_per_unit=9.0,
        vnm_sharing_ratio=0.15,
    ),
]


def default_buildings() -> list[SimulatedBuilding]:
    """Return a fresh copy of the standard campus configuration."""
    return [replace(b) for b in DEFAULT_BUILDINGS]
