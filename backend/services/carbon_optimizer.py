"""Carbon Optimization Engine — scores strategies by kg CO₂ reduction.

Carbon model:
  carbon = grid_import × grid_emission_factor

Renewable generation (solar, wind) has zero marginal carbon.
Battery charging from surplus has zero carbon; discharging offsets grid import.
Diesel generator has ~0.75 kg CO₂/kWh (diesel combustion).

The engine normalizes carbon across candidates for comparison.
"""
from __future__ import annotations
import logging
from typing import Any

from backend.services.forecast_engine import FullForecast

logger = logging.getLogger(__name__)


class CarbonOptimizer:
    """Scores candidates by carbon impact (kg CO₂).

    Grid emission factor: 0.74 kg CO₂/kWh (Rajasthan average, 2025)
    Diesel emission factor: 0.75 kg CO₂/kWh (diesel combustion)
    Solar/wind emission: 0 kg CO₂ (zero marginal)
    """

    def __init__(self, grid_emission_factor: float = 0.74, diesel_emission_factor: float = 0.75):
        self.grid_emission_factor = grid_emission_factor
        self.diesel_emission_factor = diesel_emission_factor

    async def score_candidate(self, candidate: Any, building_id: str, twin_snapshot: dict) -> dict:
        """Score a candidate by carbon impact. Returns kg CO₂ and normalized score."""
        grid_import = getattr(candidate, "grid_import_kw", 0)
        grid_export = getattr(candidate, "grid_export_kw", 0)

        import_kwh = grid_import * (5 / 60.0)
        export_kwh = grid_export * (5 / 60.0)

        # Carbon from grid import
        carbon_from_import = import_kwh * self.grid_emission_factor

        # Carbon offset by export (avoids fossil generation elsewhere)
        carbon_offset_by_export = export_kwh * self.grid_emission_factor

        net_carbon = carbon_from_import - carbon_offset_by_export

        return {
            "carbon_kg": round(net_carbon, 4),
            "carbon_from_import_kg": round(carbon_from_import, 4),
            "carbon_offset_by_export_kg": round(carbon_offset_by_export, 4),
            "emission_factor_kg_per_kwh": self.grid_emission_factor,
        }

    async def score_battery_candidate(self, candidate: Any, building_id: str, twin_snapshot: dict) -> dict:
        """Score a battery candidate's carbon impact."""
        discharge_kw = candidate.discharge_rate_kw
        charge_kw = candidate.charge_rate_kw

        discharge_kwh = discharge_kw * (5 / 60.0)
        charge_kwh = charge_kw * (5 / 60.0)

        # Discharging displaces grid import → carbon saved
        carbon_saved = discharge_kwh * self.grid_emission_factor
        # Charging from surplus → no carbon added (surplus would otherwise be exported)
        carbon_added = 0.0  # Assume charging from renewable surplus

        net_carbon = carbon_added - carbon_saved

        return {
            "carbon_kg": round(net_carbon, 4),
            "carbon_saved_kg": round(carbon_saved, 4),
            "carbon_added_kg": round(carbon_added, 4),
        }

    def normalize_carbons(self, carbons: list[float]) -> list[float]:
        """Normalize carbon scores to 0-1 range (higher = better = lower carbon).

        score = 1 - (carbon - min) / (max - min)
        Lowest carbon candidate gets 1.0.
        """
        if not carbons:
            return []
        min_c = min(carbons)
        max_c = max(carbons)
        if max_c == min_c:
            return [1.0] * len(carbons)
        return [1.0 - (c - min_c) / (max_c - min_c) for c in carbons]
