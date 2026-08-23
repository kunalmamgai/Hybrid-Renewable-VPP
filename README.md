# SURYA — Hybrid Renewable Virtual Power Plant

**S**mart **U**nified **R**enewable **Y**ield **A**utomation — orchestrating solar, wind,
battery, and grid as one dispatchable entity for multi-building campuses.

SURYA runs a continuous decision loop that reads sensor data, updates a digital twin of
every building, and optimizes dispatch (solar + wind + battery + grid) against weighted
cost and carbon objectives — with an immutable audit trail of every automated decision.

## Features

- **Hybrid orchestration** — solar PV, wind turbines, battery storage, and grid as one VPP
- **AI decision loop** — 8-module optimizer (forecast → reliability guard → dispatch ×
  battery × VNM × load-shift), scored by configurable cost/carbon weights
- **Digital twin** — live per-building state persisted to the database
- **VNM/GNM optimizer** — RERC Third Amendment Regulations (2025) net-metering credits
- **Statutory export** — CSV/PDF cost & carbon savings reports
- **Realtime dashboard** — React + WebSocket push updates
- **3D campus twins** — standalone three.js visualization (`simulator/`)
- **Auth** — JWT (email/password + Google sign-in), Argon2 password hashing

## Project Structure

```
backend/            FastAPI backend (Python)
  api/              REST route modules (auth, decisions, export, health, settings)
  adapters/         Hardware abstraction (simulated adapter + site config)
  models/           SQLAlchemy ORM models + Pydantic schemas
  services/         Decision manager, scheduler, optimizer modules
  simulator/        Physics curves (solar, wind, battery, demand)
  ws/               WebSocket connection manager
frontend/           React 18 + TypeScript + Vite dashboard ("SURYA")
simulator/          Standalone React 19 + three.js 3D campus digital-twin site
docs/               Architecture documentation
```

## Quickstart

### Backend

```bash
pip install -r requirements.txt
copy .env.example .env   # then set JWT_SECRET_KEY (see .env.example)

# API server on http://localhost:8000 (docs at /docs)
uvicorn backend.main:app --reload
```

Sign up at `/signup` in the frontend, or `POST /api/v1/auth/signup` — all `/api/v1`
routes require a Bearer token.

**Database:** SQLite (default) auto-creates its schema for development. For
PostgreSQL, set `DATABASE_URL=postgresql+asyncpg://user:pass@host/db` and run
`alembic upgrade head` before starting the server — the server refuses to boot in
production against an unmigrated database. After changing any model, generate and
apply a migration:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

### Frontend

```bash
npm run install:all
npm run dev            # API + web dashboard + 3D twin concurrently
```

Web dashboard: http://localhost:5173 · 3D twin: http://localhost:5174

## Deployment (Docker)

```bash
# 1. Set a strong secret in your shell or root .env:
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# 2. Bring up Postgres + backend + frontend
docker compose up --build
```

- Backend: http://localhost:8000 (`/health` for healthchecks) — schema migrations
  run automatically at container start via `alembic upgrade head`
- Frontend: http://localhost:8080 (nginx, SPA fallback)
- The frontend build bakes `VITE_API_URL` / `VITE_WS_URL` at image build time —
  set them to your public backend origin when deploying beyond localhost.

CI: `.github/workflows/backend-ci.yml` runs ruff + pytest on every push/PR.

## Simulation & Operations

```bash
# Fast-forward a full 24h day through the physics simulator
python -m backend.simulator.run_simulation --duration 24h --interval 5

# Run the decision scheduler standalone (without the HTTP API)
python -m backend.services.scheduler --mode continuous

# Tests & lint
npm run test            # pytest (backend/tests/)
npm run lint            # ruff
```

## Configuration

All configuration is environment-driven — see `.env.example` for the full list with
defaults. Key variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENVIRONMENT` | `development` | `production` enforces a strong `JWT_SECRET_KEY` at startup |
| `CORS_ORIGINS` | *(empty)* | Comma-separated origin allowlist (required in production) |
| `JWT_SECRET_KEY` | *(insecure default)* | Token signing key — generate via `secrets.token_hex(32)` |
| `DATABASE_URL` | SQLite | SQLAlchemy async connection string |
| `SIMULATOR_TIME_SCALE` | `60.0` | Simulated minutes per real second |
| `COST_WEIGHT` / `CARBON_WEIGHT` | `0.7` / `0.3` | Optimizer objective weights |

## Security Notes

- All `/api/v1/*` endpoints require authentication; WebSocket `/ws` requires a valid
  token (`?token=<JWT>`).
- Auth endpoints are rate-limited per client IP.
- In production (`ENVIRONMENT=production`) the server refuses to boot without a strong
  JWT secret.
- Set `CORS_ORIGINS` to your deployed frontend origin(s) when deploying.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design detail.
