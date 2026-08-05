"""API routes for facilities settings — alert thresholds, building tiers, VNM sharing rules."""
from __future__ import annotations
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_session
from backend.models.config import AlertThreshold, BuildingTier, VnmSharingRule

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


# ─── Pydantic Schemas ────────────────────────────────────────────────

class AlertThresholdUpdate(BaseModel):
    threshold_value: float
    active: bool = True


class AlertThresholdCreate(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    threshold_value: float
    unit: str = ""
    active: bool = True
    severity: str = "warning"


class BuildingTierUpdate(BaseModel):
    tier: str
    description: Optional[str] = None


class VnmSharingRuleUpdate(BaseModel):
    sharing_ratio: float


# ─── Alert Thresholds ────────────────────────────────────────────────

@router.get("/alert-thresholds")
async def get_alert_thresholds(session: AsyncSession = Depends(get_session)):
    """Return all configured alert thresholds."""
    result = await session.execute(select(AlertThreshold))
    thresholds = result.scalars().all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "threshold_value": t.threshold_value,
            "unit": t.unit,
            "active": t.active,
            "severity": t.severity,
        }
        for t in thresholds
    ]


@router.put("/alert-thresholds/{threshold_id}")
async def update_alert_threshold(
    threshold_id: str,
    payload: AlertThresholdUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update an alert threshold value."""
    threshold = await session.get(AlertThreshold, threshold_id)
    if not threshold:
        raise HTTPException(status_code=404, detail=f"Threshold {threshold_id} not found")
    threshold.threshold_value = payload.threshold_value
    threshold.active = payload.active
    await session.commit()
    await session.refresh(threshold)
    logger.info(f"Updated threshold {threshold_id}: {payload.threshold_value}")
    return {
        "id": threshold.id,
        "name": threshold.name,
        "description": threshold.description,
        "threshold_value": threshold.threshold_value,
        "unit": threshold.unit,
        "active": threshold.active,
        "severity": threshold.severity,
    }


# ─── Building Tiers ──────────────────────────────────────────────────

@router.get("/building-tiers")
async def get_building_tiers(session: AsyncSession = Depends(get_session)):
    """Return all building criticality tiers."""
    result = await session.execute(select(BuildingTier))
    tiers = result.scalars().all()
    return [t.to_dict() for t in tiers]


@router.put("/building-tiers/{building_id}")
async def update_building_tier(
    building_id: str,
    payload: BuildingTierUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update a building's criticality tier."""
    existing = await session.get(BuildingTier, building_id)
    if existing:
        existing.tier = payload.tier
        existing.description = payload.description
    else:
        existing = BuildingTier(
            building_id=building_id,
            tier=payload.tier,
            description=payload.description,
        )
        session.add(existing)
    await session.commit()
    await session.refresh(existing)
    logger.info(f"Updated building tier for {building_id}: {payload.tier}")
    return existing.to_dict()


# ─── VNM Sharing Rules ───────────────────────────────────────────────

@router.get("/vnm-sharing-rules")
async def get_vnm_sharing_rules(session: AsyncSession = Depends(get_session)):
    """Return all VNM sharing rules."""
    result = await session.execute(select(VnmSharingRule))
    rules = result.scalars().all()
    return [r.to_dict() for r in rules]


@router.put("/vnm-sharing-rules/{building_id}")
async def update_vnm_sharing_rule(
    building_id: str,
    payload: VnmSharingRuleUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update the VNM sharing ratio for a building."""
    # Find by building_id since id is auto-generated
    result = await session.execute(
        select(VnmSharingRule).where(VnmSharingRule.building_id == building_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.sharing_ratio = payload.sharing_ratio
    else:
        import uuid
        existing = VnmSharingRule(
            id=f"vnm_{building_id}",
            building_id=building_id,
            sharing_ratio=payload.sharing_ratio,
        )
        session.add(existing)
    await session.commit()
    await session.refresh(existing)
    logger.info(f"Updated VNM sharing for {building_id}: {payload.sharing_ratio}")
    return existing.to_dict()


# ─── Scenario Control ────────────────────────────────────────────────

@router.get("/scenarios")
async def get_scenarios():
    """Return available simulation scenarios."""
    return {
        "scenarios": [
            {
                "id": "mvp_day",
                "name": "Normal Day",
                "description": "Typical sunny day with moderate wind and normal demand",
                "cloud_cover_base": 0.15,
                "wind_base": 5.5,
                "demand_peak_kw": 180,
            },
            {
                "id": "cloudy_still_afternoon",
                "name": "Cloudy Still Afternoon",
                "description": "Heavy clouds reduce solar, wind is calm — battery must compensate",
                "cloud_cover_base": 0.8,
                "wind_base": 3.2,
                "demand_peak_kw": 160,
            },
            {
                "id": "wind_fills_solar_gap",
                "name": "Wind Fills Solar Gap",
                "description": "Overcast day but strong winds keep the campus powered",
                "cloud_cover_base": 0.6,
                "wind_base": 8.0,
                "demand_peak_kw": 150,
            },
            {
                "id": "shortfall_protects_hostel",
                "name": "Shortfall Protects Hostel",
                "description": "Severe weather — system sheds admin block to protect hostel",
                "cloud_cover_base": 0.9,
                "wind_base": 2.8,
                "demand_peak_kw": 200,
            },
        ],
        "current_scenario": _get_current_scenario(),
    }


def _get_current_scenario() -> str:
    """Get the current active scenario from the adapter."""
    from backend.main import app
    adapter = app.state.adapter if hasattr(app.state, 'adapter') else None
    if adapter:
        return adapter.config.scenario
    return "mvp_day"


@router.post("/scenarios/{scenario_id}")
async def switch_scenario(scenario_id: str):
    """Switch the simulator to a different weather scenario."""
    from backend.main import app
    adapter = app.state.adapter if hasattr(app.state, 'adapter') else None
    if not adapter:
        raise HTTPException(status_code=503, detail="No adapter available")

    valid_scenarios = ["mvp_day", "cloudy_still_afternoon", "wind_fills_solar_gap", "shortfall_protects_hostel"]
    if scenario_id not in valid_scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario: {scenario_id}. Valid: {valid_scenarios}"
        )

    adapter.config.scenario = scenario_id
    logger.info(f"Switched scenario to: {scenario_id}")
    return {
        "scenario": scenario_id,
        "message": f"Scenario switched to '{scenario_id}'",
    }


# ─── Force Cycle ─────────────────────────────────────────────────────

@router.post("/force-cycle")
async def force_cycle():
    """Manually trigger one decision cycle."""
    from backend.main import app
    scheduler = app.state.scheduler if hasattr(app.state, 'scheduler') else None
    if not scheduler:
        raise HTTPException(status_code=503, detail="Scheduler not initialized")

    result = await scheduler.force_cycle()
    return {
        "cycle_number": result["cycle_number"],
        "timestamp": result["timestamp"],
        "decision": result.get("decision"),
    }
