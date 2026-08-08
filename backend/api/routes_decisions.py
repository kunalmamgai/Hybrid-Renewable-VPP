"""API routes for decision logs and recommendations."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_session
from backend.models.decision_log import DecisionLog
from backend.models.schemas import DecisionResponse

router = APIRouter(prefix="/api/v1", tags=["decisions"])


@router.get("/decisions", response_model=list[DecisionResponse])
async def get_decisions(
    limit: int = 50,
    building_id: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Return recent decision logs."""
    stmt = select(DecisionLog).order_by(desc(DecisionLog.timestamp)).limit(limit)
    if building_id:
        stmt = stmt.where(DecisionLog.building_id == building_id)
    result = await session.execute(stmt)
    logs = result.scalars().all()
    return [DecisionResponse(decision_id=log.decision_id, timestamp=log.timestamp, decision_type=log.decision_type, action=log.action, confidence_pct=log.confidence_pct, reason=log.reason, alternative_considered=log.alternative_considered, expected_savings_inr=log.expected_savings_inr, expected_carbon_reduction_kg=log.expected_carbon_reduction_kg, building_id=log.building_id, battery_soc_after_pct=log.battery_soc_after_pct) for log in logs]


@router.get("/decisions/stats")
async def get_decision_stats(session: AsyncSession = Depends(get_session)):
    """Aggregate statistics on decisions."""
    row = (await session.execute(select(
        func.count(DecisionLog.id),
        func.coalesce(func.sum(DecisionLog.expected_savings_inr), 0.0),
        func.coalesce(func.sum(DecisionLog.expected_carbon_reduction_kg), 0.0),
    ))).one()
    return {
        "total_decisions": int(row[0]),
        "total_savings_inr": round(float(row[1]), 2),
        "total_carbon_reduction_kg": round(float(row[2]), 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
