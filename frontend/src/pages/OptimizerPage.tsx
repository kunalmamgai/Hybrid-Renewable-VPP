/**
 * OptimizerPage — AI Energy Optimizer console.
 * Hero recommendation panel with apply-action, explainability breakdown
 * pulled from decision.context, and a filterable decision history.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BatteryCharging, ChevronDown, Coins, Leaf, Loader2,
  RefreshCw, SlidersHorizontal, Sparkles, XCircle,
} from 'lucide-react';
import { DecisionCard } from '../components/common/DecisionCard';
import { useDecisions } from '../hooks/useDecisions';
import { useVppData } from '../context/VppDataContext';
import { forceCycle } from '../services/apiClient';
import type { Decision, DecisionType } from '../types';
import { formatINR, formatDateTime } from '../lib/format';

type ApplyStatus = 'idle' | 'loading' | 'success' | 'error';

const CONTEXT_FACTORS: Array<{ key: string; label: string }> = [
  { key: 'dispatch_strategy', label: 'Dispatch strategy' },
  { key: 'battery_action', label: 'Battery action' },
  { key: 'load_shift', label: 'Load shift' },
  { key: 'composite_score', label: 'Composite score' },
  { key: 'cost_inr', label: 'Cost impact' },
  { key: 'carbon_kg', label: 'Carbon impact' },
];

const STANDARD_FACTORS = [
  'Renewable forecast',
  'Demand forecast',
  'Electricity price (₹9/kWh)',
  'Battery SOC',
  'Grid constraints',
  'Carbon intensity',
];

function safeStringify(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Small circular SVG progress ring for confidence display. */
function ConfidenceRing({ pct }: { pct: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative w-12 h-12 shrink-0" aria-label={`Confidence ${clamped.toFixed(0)} percent`}>
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped / 100)}
        />
      </svg>
      <span className="num absolute inset-0 grid place-items-center text-[11px] font-bold text-amber-300">
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}

const DECISION_TYPES: Array<DecisionType | 'all'> = [
  'all', 'dispatch', 'battery', 'load_shift', 'reliability', 'vnm',
];

