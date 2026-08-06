"""VNM/GNM Optimizer — allocates virtual/group net metering export credits.

Per RERC Third Amendment Regulations, 2025, a renewable energy producer with
multiple connections can share export credits across buildings under a single
sharing agreement. This module:

  1. Takes total net export (kWh) across the campus
  2. Allocates credits to each building per their pre-agreed sharing ratio
  3. Computes INR value of exported energy per building

This is a secondary differentiator (not the core ask) but grounded in real
Rajasthan regulation.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

from backend.config import settings

logger = logging.getLogger(__name__)


@dataclass
class VnmCandidate:
    """A candidate VNM/GNM credit allocation strategy."""
    allocation_method: str  # "proportional", "fixed_ratio", "critical_first"
    allocations: dict = field(default_factory=dict)  # building_id -> {kwh, inr}
    total_export_kwh: float = 0.0
    total_value_inr: float = 0.0
    reason: str = ""
    confidence_pct: float = 0.0


class VnmOptimizer:
    """Allocates VNM/GNM export credits across campus buildings.

    RERC rules:
      - Total export is allocated per the sharing agreement (filed with DERC)
      - Critical buildings (labs, hostels) get priority allocation
      - Non-critical buildings get remaining credits
      - All allocations are time-stamped for settlement
    """

    def __init__(self, sell_rate_inr: float = settings.default_tariff_sell_inr):
        self.sell_rate_inr = sell_rate_inr

    async def generate_candidates(
        self,
        twin_snapshot: dict,
    ) -> list[VnmCandidate]:
        """Generate VNM/GNM credit allocation candidates."""
        buildings_data = {k: v for k, v in twin_snapshot.items()
                          if not k.startswith("turbine_") and not k.startswith("battery_") and k != "timestamp"}

        # Calculate per-building export and VNM sharing ratios
        building_exports = {}
        building_ratios = {}
        total_export = 0.0

        for bid, bdata in buildings_data.items():
            if not isinstance(bdata, dict):
                continue
            export = bdata.get("grid_export_kwh", 0) * 12.0  # Convert to kW
            building_exports[bid] = export
            total_export += export

            # VNM sharing ratio: use configured ratio or fallback to tier-based
            ratio = bdata.get("vnm_sharing_ratio")
            if ratio is not None:
                building_ratios[bid] = ratio
            else:
                tier = bdata.get("criticality_tier", "non_critical")
                building_ratios[bid] = 0.15 if tier == "critical" else 0.10

        # Normalize ratios to sum to 1.0
        total_ratio = sum(building_ratios.values())
        if total_ratio > 0:
            building_ratios = {k: v / total_ratio for k, v in building_ratios.items()}
        else:
            building_ratios = {bid: 1.0 / max(1, len(building_exports)) for bid in building_exports}

        candidates = []

        # Candidate 1: Proportional allocation
        alloc_proportional = {}
        total_value = 0.0
        for bid, ratio in building_ratios.items():
            export_kwh = total_export * ratio
            value_inr = export_kwh * (self.sell_rate_inr / 12.0)  # Per 5-min reading
            alloc_proportional[bid] = {"kwh": round(export_kwh, 2), "inr": round(value_inr, 2)}
            total_value += value_inr

        candidates.append(VnmCandidate(
            allocation_method="proportional",
            allocations=alloc_proportional,
            total_export_kwh=round(total_export, 2),
            total_value_inr=round(total_value, 2),
            reason=f"Credits allocated by RERC sharing ratio. Total export: {total_export:.1f} kW, value: ₹{total_value:.2f}",
            confidence_pct=85,
        ))

        # Candidate 2: Critical-first allocation
        alloc_critical = {}
        critical_buildings = {bid: data for bid, data in buildings_data.items()
                              if isinstance(data, dict) and data.get("criticality_tier") == "critical"}
        non_critical_buildings = {bid: data for bid, data in buildings_data.items()
                                   if isinstance(data, dict) and data.get("criticality_tier") == "non_critical"}

        # Critical gets 70% of export value, non-critical gets 30%
        critical_ratios = {bid: 0.7 / max(1, len(critical_buildings)) for bid in critical_buildings}
        nc_ratios = {bid: 0.3 / max(1, len(non_critical_buildings)) for bid in non_critical_buildings}
        all_ratios = {**critical_ratios, **nc_ratios}

        total_value_crit = 0.0
        for bid, ratio in all_ratios.items():
            export_kwh = total_export * ratio
            value_inr = export_kwh * (self.sell_rate_inr / 12.0)
            alloc_critical[bid] = {"kwh": round(export_kwh, 2), "inr": round(value_inr, 2)}
            total_value_crit += value_inr

        candidates.append(VnmCandidate(
            allocation_method="critical_first",
            allocations=alloc_critical,
            total_export_kwh=round(total_export, 2),
            total_value_inr=round(total_value_crit, 2),
            reason="Critical buildings (labs, hostels) receive 70% of VNM credits per RERC priority rules.",
            confidence_pct=80,
        ))

        return candidates
