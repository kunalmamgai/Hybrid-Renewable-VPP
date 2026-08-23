# Backend Configuration

## Environment Variables
All config is loaded from environment variables via `.env`. Copy `.env.example` to `.env`.

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_HOST` | `0.0.0.0` | API server bind address |
| `BACKEND_PORT` | `8000` | API server port |
| `ENVIRONMENT` | `development` | `production` enforces strong JWT secret + migrated DB at startup |
| `CORS_ORIGINS` | *(empty)* | Comma-separated CORS origin allowlist |
| `DATABASE_URL` | `sqlite+aiosqlite:///./vpp.db` | SQLAlchemy async connection (`postgresql+asyncpg://...` for Postgres) |
| `SIMULATOR_TIME_SCALE` | `60.0` | 1 real second = 60 simulated minutes |
| `ALERT_BATTERY_LOW` | `20` | Low battery % threshold |
| `ALERT_BATTERY_CRITICAL` | `15` | Critical battery % threshold |
| `COST_WEIGHT` | `0.7` | Cost optimization weight (0.0–1.0) |
| `CARBON_WEIGHT` | `0.3` | Carbon optimization weight (0.0–1.0) |
| `GRID_EMISSION_FACTOR_KG_PER_KWH` | `0.74` | kg CO₂ per kWh grid import (Rajasthan average) |

## Architecture
See the Mermaid diagrams in `docs/ARCHITECTURE.md` for full detail.

## Database Migrations
Schema is managed by Alembic (config in `alembic.ini`, env in `backend/db/migrations/`).

- **SQLite dev:** tables are auto-created at startup — no migration step needed.
- **PostgreSQL/production:** run `alembic upgrade head` before starting the server.
  The server refuses to boot in production against an unmigrated database.

```bash
# After changing a model in backend/models/, generate + apply:
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

The DB URL always comes from `DATABASE_URL` (env / `.env`) — never edit `alembic.ini`.

## Development
```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

## Running the 24h Simulation
```bash
python -m backend.simulator.run_simulation --duration 24h --interval 5min
```

## Running the Decision Loop
```bash
python -m backend.services.scheduler --mode continuous
```
