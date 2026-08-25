/**
 * Digital Twin — interactive energy infrastructure representation.
 * LIVE MODE renders the existing LiveEnergyFlow workspace untouched
 * (3D campus twin iframe + React Flow dispatch network).
 * SIMULATION MODE overlays operator-adjustable parameters and predicts the
 * effect on cost, reliability, carbon and battery health using the same
 * mirrored forecast math as the backend (lib/forecast.ts) — no mock data.
 */
import { useMemo, useState } from 'react';
import { Radio, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { LiveEnergyFlow } from '../components/dashboard/LiveEnergyFlow';
import { useCampusForecast } from '../hooks/useCampusForecast';
import { useCampusMetrics, CAMPUS_BATTERY_CAPACITY_KWH } from '../context/MetricsContext';
import { formatKwh, formatINR, formatPower } from '../lib/format';

type Mode = 'live' | 'simulation';

interface SimParams {
  cloudCover: number;   // 0..0.9
  windSpeed: number;    // m/s
  demandScale: number;  // 0.5..1.5
  batteryCapacityScale: number; // 0.5..1.5
  gridAvailable: boolean;
}

const DEFAULT_PARAMS: SimParams = {
  cloudCover: 0.2,
  windSpeed: 5.5,
  demandScale: 1.0,
  batteryCapacityScale: 1.0,
  gridAvailable: true,
};

const AVG_TARIFF_INR = 9.0;
const GRID_EMISSION_KG_PER_KWH = 0.74;

export default function DigitalTwinPage() {
  const [mode, setMode] = useState<Mode>('live');
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);

  return (
    <div className="space-y-5">
      {/* Header + mode toggle */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="tech-label mb-1.5">DIGITAL TWIN</div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
            Interactive Energy Infrastructure
          </h1>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            Explore every asset live, or run what-if scenarios against the physics model to predict cost, reliability, carbon and battery-health impacts.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-ops-surface border border-ops-line" role="tablist" aria-label="Twin mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'live'}
            onClick={() => setMode('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${
              mode === 'live' ? 'bg-amber-600/90 text-[#241a02] shadow-ops-cyan-glow' : 'text-white/50 hover:text-white'
            }`}
          >
            <Radio size={13} /> LIVE MODE
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'simulation'}
            onClick={() => setMode('simulation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${
              mode === 'simulation' ? 'bg-amber-400/90 text-[#241a02] shadow-[0_0_18px_rgba(251,191,36,0.25)]' : 'text-white/50 hover:text-white'
            }`}
          >
            <SlidersHorizontal size={13} /> SIMULATION MODE
          </button>
        </div>
      </div>

      {mode === 'live' ? (
        <div className="twin-host">
          <LiveEnergyFlow />
        </div>
      ) : (
        <SimulationPanel params={params} onChange={setParams} />
      )}
    </div>
  );
}

// ─── Simulation mode ───────────────────────────────────────────────────────

