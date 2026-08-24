/**
 * Gantt Timeline — the full 24-hour operational picture on a single chart:
 * generation availability, battery plan, grid flows, load protection,
 * flexible shift windows and logged AI actions. Rows derive live from the
 * campus forecast, decision log and reliability telemetry.
 */
import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { GanttTimeline, type GanttRow } from '../components/viz/GanttTimeline';
import { useVppData } from '../context/VppDataContext';
import { useCampusForecast } from '../hooks/useCampusForecast';
import type { CampusForecast } from '../lib/forecast';
import type { Decision, DecisionType, ReliabilityStatus } from '../types';

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

export default function GanttPage() {
  const { latestDecisions, reliability } = useVppData();
  const forecast = useCampusForecast();

  const rows = useMemo(
    () => buildScheduleRows(forecast, latestDecisions, reliability),
    [forecast, latestDecisions, reliability]
  );

  // NOW marker from local clock
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <div className="tech-label mb-1.5">OPERATIONS</div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Gantt Timeline</h2>
        <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
          The complete 24-hour operational picture — schedule derived live from the campus
          forecast and the optimizer's decision log.
        </p>
      </div>

      {/* ── Legend ── */}
      <section className="ops-panel-flat px-4 py-3">
        <div className="tech-label mb-2">LEGEND</div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {rows.map(r => (
            <span key={r.id} className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/55 uppercase">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: r.color }} aria-hidden="true" />
              {r.label}
            </span>
          ))}
          {rows.length === 0 && <span className="text-[11px] text-white/35">—</span>}
        </div>
      </section>

      {/* ── Timeline ── */}
      {rows.length === 0 ? (
        <section className="ops-panel overflow-hidden">
          <div className="ops-panel-header">
            <span className="tech-label tech-label-cyan">24-HOUR TIMELINE</span>
          </div>
          <div className="p-8 text-center">
            <CalendarClock size={32} className="mx-auto text-white/15" />
            <p className="text-white/55 mt-2 font-medium text-[13px]">No schedule data yet</p>
            <p className="text-[11px] text-white/35 mt-1">
              The timeline populates once the forecast engine produces its first 24h projection.
            </p>
          </div>
        </section>
      ) : (
        <section className="ops-panel overflow-hidden">
          <div className="ops-panel-header">
            <span className="tech-label tech-label-cyan">24-HOUR TIMELINE</span>
            <span className="tech-label">LOCAL TIME · GOLD MARKER = NOW</span>
          </div>
          <div className="chart-scroll p-2 sm:p-4 grid-texture">
            <GanttTimeline rows={rows} nowHour={nowHour} />
          </div>
        </section>
      )}

      {/* ── Summary ── */}
      {rows.length > 0 && (
        <section className="ops-panel-flat px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {rows.map(r => (
              <span key={r.id} className={`num text-[11px] ${r.blocks.length > 0 ? 'text-white/65' : 'text-white/30'}`}>
                {r.label.toUpperCase()}: <b>{r.blocks.length}</b> block{r.blocks.length === 1 ? '' : 's'}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-white/35 mt-2 leading-relaxed max-w-3xl">
            Schedule derives from the live client-side forecast engine and the AI decision log —
            it re-computes as telemetry and optimizer cycles arrive.
          </p>
        </section>
      )}
    </div>
  );
}
