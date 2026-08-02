"""API routes for Digital Twin read operations."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_session
from backend.models.digital_twin import BuildingTwin, WindTurbineTwin, BatteryTwin

router = APIRouter(prefix="/api/v1", tags=["digital-twin"])


def get_adapter():
    """Get the active adapter from the app state."""
    from backend.main import app
    return app.state.adapter if hasattr(app.state, 'adapter') else None


@router.get("/digital-twin/buildings")
async def get_buildings(session: AsyncSession = Depends(get_session)):
    """Return all building digital twins."""
    result = await session.execute(select(BuildingTwin))
    buildings = result.scalars().all()
    return [b.to_dict() for b in buildings]


@router.get("/digital-twin/buildings/{building_id}")
async def get_building(building_id: str, session: AsyncSession = Depends(get_session)):
    """Return a single building digital twin."""
    result = await session.execute(select(BuildingTwin).where(BuildingTwin.id == building_id))
    building = result.scalar_one_or_none()
    if not building:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return building.to_dict()


@router.get("/digital-twin/turbines")
async def get_turbines(session: AsyncSession = Depends(get_session)):
    """Return all wind turbine digital twins."""
    result = await session.execute(select(WindTurbineTwin))
    turbines = result.scalars().all()
    return [t.to_dict() for t in turbines]


@router.get("/digital-twin/batteries")
async def get_batteries(session: AsyncSession = Depends(get_session)):
    """Return all battery digital twins."""
    result = await session.execute(select(BatteryTwin))
    batteries = result.scalars().all()
    return [b.to_dict() for b in batteries]


@router.get("/digital-twin/campus")
async def get_campus_state(session: AsyncSession = Depends(get_session)):
    """Return the full campus state (buildings + turbines + batteries)."""
    buildings_result = await session.execute(select(BuildingTwin))
    turbines_result = await session.execute(select(WindTurbineTwin))
    batteries_result = await session.execute(select(BatteryTwin))
    buildings = buildings_result.scalars().all()
    turbines = turbines_result.scalars().all()
    batteries = batteries_result.scalars().all()
    return {
        "buildings": [b.to_dict() for b in buildings],
        "turbines": [t.to_dict() for t in turbines],
        "batteries": [b.to_dict() for b in batteries],
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/digital-twin/live")
async def get_live_snapshot():
    """Get a quick snapshot from the live adapter (no DB needed)."""
    adapter = get_adapter()
    if adapter is None:
        raise HTTPException(status_code=503, detail="No adapter available")
    data = await adapter.read_sensors()
    return {"data": data, "adapter_type": adapter.adapter_type}
