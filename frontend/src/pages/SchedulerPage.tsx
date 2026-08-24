/**
 * AI Scheduler — derives a 24h operational schedule from the live campus
 * forecast, decision log and reliability telemetry; renders it on the shared
 * GanttTimeline. Supports Apply-Schedule (force cycle), an AI-vs-current
 * compare mode and data-grounded "why" explanations.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { GanttTimeline, type GanttRow } from '../components/viz/GanttTimeline';
import { useVppData } from '../context/VppDataContext';
import { useCampusForecast } from '../hooks/useCampusForecast';
import type { CampusForecast } from '../lib/forecast';
import type { Decision, DecisionType, ReliabilityStatus } from '../types';
import { getScenarios, switchScenario, forceCycle } from '../services/apiClient';
import type { Scenario } from '../types';
import { formatPower } from '../lib/format';

// ─── Schedule derivation (pure — kept local to this page) ───────────────────

interface Block {
  start: number;
  end: number;
  label?: string;
}

type FPoint = CampusForecast['points'][number];

function contiguousBlocks(pts: FPoint[], stepH: number, pred: (p: FPoint) => boolean): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  for (const p of pts) {
    if (pred(p)) {
      const end = Math.min(24, p.h + stepH);
      if (cur && Math.abs(cur.end - p.h) < 1e-6) cur.end = end;
      else {
        if (cur) blocks.push(cur);
        cur = { start: p.h, end };
      }
    } else if (cur) {
      blocks.push(cur);
      cur = null;
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

/** Parse "HH:MM" → fractional hour, NaN-safe. */
function parseHm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h + m / 60;
}

const DECISION_LABEL: Record<DecisionType, string> = {
  dispatch: 'DISPATCH',
  battery: 'BATTERY',
  load_shift: 'LOAD SHIFT',
  reliability: 'RELAY',
  vnm: 'VNM',
};

function buildScheduleRows(
  forecast: CampusForecast | null,
  decisions: Decision[],
  reliability: ReliabilityStatus | null
): GanttRow[] {
  const pts = forecast?.points ?? [];
  if (pts.length === 0) return [];
  const stepH = pts.length > 1 ? pts[1].h - pts[0].h : 0.25;
  const net = (p: FPoint) => p.solarKw + p.windKw - p.demandKw;

  const rows: GanttRow[] = [
    {
      id: 'solar', label: 'Solar', color: '#fbbf24',
      blocks: contiguousBlocks(pts, stepH, p => p.solarKw > 5),
    },
    {
      id: 'wind', label: 'Wind', color: '#2dd4bf',
      blocks: contiguousBlocks(pts, stepH, p => p.windKw > 5),
    },
    {
      id: 'battery-charge', label: 'Battery Charge', color: '#34d399',
      blocks: contiguousBlocks(pts, stepH, p => net(p) > 15).map(b => ({ ...b, label: 'CHARGE' })),
    },
    {
      id: 'battery-discharge', label: 'Battery Discharge', color: '#fbbf24',
      blocks: contiguousBlocks(pts, stepH, p => net(p) < -15).map(b => ({ ...b, label: 'DISCHARGE' })),
    },
    {
      id: 'grid-import', label: 'Grid Import', color: '#a89a88',
      blocks: contiguousBlocks(pts, stepH, p => net(p) < -5).map(b => ({ ...b, label: 'IMPORT' })),
    },
    {
      id: 'grid-export', label: 'Grid Export', color: '#f5d08a',
      blocks: contiguousBlocks(pts, stepH, p => net(p) > 20).map(b => ({ ...b, label: 'EXPORT' })),
    },
    {
      id: 'critical-load', label: 'Critical Load', color: '#94a3b8',
      blocks: [{
        start: 0,
        end: 24,
        label: reliability ? `PROTECTED · ${reliability.critical_load_kw.toFixed(0)} kW` : 'PROTECTED',
      }],
    },
    {
      id: 'flexible-load', label: 'Flexible Load', color: '#f5d08a',
      blocks: (forecast?.surplusWindows ?? [])
        .map(w => ({ start: parseHm(w.start), end: parseHm(w.end), label: 'SHIFT WINDOW' }))
        .filter(b => Number.isFinite(b.start) && Number.isFinite(b.end)),
    },
    {
      id: 'ai-actions', label: 'AI Actions', color: '#a78bfa',
      blocks: decisions.slice(0, 10).map(d => {
        const dt = new Date(d.timestamp);
        const start = dt.getHours() + dt.getMinutes() / 60;
        return {
          start: Math.max(0, Math.min(23.99, start)),
          end: Math.min(24, start + 0.75),
          label: DECISION_LABEL[d.decision_type] ?? d.decision_type.toUpperCase(),
        };
      }),
    },
  ];

  return rows.filter(r => r.blocks.length > 0);
}

