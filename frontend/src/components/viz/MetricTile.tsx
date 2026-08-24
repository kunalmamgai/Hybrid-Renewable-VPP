/**
 * MetricTile — premium KPI tile: count-up mono value, unit, trend vs previous
 * sample, sparkline from the live history ring-buffer, status indicator.
 */
import { memo } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useCountUp } from '../../lib/motion';
import { Sparkline } from './Sparkline';

export type TileTone = 'cyan' | 'green' | 'amber' | 'red' | 'neutral';

const TONE = {
  cyan: {
    text: 'text-amber-300',
    stroke: '#f59e0b',
    chipBg: 'bg-amber-400/10 border-amber-300/25',
    glow: 'radial-gradient(70% 90% at 90% -10%, rgba(217,119,6,0.13), transparent 60%)',
  },
  green: {
    text: 'text-emerald-300',
    stroke: '#34d399',
    chipBg: 'bg-emerald-400/10 border-emerald-300/25',
    glow: 'radial-gradient(70% 90% at 90% -10%, rgba(52,211,153,0.13), transparent 60%)',
  },
  amber: {
    text: 'text-amber-300',
    stroke: '#fbbf24',
    chipBg: 'bg-amber-400/10 border-amber-300/25',
    glow: 'radial-gradient(70% 90% at 90% -10%, rgba(251,191,36,0.12), transparent 60%)',
  },
  red: {
    text: 'text-red-300',
    stroke: '#f87171',
    chipBg: 'bg-red-400/10 border-red-300/25',
    glow: 'radial-gradient(70% 90% at 90% -10%, rgba(248,113,113,0.12), transparent 60%)',
  },
  neutral: {
    text: 'text-white/80',
    stroke: 'rgba(243,237,228,0.6)',
    chipBg: 'bg-white/5 border-white/15',
    glow: 'radial-gradient(70% 90% at 90% -10%, rgba(224,197,160,0.08), transparent 60%)',
  },
} as const;

export interface MetricTileProps {
  label: string;
  value: number;
  /** Formatter for the animated value (without unit) */
  format?: (v: number) => string;
  unit?: string;
  sublabel?: string;
  sparkValues?: number[];
  trendPct?: number | null;
  tone?: TileTone;
  icon?: React.ReactNode;
}

function TrendBadge({ trendPct, tone }: { trendPct: number | null; tone: TileTone }) {
  if (trendPct === null || !Number.isFinite(trendPct) || Math.abs(trendPct) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-white/35">
        <Minus size={10} /> FLAT
      </span>
    );
  }
  const up = trendPct > 0;
  // For "lower is better" tones we keep colour semantic-neutral: cyan/green up = good.
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold num ${
        up ? (tone === 'red' ? 'text-red-300' : 'text-emerald-300') : (tone === 'red' ? 'text-emerald-300' : 'text-white/50')
      }`}
      aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(trendPct).toFixed(1)} percent`}
    >
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(trendPct).toFixed(1)}%
    </span>
  );
}

export const MetricTile = memo(function MetricTile({
  label,
  value,
  format = v => v.toFixed(2),
  unit,
  sublabel,
  sparkValues,
  trendPct,
  tone = 'cyan',
  icon,
}: MetricTileProps) {
  const t = TONE[tone];
  const animated = useCountUp(value);

  return (
    <div
      className="ops-panel !rounded-xl p-3.5 flex flex-col gap-2 min-w-0"
      style={{ background: `${t.glow}, linear-gradient(170deg, rgba(34,27,21,0.72), rgba(20,16,12,0.88))` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="tech-label truncate">{label}</span>
        {icon && (
          <span className={`w-6 h-6 shrink-0 grid place-items-center rounded-md border ${t.chipBg}`}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className={`num text-[22px] sm:text-[24px] leading-none font-bold ${t.text} truncate`}>
            {format(animated)}
            {unit && <span className="ml-1 text-[11px] font-medium text-white/40">{unit}</span>}
          </div>
          {(sublabel || trendPct !== undefined) && (
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {trendPct !== undefined && <TrendBadge trendPct={trendPct} tone={tone} />}
              {sublabel && <span className="text-[10px] text-white/35 truncate">{sublabel}</span>}
            </div>
          )}
        </div>
        {sparkValues && sparkValues.length >= 2 && (
          <div className="shrink-0 opacity-90">
            <Sparkline values={sparkValues} stroke={t.stroke} width={76} height={30} />
          </div>
        )}
      </div>
    </div>
  );
});