export default function OptimizerPage() {
  const { latestDecisions } = useVppData();
  const topDecision: Decision | undefined = latestDecisions[0];

  const history = useDecisions(100);

  const [applyStatus, setApplyStatus] = useState<ApplyStatus>('idle');
  const [applyMessage, setApplyMessage] = useState('');

  const [whyOpen, setWhyOpen] = useState(false);

  const [typeFilter, setTypeFilter] = useState<DecisionType | 'all'>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Auto-clear the apply feedback after 6 s
  useEffect(() => {
    if (applyStatus !== 'success' && applyStatus !== 'error') return;
    const t = setTimeout(() => {
      setApplyStatus('idle');
      setApplyMessage('');
    }, 6000);
    return () => clearTimeout(t);
  }, [applyStatus, applyMessage]);

  const handleApply = async () => {
    setApplyStatus('loading');
    try {
      const resp = await forceCycle();
      setApplyStatus('success');
      setApplyMessage(`Optimization applied — cycle #${resp.cycle_number} queued`);
    } catch (err) {
      setApplyStatus('error');
      setApplyMessage(err instanceof Error ? err.message : 'Failed to trigger optimization cycle.');
    }
  };

  const filteredDecisions = useMemo(() => {
    const list = history.decisions ?? [];
    return list.filter(d =>
      (typeFilter === 'all' || d.decision_type === typeFilter) &&
      d.confidence_pct >= minConfidence,
    );
  }, [history.decisions, typeFilter, minConfidence]);

  const contextEntries = useMemo(() => {
    if (!topDecision?.context) return [];
    return CONTEXT_FACTORS
      .map(f => ({ ...f, value: topDecision.context?.[f.key] }))
      .filter(e => e.value !== undefined && e.value !== null && e.value !== '');
  }, [topDecision]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <div className="tech-label mb-1.5">AI ENERGY OPTIMIZER</div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
          Optimizer
        </h2>
        <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
          Composite cost-and-carbon optimization across solar, wind, battery and flexible loads —
          with full explainability for every recommendation.
        </p>
      </div>

      {/* ── Hero recommendation ── */}
      {topDecision ? (
        <section
          aria-label="Recommended action"
          className="rounded-xl p-[1.5px]"
          style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.55), rgba(217,119,6,0.25), rgba(52,211,153,0.15))' }}
        >
          <div className="ops-panel rounded-[10.5px] bg-emerald-400/[0.05] p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <span className="ops-chip ops-chip-green">
                <Sparkles size={11} />
                RECOMMENDED ACTION
              </span>
              <span className="tech-label">{formatDateTime(topDecision.timestamp)}</span>
            </div>

            <p className="text-base sm:text-lg font-semibold text-white leading-snug max-w-3xl">
              {topDecision.action}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-emerald-300" />
                <div>
                  <div className="num text-sm font-bold text-emerald-300">{formatINR(topDecision.expected_savings_inr)}</div>
                  <div className="tech-label">EXPECTED SAVINGS</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Leaf size={15} className="text-teal-300" />
                <div>
                  <div className="num text-sm font-bold text-teal-300">−{topDecision.expected_carbon_reduction_kg.toFixed(1)} kg CO₂</div>
                  <div className="tech-label">CARBON IMPACT</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BatteryCharging size={15} className="text-amber-300" />
                <div>
                  <div className="num text-sm font-bold text-amber-300">{topDecision.battery_soc_after_pct.toFixed(0)}%</div>
                  <div className="tech-label">BATTERY IMPACT</div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <ConfidenceRing pct={topDecision.confidence_pct} />
                <div className="hidden sm:block">
                  <div className="tech-label">CONFIDENCE</div>
                  <div className="text-[11px] text-white/45">model certainty</div>
                </div>
              </div>
            </div>

            {/* Apply action */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={applyStatus === 'loading'}
                className="ops-btn ops-btn-primary !px-5 !py-2.5 !text-[13px]"
              >
                {applyStatus === 'loading'
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Activity size={15} />}
                APPLY OPTIMIZATION
              </button>
              {applyStatus === 'success' && (
                <span role="status" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-300">
                  <Sparkles size={13} /> {applyMessage}
                </span>
              )}
              {applyStatus === 'error' && (
                <span role="alert" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-300">
                  <XCircle size={13} /> {applyMessage}
                </span>
              )}
            </div>

            {/* ── Why this recommendation ── */}
            <div className="pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => setWhyOpen(o => !o)}
                aria-expanded={whyOpen}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-300/90 hover:text-amber-200 transition-colors"
              >
                <motion.span animate={{ rotate: whyOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} />
                </motion.span>
                WHY THIS RECOMMENDATION?
              </button>

              <AnimatePresence initial={false}>
                {whyOpen && (
                  <motion.div
                    key="why"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pb-1 space-y-3">
                      {contextEntries.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {contextEntries.map(e => (
                            <div
                              key={e.key}
                              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 flex items-center justify-between gap-2 min-w-0"
                            >
                              <span className="tech-label truncate">{e.label}</span>
                              <span className="num text-[11px] font-semibold text-white/80 truncate" title={safeStringify(e.value)}>
                                {safeStringify(e.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {STANDARD_FACTORS.map(f => (
                          <span key={f} className="ops-chip !py-1">{f}</span>
                        ))}
                      </div>

                      {topDecision.reason && (
                        <div>
                          <div className="tech-label tech-label-cyan mb-1">REASONING</div>
                          <p className="text-[12px] text-white/65 leading-relaxed">{topDecision.reason}</p>
                        </div>
                      )}
                      {topDecision.alternative_considered && (
                        <div>
                          <div className="tech-label mb-1">ALTERNATIVE CONSIDERED</div>
                          <p className="text-[12px] text-white/55 leading-relaxed">{topDecision.alternative_considered}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      ) : (
        <div className="ops-panel-flat p-8 text-center">
          <Sparkles className="mx-auto text-white/15" size={36} />
          <p className="text-white/55 mt-2 font-medium text-[13px]">No recommendation yet</p>
          <p className="text-[11px] text-white/35 mt-1">
            The optimizer publishes its top action each scheduler cycle. Trigger one now with Apply Optimization once telemetry is live.
          </p>
        </div>
      )}

      {/* ── Decision history ── */}
      <section className="ops-panel overflow-hidden">
        <div className="ops-panel-header">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-amber-300/80" />
            <span className="tech-label tech-label-cyan">DECISION HISTORY</span>
          </div>
          <span className="tech-label num">
            {history.loading ? 'LOADING…' : `${filteredDecisions.length} OF ${history.decisions?.length ?? 0}`}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-ops-line bg-black/20">
          <label className="flex items-center gap-2 text-[11px] text-white/50">
            TYPE
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as DecisionType | 'all')}
              className="ops-input !w-auto !py-1.5 text-[12px]"
            >
              {DECISION_TYPES.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All types' : t.replace('_', ' ')}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-white/50">
            MIN CONFIDENCE %
            <input
              type="number"
              min={0}
              max={100}
              value={minConfidence}
              onChange={e => setMinConfidence(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="ops-input num !w-20 !py-1.5 text-[12px]"
              aria-label="Minimum confidence percent"
            />
          </label>
        </div>

        <div className="p-4 space-y-2.5">
          {history.loading && (
            <>
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 animate-pulse">
                  <div className="h-3 w-24 bg-white/10 rounded" />
                  <div className="h-3.5 w-2/3 bg-white/[0.07] rounded mt-3" />
                  <div className="h-3 w-full bg-white/[0.04] rounded mt-3" />
                </div>
              ))}
            </>
          )}

          {!history.loading && history.error && (
            <div className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-[12px] text-red-200">{history.error}</p>
              <button type="button" onClick={() => void history.refetch()} className="ops-btn shrink-0">
                <RefreshCw size={12} /> RETRY
              </button>
            </div>
          )}

          {!history.loading && !history.error && filteredDecisions.length === 0 && (
            <div className="py-10 text-center">
              <Activity className="mx-auto text-white/15" size={32} />
              <p className="text-white/50 mt-2 text-[13px] font-medium">No decisions match the current filters</p>
              <p className="text-[11px] text-white/35 mt-1">Lower the confidence threshold or select another decision type.</p>
            </div>
          )}

          {!history.loading && !history.error &&
            filteredDecisions.map(d => <DecisionCard key={d.decision_id} decision={d} />)}
        </div>
      </section>
    </div>
  );
}
