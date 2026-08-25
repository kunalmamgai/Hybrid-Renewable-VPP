"""API routes for decision logs and recommendations."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.routes_auth import User, get_current_user
from backend.db.database import get_session
from backend.models.decision_log import DecisionLog
from backend.models.schemas import DecisionResponse

router = APIRouter(prefix="/api/v1", tags=["decisions"], dependencies=[Depends(get_current_user)])


@router.get("/decisions", response_model=list[DecisionResponse])
async def get_decisions(
    limit: int = Query(default=50, ge=1, le=500),
    building_id: str | None = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Return recent decision logs."""
    stmt = select(DecisionLog).order_by(desc(DecisionLog.timestamp)).limit(limit)
    if building_id:
        stmt = stmt.where(DecisionLog.building_id == building_id)
    result = await session.execute(stmt)
    logs = result.scalars().all()
    return [DecisionResponse.model_validate(log) for log in logs]


@router.get("/decisions/stats")
async def get_decision_stats(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
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
