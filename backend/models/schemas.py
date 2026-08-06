"""Pydantic schemas for API request/response serialization."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


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
    building_id: str | None = None
    battery_soc_after_pct: float
    context: dict = Field(default_factory=dict)