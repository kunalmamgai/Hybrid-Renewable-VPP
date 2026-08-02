"""Configuration models — alert thresholds, building tiers, VNM sharing rules."""
from __future__ import annotations

from sqlalchemy import Column, String, Float, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    threshold_value = Column(Float, nullable=False)
    unit = Column(String, default="")
    active = Column(Boolean, default=True)
    severity = Column(String, default="warning")


class BuildingTier(Base):
    __tablename__ = "building_tiers"

    building_id = Column(String, primary_key=True)
    tier = Column(String, nullable=False, default="non_critical")
    description = Column(String, nullable=True)

    def to_dict(self) -> dict:
        return {
            "building_id": self.building_id,
            "tier": self.tier,
            "description": self.description,
        }


class VnmSharingRule(Base):
    __tablename__ = "vnm_sharing_rules"

    id = Column(String, primary_key=True)
    building_id = Column(String, nullable=False)
    sharing_ratio = Column(Float, nullable=False)  # 0.0 - 1.0
    rerc_rule_reference = Column(String, default="RERC Third Amendment Regulations, 2025")

    def to_dict(self) -> dict:
        return {
            "building_id": self.building_id,
            "sharing_ratio": self.sharing_ratio,
            "rerc_rule_reference": self.rerc_rule_reference,
        }
