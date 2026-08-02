"""API routes for health checks and status."""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """Basic health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "hybrid-renewable-vpp",
        "version": "1.0.0",
    }


@router.get("/health/adapter")
async def adapter_health():
    """Check adapter layer connectivity."""
    return {
        "adapters": {
            "simulated": {"status": "online", "adapter_type": "simulated"},
            "modbus": {"status": "offline", "adapter_type": "modbus"},
            "mqtt": {"status": "offline", "adapter_type": "mqtt"},
            "rest": {"status": "offline", "adapter_type": "rest"},
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/health/scheduler")
async def scheduler_health():
    """Check if the scheduler is running."""
    from backend.main import app
    scheduler = app.state.scheduler if hasattr(app.state, 'scheduler') else None
    if scheduler is None:
        raise HTTPException(status_code=503, detail="Scheduler not initialized")
    return {
        "running": scheduler.is_running if scheduler else False,
        "last_cycle": scheduler.last_cycle.isoformat() if scheduler and scheduler.last_cycle else None,
        "cycles_completed": scheduler.cycle_count if scheduler else 0,
    }
