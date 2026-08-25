"""API routes for facilities settings — alert thresholds, building tiers, VNM sharing rules."""
from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.adapters.simulated import SCENARIOS
from backend.api.routes_auth import get_current_user
from backend.db.database import get_session
from backend.models.config import AlertThreshold, BuildingTier, VnmSharingRule

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_user)],
)


# ─── Pydantic Schemas ────────────────────────────────────────────────

class AlertThresholdUpdate(BaseModel):
    threshold_value: float = Field(ge=0.0, le=1_000_000.0)
    active: bool = True


class BuildingTierUpdate(BaseModel):
    tier: Literal["critical", "non_critical"]
    description: str | None = Field(default=None, max_length=255)


class VnmSharingRuleUpdate(BaseModel):
    sharing_ratio: float = Field(ge=0.0, le=1.0)


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
async def get_scenarios(request: Request):
    """Return available simulation scenarios."""
    return {
        "scenarios": [
            {
                "id": scenario_id,
                "name": definition["name"],
                "description": definition["description"],
                "cloud_cover_base": definition["cloud_cover_base"],
                "wind_base": definition["wind_base"],
                "demand_peak_kw": definition["demand_peak_kw"],
            }
            for scenario_id, definition in SCENARIOS.items()
        ],
        "current_scenario": _get_current_scenario(request),
    }


def _get_adapter(request: Request):
    return request.app.state.adapter if hasattr(request.app.state, "adapter") else None


def _get_current_scenario(request: Request) -> str:
    """Get the current active scenario from the adapter."""
    adapter = _get_adapter(request)
    if adapter:
        return adapter.config.scenario
    return "mvp_day"


@router.post("/scenarios/{scenario_id}")
async def switch_scenario(scenario_id: str, request: Request):
    """Switch the simulator to a different weather scenario."""
    adapter = _get_adapter(request)
    if not adapter:
        raise HTTPException(status_code=503, detail="No adapter available")

    if scenario_id not in SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario: {scenario_id}. Valid: {list(SCENARIOS.keys())}"
        )

    adapter.config.scenario = scenario_id
    logger.info(f"Switched scenario to: {scenario_id}")
    return {
        "scenario": scenario_id,
        "message": f"Scenario switched to '{scenario_id}'",
    }


# ─── Force Cycle ─────────────────────────────────────────────────────

@router.post("/force-cycle")
async def force_cycle(request: Request):
    """Manually trigger one decision cycle."""
    scheduler = request.app.state.scheduler if hasattr(request.app.state, "scheduler") else None
    if not scheduler:
        raise HTTPException(status_code=503, detail="Scheduler not initialized")

    result = await scheduler.force_cycle()
    return {
        "cycle_number": result["cycle_number"],
        "timestamp": result["timestamp"],
        "decision": result.get("decision"),
    }