// ─── Page ────────────────────────────────────────────────────────────────────

type ApplyState = 'idle' | 'loading' | 'success' | 'error';

export default function SchedulerPage() {
  const { latestDecisions, reliability } = useVppData();
  const forecast = useCampusForecast();

  const [applyState, setApplyState] = useState<ApplyState>('idle');
  const [compareMode, setCompareMode] = useState(false);
  const applyTimerRef = useRef<number | null>(null);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState('');
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null);

  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;

  useEffect(() => {
    let cancelled = false;
    getScenarios()
      .then(r => {
        if (!cancelled) {
          setScenarios(r.scenarios);
          setCurrentScenario(r.current_scenario);
        }
      })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (applyTimerRef.current !== null) window.clearTimeout(applyTimerRef.current);
  }, []);

  const rows = useMemo(
    () => buildScheduleRows(forecast, latestDecisions, reliability),
    [forecast, latestDecisions, reliability]
  );

  // Current operations = derived schedule minus AI actions & flexible shift windows
  const currentOpsRows = useMemo(
    () => rows.filter(r => r.id !== 'ai-actions' && r.id !== 'flexible-load'),
    [rows]
  );

  const handleApply = async () => {
    setApplyState('loading');
    try {
      await forceCycle();
      setApplyState('success');
    } catch {
      setApplyState('error');
    }
    applyTimerRef.current = window.setTimeout(() => setApplyState('idle'), 4000);
  };

  const handleSwitchScenario = async (id: string) => {
    setScenarioLoading(id);
    try {
      await switchScenario(id);
      setCurrentScenario(id);
    } catch { /* non-fatal */ }
    setScenarioLoading(null);
  };

  // ── Why-this-schedule bullets (all from real state) ──
  const whyBullets = useMemo(() => {
    const out: string[] = [];
    for (const d of latestDecisions.slice(0, 2)) out.push(d.reason);
    const surplus = forecast?.surplusWindows[0];
    if (surplus) {
      out.push(
        `Renewable surplus of ${formatPower(surplus.avgSurplusKw)} is expected ${surplus.start}–${surplus.end} — the optimizer reserves it for battery charging before peak tariffs hit.`
      );
    }
    const deficit = forecast?.deficitWindows[0];
    if (deficit) {
      out.push(
        `A deficit averaging ${formatPower(deficit.avgDeficitKw)} is forecast ${deficit.start}–${deficit.end} — battery discharge and pre-charged reserves cover it instead of full-price imports.`
      );
    }
    if (reliability) {
      out.push(
        `Reliability constraint: reserve floor held at ${reliability.reserve_floor_pct.toFixed(0)}% keeps ${reliability.critical_load_kw.toFixed(0)} kW of critical load protected for ${reliability.reserve_duration_hours.toFixed(1)}h without grid support.`
      );
    }
    return out;
  }, [latestDecisions, forecast, reliability]);

  const ready = rows.length > 0;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="tech-label mb-1.5">OPTIMIZATION</div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">AI Scheduler</h2>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            A 24-hour operating plan derived live from the forecast engine, decision log and reliability constraints.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={compareMode}
            onClick={() => setCompareMode(v => !v)}
            className="ops-btn ops-btn-ghost"
          >
            <span className={`inline-block w-7 h-4 rounded-full transition-colors relative ${compareMode ? 'bg-amber-400/70' : 'bg-white/15'}`}>
              <span
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${compareMode ? 'left-3.5' : 'left-0.5'}`}
                aria-hidden="true"
              />
            </span>
            COMPARE
          </button>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleApply}
              disabled={applyState === 'loading'}
              className="ops-btn ops-btn-primary"
            >
              {applyState === 'loading'
                ? <Loader2 size={13} className="animate-spin" />
                : <Sparkles size={13} />}
              APPLY SCHEDULE
            </button>
            {applyState === 'success' && (
              <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={11} /> AI schedule applied — optimizer re-dispatching
              </span>
            )}
            {applyState === 'error' && (
              <span className="text-[10px] text-red-300 flex items-center gap-1">
                <XCircle size={11} /> Apply failed — backend unreachable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Scenario quick-switch ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 ops-scroll" role="group" aria-label="Scenario quick switch">
        {scenarios.length === 0 ? (
          <span className="tech-label py-1.5">Loading scenarios…</span>
        ) : (
          scenarios.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSwitchScenario(s.id)}
              disabled={scenarioLoading === s.id}
              aria-pressed={currentScenario === s.id}
              title={s.description}
              className={`ops-chip !px-3 !py-1.5 transition-colors disabled:opacity-50 ${
                currentScenario === s.id ? 'ops-chip-cyan' : ''
              }`}
            >
              {scenarioLoading === s.id
                ? <Loader2 size={11} className="animate-spin" />
                : null}
              {s.name}
            </button>
          ))
        )}
      </div>

      {/* ── Timeline(s) ── */}
      {!ready ? (
        <section className="ops-panel overflow-hidden">
          <div className="ops-panel-header">
            <span className="tech-label tech-label-cyan">SCHEDULE</span>
          </div>
          <div className="p-8 text-center">
            <Sparkles size={32} className="mx-auto text-white/15" />
            <p className="text-white/55 mt-2 font-medium text-[13px]">Building the schedule…</p>
            <p className="text-[11px] text-white/35 mt-1">
              Waiting for the campus forecast engine and at least one optimizer cycle.
            </p>
          </div>
        </section>
      ) : compareMode ? (
        <div className="space-y-5">
          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-header">
              <span className="tech-label tech-label-cyan">AI-GENERATED SCHEDULE</span>
              <span className="tech-label">FORECAST-DERIVED PLAN</span>
            </div>
            <div className="chart-scroll p-2 sm:p-4">
              <GanttTimeline rows={rows} nowHour={nowHour} />
            </div>
          </section>
          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-header">
              <span className="tech-label tech-label-green">CURRENT OPERATIONS</span>
              <span className="tech-label">LIVE DISPATCH BASELINE</span>
            </div>
            <div className="chart-scroll p-2 sm:p-4">
              <GanttTimeline rows={currentOpsRows} nowHour={nowHour} />
            </div>
          </section>
        </div>
      ) : (
        <section className="ops-panel overflow-hidden">
          <div className="ops-panel-header">
            <span className="tech-label tech-label-cyan">AI-GENERATED SCHEDULE</span>
            <span className="tech-label">NEXT 24 HOURS</span>
          </div>
          <div className="chart-scroll p-2 sm:p-4">
            <GanttTimeline rows={rows} nowHour={nowHour} />
          </div>
        </section>
      )}

      {/* ── Why this schedule ── */}
      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header">
          <span className="tech-label text-violet-300/80">WHY THIS SCHEDULE</span>
          <span className="tech-label">DATA-GROUNDED RATIONALE</span>
        </div>
        <div className="p-4">
          {whyBullets.length === 0 ? (
            <p className="text-[12px] text-white/40 py-4 text-center">
              No rationale yet — the explanation appears once the optimizer logs decisions and the forecast matures.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {whyBullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/70 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
