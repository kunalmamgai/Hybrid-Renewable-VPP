"""Decision Log SQLAlchemy model — immutable audit trail of every automated decision."""
from __future__ import annotations
import json

from sqlalchemy import Column, String, Float, DateTime, Text, func
from sqlalchemy.dialects.sqlite import BLOB
from sqlalchemy.orm import declarative_base
import uuid

Base = declarative_base()


class DecisionLog(Base):
    __tablename__ = "decision_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id = Column(String, index=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=func.now(), index=True)

    decision_type = Column(String, nullable=False)
    action = Column(String, nullable=False)
    confidence_pct = Column(Float, default=0.0)

    reason = Column(Text, nullable=False)
    alternative_considered = Column(Text, default="")
    expected_savings_inr = Column(Float, default=0.0)
    expected_carbon_reduction_kg = Column(Float, default=0.0)

    building_id = Column(String, nullable=True, index=True)
    battery_soc_after_pct = Column(Float, default=0.0)

    # Full context snapshot as JSON string
    context_json = Column(Text, default="{}")
    candidate_scores_json = Column(Text, default="{}")

    def to_dict(self) -> dict:
        return {
            "decision_id": self.decision_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "decision_type": self.decision_type,
            "action": self.action,
            "confidence_pct": round(self.confidence_pct, 1),
            "reason": self.reason,
            "alternative_considered": self.alternative_considered,
            "expected_savings_inr": round(self.expected_savings_inr, 2),
            "expected_carbon_reduction_kg": round(self.expected_carbon_reduction_kg, 3),
            "building_id": self.building_id,
            "battery_soc_after_pct": round(self.battery_soc_after_pct, 1),
            "context": json.loads(self.context_json) if self.context_json else {},
        }
