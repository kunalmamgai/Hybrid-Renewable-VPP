"""API routes for decision logs and recommendations."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from backend.db.database import get_session
from backend.models.decision_log import DecisionLog
from backend.models.schemas import DecisionResponse

router = APIRouter(prefix="/api/v1", tags=["decisions"])


@router.get("/decisions", response_model=List[DecisionResponse])
async def get_decisions(
    limit: int = 50,
    building_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    """Return recent decision logs."""
    stmt = select(DecisionLog).order_by(desc(DecisionLog.timestamp)).limit(limit)
    if building_id:
        stmt = stmt.where(DecisionLog.building_id == building_id)
    result = await session.execute(stmt)
    logs = result.scalars().all()
    return [DecisionResponse(**{
        "decision_id": log.decision_id,
        "timestamp": log.timestamp,
        "decision_type": log.decision_type,
        "action": log.action,
        "confidence_pct": log.confidence_pct,
        "reason": log.reason,
        "alternative_considered": log.alternative_considered,
        "expected_savings_inr": log.expected_savings_inr,
        "expected_carbon_reduction_kg": log.expected_carbon_reduction_kg,
        "building_id": log.building_id,
        "battery_soc_after_pct": log.battery_soc_after_pct,
    }) for log in logs]


@router.get("/decisions/latest", response_model=Optional[DecisionResponse])
async def get_latest_decision(session: AsyncSession = Depends(get_session)):
    """Return the most recent decision."""
    result = await session.execute(
        select(DecisionLog).order_by(desc(DecisionLog.timestamp)).limit(1)
    )
    log = result.scalar_one_or_none()
    if not log:
        return None
    return DecisionResponse(**{
        "decision_id": log.decision_id,
        "timestamp": log.timestamp,
        "decision_type": log.decision_type,
        "action": log.action,
        "confidence_pct": log.confidence_pct,
        "reason": log.reason,
        "alternative_considered": log.alternative_considered,
        "expected_savings_inr": log.expected_savings_inr,
        "expected_carbon_reduction_kg": log.expected_carbon_reduction_kg,
        "building_id": log.building_id,
        "battery_soc_after_pct": log.battery_soc_after_pct,
    })


@router.get("/decisions/stats")
async def get_decision_stats(session: AsyncSession = Depends(get_session)):
    """Aggregate statistics on decisions."""
    result = await session.execute(select(DecisionLog))
    all_logs = result.scalars().all()
    total_savings = sum(log.expected_savings_inr for log in all_logs)
    total_carbon = sum(log.expected_carbon_reduction_kg for log in all_logs)
    return {
        "total_decisions": len(all_logs),
        "total_savings_inr": round(total_savings, 2),
        "total_carbon_reduction_kg": round(total_carbon, 2),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
