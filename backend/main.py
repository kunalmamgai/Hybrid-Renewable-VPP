"""FastAPI application entry point."""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from backend.adapters.simulated import (
    SimulatedAdapter,
    SimulatedBuilding,
    SimulatedConfig,
)
from backend.api.routes_decisions import router as decisions_router
from backend.api.routes_export import router as export_router
from backend.api.routes_health import router as health_router
from backend.api.routes_settings import router as settings_router
from backend.config import settings
from backend.db.database import AsyncSessionLocal, init_db
from backend.services.decision_manager import DecisionManager
from backend.services.scheduler import SchedulerService
from backend.ws.websocket_manager import ConnectionManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

manager = ConnectionManager()
scheduler: SchedulerService | None = None
adapter: SimulatedAdapter | None = None


def _create_default_buildings() -> list[SimulatedBuilding]:
    """Standard campus configuration matching the PS requirements."""
    return [
        SimulatedBuilding(
            building_id="academic_block",
            name="Academic Block A",
            criticality_tier="critical",
            solar_capacity_kw=150.0,
            wind_capacity_kw=60.0,
            battery_capacity_kwh=300.0,
            battery_soc_initial_pct=50.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.3,
        ),
        SimulatedBuilding(
            building_id="hostel_block",
            name="Girls Hostel",
            criticality_tier="critical",
            solar_capacity_kw=80.0,
            wind_capacity_kw=30.0,
            battery_capacity_kwh=150.0,
            battery_soc_initial_pct=60.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.4,
        ),
        SimulatedBuilding(
            building_id="admin_block",
            name="Admin Block",
            criticality_tier="non_critical",
            solar_capacity_kw=40.0,
            wind_capacity_kw=20.0,
            battery_capacity_kwh=100.0,
            battery_soc_initial_pct=40.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.2,
        ),
        SimulatedBuilding(
            building_id="lab_block",
            name="Science Lab Complex",
            criticality_tier="critical",
            solar_capacity_kw=60.0,
            wind_capacity_kw=25.0,
            battery_capacity_kwh=150.0,
            battery_soc_initial_pct=45.0,
            tariff_inr_per_unit=9.0,
            vnm_sharing_ratio=0.15,
        ),
    ]


async def _seed_default_config():
    """Seed alert thresholds with default values from settings."""
    from backend.models.config import AlertThreshold
    defaults = [
        AlertThreshold(id="battery_low", name="Battery Low Threshold", description="SoC below this triggers a warning", threshold_value=settings.alert_battery_low, unit="%", active=True, severity="warning"),
        AlertThreshold(id="battery_critical", name="Battery Critical Threshold", description="SoC below this triggers critical alert", threshold_value=settings.alert_battery_critical, unit="%", active=True, severity="critical"),
        AlertThreshold(id="grid_import_high", name="High Grid Import Threshold", description="Grid import above this triggers alert", threshold_value=settings.alert_grid_import_high, unit="kWh", active=True, severity="warning"),
        AlertThreshold(id="reserve_floor", name="Reserve Floor", description="Minimum battery SoC for critical load protection", threshold_value=20.0, unit="%", active=True, severity="critical"),
    ]
    async with AsyncSessionLocal() as session:
        for default in defaults:
            existing = await session.get(AlertThreshold, default.id)
            if not existing:
                session.add(default)
        await session.commit()
        logger.info("Seeded default alert thresholds.")


async def _seed_building_config():
    """Seed building tiers and VNM sharing rules from adapter config."""
    from backend.models.config import BuildingTier, VnmSharingRule
    adapter = app.state.adapter if hasattr(app.state, 'adapter') else None
    if not adapter:
        return

    async with AsyncSessionLocal() as session:
        for bid, building in adapter.buildings.items():
            # Building tier
            existing_tier = await session.get(BuildingTier, bid)
            if not existing_tier:
                session.add(BuildingTier(
                    building_id=bid,
                    tier=building.criticality_tier,
                    description=f"{building.name} ({building.criticality_tier})",
                ))

            # VNM sharing rule
            existing_vnm = await session.execute(
                select(VnmSharingRule).where(VnmSharingRule.building_id == bid)
            )
            if not existing_vnm.scalar_one_or_none():
                session.add(VnmSharingRule(
                    id=f"vnm_{bid}",
                    building_id=bid,
                    sharing_ratio=building.vnm_sharing_ratio,
                ))
        await session.commit()
        logger.info("Seeded building tiers and VNM rules.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_db()

    # Seed default configuration data
    await _seed_default_config()

    # Initialize adapter with simulated data
    config = SimulatedConfig(
        time_scale=settings.simulator_time_scale,
        interval_seconds=300.0,
        scenario=settings.simulator_default_scenario,
    )
    adapter = SimulatedAdapter(config=config, buildings=_create_default_buildings())
    app.state.adapter = adapter

    # Initialize scheduler with full DecisionManager (Phase 1)
    global scheduler
    scheduler = SchedulerService(adapter=adapter, manager=manager, db_session_factory=AsyncSessionLocal)
    decision_manager = DecisionManager(
        adapter=adapter,
        ws_manager=manager,
        cost_weight=settings.cost_weight,
        carbon_weight=settings.carbon_weight,
    )
    scheduler.set_decision_manager(decision_manager)
    app.state.scheduler = scheduler
    app.state.adapter = adapter

    await scheduler.start()
    # Seed building tiers and VNM rules from adapter config
    await _seed_building_config()
    logger.info("SURYA started with SimulatedAdapter.")

    yield

    await scheduler.shutdown()


app = FastAPI(
    title="SURYA",
    description="Smart Unified Renewable Yield Automation orchestrating solar, wind, battery, and grid as one dispatchable entity.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(decisions_router)
app.include_router(export_router)
app.include_router(settings_router)

# WebSocket endpoint
from fastapi import WebSocket


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        manager.disconnect(websocket)


@app.get("/")
async def root():
    return {
        "name": "SURYA",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "adapter": "simulated",
        "features": [
            "hybrid solar + wind + battery + grid orchestration",
            "simulated adapter layer for demo playback",
            "10-second decision cycle",
            "critical-load reliability guard",
            "demand-side load-shift advisor",
            "VNM/GNM optimizer (RERC 2025)",
            "CSV/PDF statutory export",
        ],
    }
