# Hybrid Renewable VPP — Optimization Plan

Audit-complete. All key claims verified against source. Implement Phases A–F in order,
running `npm run build` + `npx tsc --noEmit` (and pytest for backend) after each phase.

User decisions: run full plan, all phases; git cleanup = untrack only (no history rewrite).

---

## Phase A — Fix live-data pipeline (CRITICAL bug)

**Bug (verified):** scheduler only broadcasts `full_cycle` when DecisionManager wired
(scheduler.py:126-139). DecisionManager is ALWAYS wired (main.py:153-159). `twin_update`
lives only in the dead Phase-0 branch (scheduler.py:140-153). Result: frontend `buildings`
stays `[]` forever → MissionControl meters (60-72, 232, 303-307) and LiveEnergyFlow graph
(157-240) never render live data.

**Fix (backend/services/scheduler.py):**
1. Add helper `_build_buildings_payload(twin_snapshot)` extracting the building-filter logic
   currently at scheduler.py:142-146.
2. In `_run_loop` Phase-1 branch: broadcast `twin_update` (cycle_number, timestamp,
   buildings, timestamp_of_data) alongside `full_cycle`.
3. In `force_cycle`: also broadcast `twin_update`.
4. Delete the now-redundant Phase-0 bare branch and the `StubDecisionManager` class
   (scheduler.py:216-219, unreferenced).

**Verify:** `python -m pytest` / `npm run test` at root.

## Phase B — Frontend state & render performance

**Verified:** only 3 memo hooks repo-wide (MissionControl:59, FacilitiesSettings:76,
AIDecisionCenter:26); zero `React.memo`; `MissionControl` and `LiveEnergyFlow` EACH call
`useVppWebSocket()` → creates its own `VppWebSocketClient` → 2 duplicate WS connections +
full re-render of both trees every broadcast.

1. New `frontend/src/context/VppDataContext.tsx`: single shared WS connection via
   `useVppWebSocket`, exposed through context. Wrap the dashboard (and/or App) once.
2. Update `MissionControl.tsx:38` and `LiveEnergyFlow.tsx:151` to consume the context.
3. Split the `'*'` subscriber into per-type handlers in `useVppWebSocket.ts` to avoid a
   whole-state `setState` on every health/error message (keep `connected` updates).
4. `React.memo` heavy leaves: EnergyMeter, DecisionCard, building cards, flow nodes.

**Verify:** `npm run build`, confirm single WS connection in browser.

## Phase C — Types & tech debt cleanup

1. Fix `FacilitiesSettings.tsx:130` TS2552 `updateVnmSharingRule` — add missing
   apiClient function + backend route if absent, or align with existing
   `getVnmSharingRules`/`update` naming.
2. Replace `any` casts in `useVppWebSocket.ts` (lines 51, 58) with typed guards.
3. Undefined CSS classes (~30 call sites: `glass-card*`, `vpp-red`,
   `shadow-emerald-glow-sm`): either define in `index.css` once or swap to existing tokens.
   Grep `frontend/src` to enumerate exact classes before editing.

**Verify:** tsc clean (except pre-existing FacilitiesSettings error must be resolved here);
build passes.

## Phase D — Bundling

1. `React.lazy` + `Suspense` for heavy dashboard pages (MissionControl, LiveEnergyFlow,
   AIDecisionCenter, FacilitiesSettings) in `App.tsx`.
2. Verify dist chunking + bundle reduction.

## Phase E — Backend & config hygiene

1. Wire `simulator_time_scale` and `scenario` env vars into `SimulatedConfig` in
   `main.py:142-146` (currently hardcoded `time_scale=60.0, scenario=`mvp_day",
   `interval_seconds` from existing settings). Confirm setting names in `config.py`.
2. Sync `.env.example` with actual env vars read by `config.py`; drop/align drift.

## Phase F — Git & tooling

1. `.gitignore`: add `frontend/dist/`, `.pnpm-store/`, `*.db`. `git rm --cached`
   those paths (keeps local, leaves history). Skip `.env`.
2. Add `frontend/eslint.config.js` (flat config, ESLint 9) so `npm run lint` works; or
   align with planned). Verify lint runs.
3. Remove stray root `package.json` `framer-motion ^12.43.0` (duplicate/frontend dep is
   `^11.18.2`). 
4. Remove `react-flow-renderer`? (verify actual dep name — no-change zone.)

## Verification + deliverables.

Final report with sections: Architecture Improvements / Performance (bottleneck table),
Code cleanup summary, refactoring, lint/typecheck status, and future work (adapter start/to_thread,
payload trimming, decision-log retention, log retention, typing of WS payloads).

---

## Files touched (planned)
- backend/services/scheduler.py
- frontend/src/context/VppDataContext.tsx (new)
- frontend/src/hooks/useVppWebSocket.ts
- frontend/src/components/dashboard/MissionControl.tsx
- frontend/src/components/dashboard/LiveEnergyFlow.tsx
- frontend/src/components/dashboard/LiveEnergyFlowEnergyMeter/ or child components
- frontend/src/components/dashboard/FacilitiesSettings.tsx
- frontend/src/services/apiClient.ts
- frontend/src/App.tsx
- frontend/src/components/dashboard/… heavy leaves (React.memo)
- backend/main.py
- backend/config.py (aug confirm names)
- backend/.env.example/.env
- frontend/.env.example?
- .gitignore
- frontend/eslint.config.js (new)
- package.json (root)