function SimulationPanel({ params, onChange }: { params: SimParams; onChange: (p: SimParams) => void }) {
  const m = useCampusMetrics();

  // Scenario forecast vs baseline forecast (same model, different inputs)
  const overrides = useMemo(() => ({
    cloudCover: params.cloudCover,
    windSpeed: params.windSpeed,
    demandScale: params.demandScale,
  }), [params]);

  const baseline = useCampusForecast();
  const scenario = useCampusForecast(m.hasData ? overrides : undefined);

  const impacts = useMemo(() => {
    if (!scenario || !baseline || !m.hasData) return null;

    const summarize = (f: NonNullable<typeof scenario>) => {
      let import_ = 0;
      let unmet = 0;
      for (const p of f.points) {
        const net = p.demandKw - (p.solarKw + p.windKw);
        const draw = Math.max(0, net);
        if (params.gridAvailable) {
          import_ += draw;
        } else {
          unmet += Math.max(0, net - Math.max(0, CAMPUS_BATTERY_CAPACITY_KWH * 0.2));
        }
      }
      const stepH = 0.25;
      return {
        importKwh: import_ * stepH,
        unmetKwh: unmet * stepH,
        solarKwh: f.totalSolarKwh,
        windKwh: f.totalWindKwh,
        demandKwh: f.totalDemandKwh,
      };
    };

    const s = summarize(scenario);
    const b = summarize(baseline);

    const costDelta = (s.importKwh - b.importKwh) * AVG_TARIFF_INR;
    const carbonDeltaKg = (s.importKwh - b.importKwh) * GRID_EMISSION_KG_PER_KWH;

    // Battery throughput proxy: discharge needed ≈ max(0, demand - renewables)
    const cycleStress =
      ((s.demandKwh - s.solarKwh - s.windKwh) / (CAMPUS_BATTERY_CAPACITY_KWH * params.batteryCapacityScale)) -
      ((b.demandKwh - b.solarKwh - b.windKwh) / CAMPUS_BATTERY_CAPACITY_KWH);
    const healthImpactPct = Math.max(-0.8, Math.min(0, cycleStress * 0.004)); // ~0.05% per full deep cycle

    const reliabilityScore = Math.max(
      0,
      Math.min(100, 100 - (s.unmetKwh / Math.max(1, s.demandKwh)) * 100),
    );

    return {
      costDelta,
      carbonDeltaKg,
      healthImpactPct,
      reliabilityScore,
      importKwh: s.importKwh,
      unmetKwh: s.unmetKwh,
      solarKwh: s.solarKwh,
      windKwh: s.windKwh,
    };
  }, [scenario, baseline, params, m.hasData]);

  const set = <K extends keyof SimParams>(k: K, v: SimParams[K]) =>
    onChange({ ...params, [k]: v });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Parameter controls */}
      <section className="ops-panel p-4 space-y-4 h-fit" aria-label="Scenario parameters">
        <div className="flex items-center justify-between">
          <span className="tech-label tech-label-amber">SCENARIO PARAMETERS</span>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PARAMS)}
            className="ops-btn ops-btn-ghost !px-2 !py-1 !text-[10px]"
          >
            <RotateCcw size={11} /> RESET
          </button>
        </div>

        <Slider label="Solar irradiance" hint={`${Math.round((1 - params.cloudCover / 0.9) * 100)}% clear sky`} min={0} max={0.9} step={0.05}
          value={params.cloudCover} onChange={v => set('cloudCover', v)} display={v => `${Math.round((1 - v / 0.9) * 100)}%`} />
        <Slider label="Wind speed" hint="m/s at hub height" min={0} max={15} step={0.5}
          value={params.windSpeed} onChange={v => set('windSpeed', v)} display={v => `${v.toFixed(1)} m/s`} />
        <Slider label="Load demand" hint="campus-wide multiplier" min={0.5} max={1.5} step={0.05}
          value={params.demandScale} onChange={v => set('demandScale', v)} display={v => `${Math.round(v * 100)}%`} />
        <Slider label="Battery capacity" hint="installed bank size multiplier" min={0.5} max={1.5} step={0.05}
          value={params.batteryCapacityScale} onChange={v => set('batteryCapacityScale', v)} display={v => `${Math.round(v * 100)}%`} />

        <label className="flex items-center justify-between cursor-pointer select-none pt-1">
          <span className="text-[12px] font-semibold text-white/70">Grid availability</span>
          <button
            type="button"
            role="switch"
            aria-checked={params.gridAvailable}
            onClick={() => set('gridAvailable', !params.gridAvailable)}
            className={`relative w-10 rounded-full transition-colors ${params.gridAvailable ? 'bg-emerald-500/80' : 'bg-red-500/60'}`}
            style={{ height: '22px' }}
          >
            <span
              className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${params.gridAvailable ? 'translate-x-[21px]' : 'translate-x-[3px]'}`}
            />
          </button>
        </label>
        {!params.gridAvailable && (
          <p className="text-[10px] text-red-300/80 leading-relaxed">
            Islanded operation — deficits cannot be imported. Reliability reflects unmet energy against the critical reserve.
          </p>
        )}
      </section>

      {/* Predicted effects */}
      <section className="xl:col-span-2 space-y-4" aria-label="Predicted effects">
        <div className="ops-panel overflow-hidden">
          <div className="ops-panel-header">
            <span className="tech-label tech-label-cyan">PREDICTED EFFECTS · NEXT 24 H</span>
            <span className="tech-label">VS CURRENT BASELINE</span>
          </div>

          {!impacts ? (
            <div className="p-8 text-center text-white/40 text-[12px]">Generating scenario forecast…</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-ops-line">
              <EffectCard
                title="COST IMPACT"
                value={`${impacts.costDelta >= 0 ? '+' : ''}${formatINR(Math.abs(impacts.costDelta), true)}`}
                sub={impacts.costDelta > 0 ? 'additional spend' : impacts.costDelta < 0 ? 'projected saving' : 'no change'}
                tone={impacts.costDelta > 20 ? '#f87171' : impacts.costDelta < -20 ? '#34d399' : '#f3ede4'}
              />
              <EffectCard
                title="CARBON IMPACT"
                value={`${impacts.carbonDeltaKg >= 0 ? '+' : '−'}${Math.abs(impacts.carbonDeltaKg).toFixed(1)} kg`}
                sub="vs baseline day"
                tone={impacts.carbonDeltaKg > 10 ? '#fbbf24' : '#34d399'}
              />
              <EffectCard
                title="RELIABILITY"
                value={`${impacts.reliabilityScore.toFixed(1)}%`}
                sub={impacts.unmetKwh > 1 ? `${formatKwh(impacts.unmetKwh)} unmet without grid` : 'all loads served'}
                tone={impacts.reliabilityScore > 95 ? '#34d399' : impacts.reliabilityScore > 80 ? '#fbbf24' : '#f87171'}
              />
              <EffectCard
                title="BATTERY HEALTH"
                value={`${impacts.healthImpactPct === 0 ? '±0.0' : impacts.healthImpactPct.toFixed(2)}%/day`}
                sub="degradation rate delta"
                tone={impacts.healthImpactPct < -0.4 ? '#fbbf24' : '#f3ede4'}
              />
            </div>
          )}
        </div>

        {/* Scenario comparison table */}
        <div className="ops-panel overflow-hidden">
          <div className="ops-panel-header">
            <span className="tech-label">SCENARIO COMPARISON</span>
            <span className="tech-label">24 H ENERGY BALANCE</span>
          </div>
          {impacts && (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left tech-label">
                  <th className="px-4 py-2 font-medium">Metric</th>
                  <th className="px-4 py-2 font-medium text-right">Baseline</th>
                  <th className="px-4 py-2 font-medium text-right">Scenario</th>
                </tr>
              </thead>
              <tbody className="ops-divide num">
                <CompareRow label="Solar generation" a={baseline?.totalSolarKwh ?? 0} b={impacts.solarKwh} fmt={formatKwh} />
                <CompareRow label="Wind generation" a={baseline?.totalWindKwh ?? 0} b={impacts.windKwh} fmt={formatKwh} />
                <CompareRow label="Total demand" a={baseline?.totalDemandKwh ?? 0} b={scenario?.totalDemandKwh ?? 0} fmt={formatKwh} />
                <CompareRow label="Grid import required" a={estimateImport(baseline?.points)} b={estimateImport(scenario?.points)} fmt={formatKwh} />
              </tbody>
            </table>
          )}
          <div className="px-4 py-3 border-t border-ops-line text-[10px] text-white/35 leading-relaxed">
            Predictions use the same solar geometry, wind power-curve and demand-profile models as the backend ForecastEngine, seeded from live twin values ({m.hasData ? formatPower(m.renewableKw) : '—'} current renewables). Battery capacity scaling applies to the {CAMPUS_BATTERY_CAPACITY_KWH} kWh installed bank.
          </div>
        </div>
      </section>
    </div>
  );
}

function estimateImport(points: Array<{ demandKw: number; solarKw: number; windKw: number }> | undefined): number {
  if (!points) return 0;
  return points.reduce((s, p) => s + Math.max(0, p.demandKw - p.solarKw - p.windKw), 0) * 0.25;
}

function CompareRow({ label, a, b, fmt }: { label: string; a: number; b: number; fmt: (v: number) => string }) {
  const diff = b - a;
  const significant = Math.abs(diff) > Math.max(1, a * 0.01);
  return (
    <tr>
      <td className="px-4 py-2.5 text-white/65">{label}</td>
      <td className="px-4 py-2.5 text-right text-white/45">{fmt(a)}</td>
      <td className={`px-4 py-2.5 text-right font-semibold ${significant ? (diff > 0 ? 'text-amber-300' : 'text-emerald-300') : 'text-white/70'}`}>
        {fmt(b)}
        {significant && <span className="ml-1.5 text-[10px] opacity-70">({diff > 0 ? '+' : ''}{fmt(diff)})</span>}
      </td>
    </tr>
  );
}

function EffectCard({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: string }) {
  return (
    <div className="p-4 min-w-0">
      <div className="tech-label mb-2 truncate">{title}</div>
      <div className="num text-xl font-bold truncate" style={{ color: tone }}>{value}</div>
      <div className="text-[10px] text-white/40 mt-1 truncate">{sub}</div>
    </div>
  );
}

function Slider({
  label, hint, min, max, step, value, onChange, display,
}: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  display: (v: number) => string;
}) {
  const id = `sim-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="text-[12px] font-semibold text-white/75">{label}</label>
        <span className="num text-[11px] text-amber-300/90">{display(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        className="ops-input"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && <div id={`${id}-hint`} className="text-[10px] text-white/30 mt-1">{hint}</div>}
    </div>
  );
}
