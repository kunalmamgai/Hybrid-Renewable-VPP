"""Cost Optimization Engine — scores strategies by INR savings.

Cost model:
  cost = grid_import × tariff_buy_rate - grid_export × tariff_sell_rate

The engine normalizes cost across all candidates so the Decision Manager
can compare them on a 0-1 scale alongside carbon.
"""
from __future__ import annotations

import logging
from typing import Any

from backend.config import settings

logger = logging.getLogger(__name__)


class CostOptimizer:
    """Scores candidates by INR cost impact."""

    def __init__(self, tariff_buy: float = settings.default_tariff_buy_inr, tariff_sell: float = settings.default_tariff_sell_inr):
        self.tariff_buy = tariff_buy
        self.tariff_sell = tariff_sell

    async def score_candidate(self, candidate: Any, building_id: str, twin_snapshot: dict) -> dict:
        """Score a candidate by cost savings. Returns structured cost breakdown.

        Lower cost = higher score. Normalization is done by the DecisionManager
        across all candidates in the current cycle.
        """
        # Calculate cost for this candidate
        grid_import = getattr(candidate, "grid_import_kw", 0)
        grid_export = getattr(candidate, "grid_export_kw", 0)

        # Cost = (import cost) - (export revenue)
        # In INR per 5-min interval: import_kwh × tariff_buy - export_kwh × tariff_sell
        import_kwh = grid_import * (5 / 60.0)
        export_kwh = grid_export * (5 / 60.0)
        cost_inr = import_kwh * self.tariff_buy - export_kwh * self.tariff_sell

        # Return a structured result
        return {
            "cost_inr": round(cost_inr, 4),
            "grid_import_kwh": round(import_kwh, 2),
            "grid_export_kwh": round(export_kwh, 2),
            "import_cost_inr": round(import_kwh * self.tariff_buy, 4),
            "export_revenue_inr": round(export_kwh * self.tariff_sell, 4),
        }

    def normalize_costs(self, costs: list[float]) -> list[float]:
        """Normalize cost scores to 0-1 range (higher = better = lower cost).

        Uses min-max normalization: score = 1 - (cost - min) / (max - min)
        So the cheapest candidate gets score 1.0, most expensive gets 0.0.
        """
        if not costs:
            return []
        min_cost = min(costs)
        max_cost = max(costs)
        if max_cost == min_cost:
            return [1.0] * len(costs)
        return [1.0 - (c - min_cost) / (max_cost - min_cost) for c in costs]
