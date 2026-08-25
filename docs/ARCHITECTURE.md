# SURYA Architecture

## System Overview

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│  Frontend   │ HTTP│            FastAPI Backend               │
│ React + TS  │────▶│  ┌────────┐  ┌─────────┐  ┌───────────┐  │
│  (SURYA)    │ WS  │  │  api/  │─▶│ models/ │◀─│ services/ │  │
└─────────────╲─────┤  └────────┘  └─────────┘  └─────┬─────┘  │
                ▲    │        │                        │        │
                │    │        ▼                        ▼        │
                │    │  ┌──────────┐          ┌───────────────┐ │
                └────┼──│ ws/      │◀─────────│ scheduler.py  │ │
                     │  └──────────┘          └───────┬───────┘ │
                     │                                ▼         │
                     │                      ┌──────────────────┐ │
                     │                      │ decision_manager │ │
                     │                      │  (8 optimizer    │ │
                     │                      │   modules)       │ │
                     │                      └────────┬─────────┘ │
                     └────────────────────────────────┼──────────┘
                                                      ▼
                                          ┌────────────────────┐
                                          │ adapters/          │
                                          │ EnergyAdapter ABC  │
                                          │ • SimulatedAdapter │
                                          │ • (Modbus/MQTT...) │
                                          └────────────────────┘
```

## Core Loop (SchedulerService)

Every `decision_cycle_seconds` (default 10s demo / 300s production):

1. **Read sensors** — `adapter.read_sensors()` produces per-building readings
2. **Persist twin** — `DigitalTwinStore` upserts building/turbine/battery twins to DB
3. **Broadcast** — `twin_update` WebSocket message with all building states
4. **Decide** — `DecisionManager.run_cycle()` evaluates candidates and picks the best
5. **Log** — decisions persisted to the immutable `decision_logs` audit table
6. **Broadcast** — `full_cycle` WebSocket message with decisions + reliability status

The same pipeline is exposed via `POST /api/v1/settings/force-cycle`.

## Decision Pipeline

`services/decision_manager.py` orchestrates:

| Module | Role |
|--------|------|
| `forecast_engine` | 24h solar/wind/demand forecasts |
| `reliability_guard` | Reserve floor enforcement, load shedding for critical loads |
| `dispatch_optimizer` | Solar/wind/grid dispatch candidates |
| `battery_scheduler` | Charge/discharge scheduling |
| `vnm_optimizer` | Virtual net-metering credit sharing (RERC 2025) |
| `load_advisor` | Demand-side load-shift recommendations |
| `cost_optimizer` | Cost scoring |
| `carbon_optimizer` | Carbon scoring (grid emission factor) |

Candidates are scored by `COST_WEIGHT × cost + CARBON_WEIGHT × carbon`, filtered by the
reliability floor, and the best strategy is executed, logged, and broadcast.

## Adapter Layer

All hardware access goes through the `EnergyAdapter` ABC (`adapters/base.py`):
`read_sensors()`, `write_command()`, `health()`, `start_stream()`, `stop_stream()`.

- `SimulatedAdapter` (`adapters/simulated.py`) — physics-based synthetic data: clear-sky
  solar irradiance with cloud cover, piecewise wind power curve, battery SoC dynamics
  with losses, occupancy-driven demand. Scenario definitions live in the module-level
  `SCENARIOS` dict (also served by `/api/v1/settings/scenarios`).
- Site configuration (the 4 demo buildings) lives in `adapters/site_config.py` — the
  single source of truth used by the app, the standalone scheduler, and the CLI.
- Real hardware adapters (Modbus/MQTT) implement the same interface — no downstream
  changes required.

## Data Model (single shared `Base`, `models/base.py`)

| Table | Module | Purpose |
|-------|--------|---------|
| `building_twins` | `digital_twin.py` | Authoritative per-building state |
| `wind_turbine_twins` | `digital_twin.py` | Turbine readings |
| `battery_twins` | `digital_twin.py` | Battery readings |
| `decision_logs` | `decision_log.py` | Immutable decision audit trail (context JSON), pruned after `DECISION_RETENTION_DAYS` |
| `alert_thresholds` | `config.py` | Configurable alert levels |
| `building_tiers` | `config.py` | Criticality tier per building |
| `vnm_sharing_rules` | `config.py` | VNM sharing ratio per building |
| `users` | `user.py` | Accounts (Argon2 hashes, Google `sub`) |

Default config rows are seeded at startup by `main.py` lifespan handlers.

## API Surface (all `/api/v1` routes require Bearer auth)

| Prefix | Endpoints |
|--------|-----------|
| `POST /api/v1/auth` | `signup`, `login`, `google` (rate-limited) · `GET /me` |
| `GET /api/v1/decisions` | Decision log query + aggregate stats |
| `GET /api/v1/export/{csv,pdf,stats}` | Statutory reports (ReportLab PDF) |
| `GET|PUT /api/v1/settings/*` | Alert thresholds, building tiers, VNM rules |
| `GET|POST /api/v1/settings/scenarios[/{id}]` | Simulator scenario control |
| `POST /api/v1/settings/force-cycle` | Manual cycle trigger |
| `WS /ws?token=<JWT>` | Realtime `twin_update`, `full_cycle`, `health` pushes |

## Security Model

- JWT HS256 tokens (Argon2 password hashing; Google ID tokens verified server-side)
- Router-level auth dependencies on every protected router
- In-memory sliding-window rate limiting on credential endpoints (`api/rate_limit.py`)
- CORS restricted to the `CORS_ORIGINS` allowlist; startup fails fast in production if
  `JWT_SECRET_KEY` is weak

## Simulation Time

`SIMULATOR_TIME_SCALE=60` means 1 real second = 60 simulated minutes; each adapter step
advances simulated time deterministically from an absolute start (no drift). The 24h CLI
(`python -m backend.simulator.run_simulation`) uses `time_scale=1.0` to fast-forward.
