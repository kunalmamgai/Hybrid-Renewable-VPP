/**
 * EnergyFlowDiagram — the visual identity of the platform.
 * Solar/Wind → AI Optimizer → Battery / Loads / Grid with animated energy
 * particles whose density & speed track real power flows. Static layout is
 * SVG (responsive, crisp); particles render on an overlay canvas (performant).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { formatPower } from '../../lib/format';

export interface EnergyFlowData {
  solarKw: number;
  windKw: number;
  demandKw: number;
  gridImportKw: number;
  gridExportKw: number;
  avgSocPct: number;
  /** >0 discharging, <0 charging, null unknown */
  batteryKw: number | null;
}

const VB_W = 1000;
const VB_H = 560;

interface NodeBox {
  x: number; y: number; w: number; h: number;
}

const NODES = {
  solar: { x: 55, y: 36, w: 190, h: 118 },
  wind: { x: 755, y: 36, w: 190, h: 118 },
  hub: { x: 395, y: 212, w: 210, h: 112 },
  battery: { x: 55, y: 396, w: 225, h: 128 },
  loads: { x: 388, y: 396, w: 224, h: 128 },
  grid: { x: 725, y: 396, w: 220, h: 128 },
} satisfies Record<string, NodeBox>;

interface FlowPath {
  key: string;
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  color: string;
  /** Normalised magnitude 0..1 drives particle count/speed */
  intensity: () => number;
  /** true when particles flow source→dest (false = reverse) */
  forward: () => boolean;
  dash?: boolean;
}

/** Cubic bezier point. */
function bezierPoint(
  p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], t: number,
): [number, number] {
  const u = 1 - t;
  const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
  return [
    w0 * p0[0] + w1 * p1[0] + w2 * p2[0] + w3 * p3[0],
    w0 * p0[1] + w1 * p1[1] + w2 * p2[1] + w3 * p3[1],
  ];
}

const COLORS = {
  solar: '#fbbf24',
  wind: '#2dd4bf',
  battery: '#34d399',
  gridImport: '#a89a88',
  gridExport: '#f5d08a',
  load: '#f5d08a',
};

export function EnergyFlowDiagram({ data }: { data: EnergyFlowData }) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const flows = useMemo<FlowPath[]>(() => {
    const s = NODES.solar, w = NODES.wind, h = NODES.hub;
    return [
      {
        key: 'solar',
        p0: [s.x + s.w / 2, s.y + s.h], p1: [s.x + s.w / 2, s.y + s.h + 34],
        p2: [h.x + 40, h.y - 40], p3: [h.x + 44, h.y],
        color: COLORS.solar,
        intensity: () => Math.min(1, data.solarKw / 800),
        forward: () => data.solarKw > 0,
      },
      {
        key: 'wind',
        p0: [w.x + w.w / 2, w.y + w.h], p1: [w.x + w.w / 2, w.y + w.h + 34],
        p2: [h.x + h.w - 40, h.y - 40], p3: [h.x + h.w - 44, h.y],
        color: COLORS.wind,
        intensity: () => Math.min(1, data.windKw / 400),
        forward: () => data.windKw > 0,
      },
      {
        key: 'battery',
        p0: [h.x + 46, h.y + h.h], p1: [h.x + 46, h.y + h.h + 36],
        p2: [NODES.battery.x + NODES.battery.w / 2 + 30, NODES.battery.y - 42],
        p3: [NODES.battery.x + NODES.battery.w / 2 + 10, NODES.battery.y],
        color: COLORS.battery,
        intensity: () => Math.min(1, Math.abs(data.batteryKw ?? 0) / 200),
        forward: () => (data.batteryKw ?? 0) < 0, // charging: hub→battery
      },
      {
        key: 'loads',
        p0: [h.x + h.w / 2, h.y + h.h], p1: [h.x + h.w / 2, NODES.loads.y - 20],
        p2: [NODES.loads.x + NODES.loads.w / 2, NODES.loads.y - 20], p3: [NODES.loads.x + NODES.loads.w / 2, NODES.loads.y],
        color: COLORS.load,
        intensity: () => Math.min(1, data.demandKw / 700),
        forward: () => data.demandKw > 0,
      },
      {
        key: 'grid',
        p0: [h.x + h.w - 46, h.y + h.h], p1: [h.x + h.w - 46, h.y + h.h + 36],
        p2: [NODES.grid.x + NODES.grid.w / 2 - 30, NODES.grid.y - 42],
        p3: [NODES.grid.x + NODES.grid.w / 2 - 10, NODES.grid.y],
        color: data.gridExportKw > data.gridImportKw ? COLORS.gridExport : COLORS.gridImport,
        intensity: () => Math.min(1, Math.max(data.gridImportKw, data.gridExportKw) / 300),
        forward: () => data.gridExportKw >= data.gridImportKw, // export: hub→grid
      },
    ];
  }, [data]);

  // ── Particle animation ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || reduced) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let raf = 0;
    let running = true;

    interface Particle { flow: number; t: number; }
    let particles: Particle[] = [];
    const rebuild = () => {
      particles = [];
      flows.forEach((f, i) => {
        const n = 3 + Math.round(f.intensity() * 6);
        for (let k = 0; k < n; k++) particles.push({ flow: i, t: k / n });
      });
    };
    rebuild();

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const sx = canvas.width / VB_W;
      const sy = canvas.height / VB_H;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        const f = flows[p.flow];
        const intensity = f.intensity();
        if (!f.forward()) {
          p.t -= dt * (0.08 + intensity * 0.22);
          if (p.t < 0) p.t += 1;
        } else {
          p.t += dt * (0.08 + intensity * 0.22);
          if (p.t > 1) p.t -= 1;
        }
        if (intensity <= 0.005) continue;
        const [x, y] = bezierPoint(f.p0, f.p1, f.p2, f.p3, p.t);
        const alpha = 0.35 + intensity * 0.55;
        ctx.beginPath();
        ctx.arc(x * sx, y * sy, 2.4 * sx, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 8 * sx;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [flows, reduced]);

  // ── Derived display values ────────────────────────────────────────────
  const renewableTotal = data.solarKw + data.windKw;
  const pctOfDemand = (kw: number) =>
    data.demandKw > 0 ? `${Math.min(999, Math.round((kw / data.demandKw) * 100))}%` : '—';

  const batteryState = (() => {
    const bk = data.batteryKw;
    if (bk === null) return { label: 'STANDBY', tone: 'rgba(243,237,228,0.5)' };
    if (bk < -1) return { label: 'CHARGING', tone: '#34d399' };
    if (bk > 1) return { label: 'DISCHARGING', tone: '#fbbf24' };
    return { label: 'IDLE', tone: 'rgba(243,237,228,0.5)' };
  })();

  const gridState = data.gridExportKw > data.gridImportKw
    ? { label: 'EXPORTING', tone: '#f5d08a', val: formatPower(data.gridExportKw) }
    : data.gridImportKw > 0.5
      ? { label: 'IMPORTING', tone: '#a89a88', val: formatPower(data.gridImportKw) }
      : { label: 'STANDBY', tone: 'rgba(243,237,228,0.5)', val: formatPower(0) };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="block w-full h-auto"
        role="img"
        aria-label={`Energy flow diagram: solar ${formatPower(data.solarKw)}, wind ${formatPower(data.windKw)}, demand ${formatPower(data.demandKw)}, battery ${Math.round(data.avgSocPct)} percent, grid import ${formatPower(data.gridImportKw)}`}
      >
        <defs>
          <linearGradient id="ef-hub" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b2114" />
            <stop offset="100%" stopColor="#171208" />
          </linearGradient>
          <linearGradient id="ef-node" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,27,21,0.85)" />
            <stop offset="100%" stopColor="rgba(20,16,12,0.92)" />
          </linearGradient>
        </defs>

        {/* Fine background grid */}
        <g opacity="0.5">
          {Array.from({ length: Math.floor(VB_W / 50) + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={VB_H} stroke="rgba(224,197,160,0.04)" strokeWidth="1" />
          ))}
          {Array.from({ length: Math.floor(VB_H / 50) + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 50} x2={VB_W} y2={i * 50} stroke="rgba(224,197,160,0.04)" strokeWidth="1" />
          ))}
        </g>

        {/* Static edge lines */}
        {flows.map(f => (
          <path
            key={`edge-${f.key}`}
            d={`M${f.p0[0]},${f.p0[1]} C${f.p1[0]},${f.p1[1]} ${f.p2[0]},${f.p2[1]} ${f.p3[0]},${f.p3[1]}`}
            fill="none"
            stroke={f.intensity() > 0.01 ? f.color : 'rgba(224,197,160,0.14)'}
            strokeOpacity={f.intensity() > 0.01 ? 0.28 : 1}
            strokeWidth="1.6"
          />
        ))}

        {/* Direction arrows mid-edge */}
        {flows.map(f => {
          const [ax, ay] = f.intensity() > 0.01
            ? bezierPoint(f.p0, f.p1, f.p2, f.p3, f.forward() ? 0.62 : 0.38)
            : [0, 0];
          if (f.intensity() <= 0.01) return null;
          return (
            <g key={`arrow-${f.key}`} transform={`translate(${ax},${ay})`}>
              <circle r="3.4" fill={f.color} opacity="0.85" />
              <circle r="7" fill={f.color} opacity="0.18" />
            </g>
          );
        })}

        {/* Source node: SOLAR */}
        <NodeCard box={NODES.solar} accent="#fbbf24" label="SOLAR GENERATION" value={formatPower(data.solarKw)} sub={`${pctOfDemand(data.solarKw)} of demand`} active={data.solarKw > 1} />

        {/* Source node: WIND */}
        <NodeCard box={NODES.wind} accent="#2dd4bf" label="WIND GENERATION" value={formatPower(data.windKw)} sub={`${pctOfDemand(data.windKw)} of demand`} active={data.windKw > 1} />

        {/* AI Optimizer hub */}
        <g>
          <rect x={NODES.hub.x} y={NODES.hub.y} width={NODES.hub.w} height={NODES.hub.h} rx="14" fill="url(#ef-hub)" stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="1.4" />
          <rect x={NODES.hub.x + 8} y={NODES.hub.y + 8} width={NODES.hub.w - 16} height={NODES.hub.h - 16} rx="10" fill="none" stroke="#f59e0b" strokeOpacity="0.14" strokeWidth="1" />
          <text x={NODES.hub.x + NODES.hub.w / 2} y={NODES.hub.y + 34} textAnchor="middle" fill="#f5d08a" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="2.4">AI OPTIMIZER</text>
          <text x={NODES.hub.x + NODES.hub.w / 2} y={NODES.hub.y + 58} textAnchor="middle" fill="#f3ede4" fontSize="17" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            {formatPower(renewableTotal)}
          </text>
          <text x={NODES.hub.x + NODES.hub.w / 2} y={NODES.hub.y + 78} textAnchor="middle" fill="rgba(243,237,228,0.4)" fontSize="10" fontFamily="Inter, sans-serif">renewable dispatch</text>
          <circle cx={NODES.hub.x + 18} cy={NODES.hub.y + 18} r="3" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Battery node */}
        <NodeCard
          box={NODES.battery}
          accent="#34d399"
          label="BATTERY STORAGE"
          value={`${data.avgSocPct.toFixed(0)}%`}
          sub={`${formatPower(Math.abs(data.batteryKw ?? 0))} · ${batteryState.label}`}
          active={(data.batteryKw ?? 0) !== 0}
          soc={data.avgSocPct}
        />

        {/* Loads node */}
        <NodeCard
          box={NODES.loads}
          accent="#f5d08a"
          label="CAMPUS LOAD"
          value={formatPower(data.demandKw)}
          sub="critical + flexible"
          active={data.demandKw > 1}
        />

        {/* Grid node */}
        <NodeCard
          box={NODES.grid}
          accent={gridState.tone}
          label="GRID"
          value={gridState.val}
          sub={gridState.label}
          active={data.gridImportKw > 0.5 || data.gridExportKw > 0.5}
        />
      </svg>

      {/* Particle overlay */}
      {!reduced && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      )}
    </div>
  );
}

/** SVG node card used inside the diagram. */
function NodeCard({
  box, accent, label, value, sub, active, soc,
}: {
  box: NodeBox;
  accent: string;
  label: string;
  value: string;
  sub?: string;
  active: boolean;
  soc?: number;
}) {
  const cx = box.x + box.w / 2;
  return (
    <g>
      <rect
        x={box.x} y={box.y} width={box.w} height={box.h} rx="13"
        fill="url(#ef-node)"
        stroke={accent}
        strokeOpacity={active ? 0.42 : 0.16}
        strokeWidth="1.2"
      />
      {active && (
        <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="13" fill={accent} opacity="0.045" />
      )}
      <text x={cx} y={box.y + 24} textAnchor="middle" fill="rgba(243,237,228,0.45)" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1.8">{label}</text>
      <text x={cx} y={box.y + (soc !== undefined ? 56 : 52)} textAnchor="middle" fill="#f7f0e3" fontSize="23" fontWeight="700" fontFamily="JetBrains Mono, monospace">{value}</text>

      {/* SOC bar for battery */}
      {soc !== undefined && (
        <g>
          <rect x={box.x + 28} y={box.y + 68} width={box.w - 56} height="7" rx="3.5" fill="rgba(224,197,160,0.12)" />
          <rect x={box.x + 28} y={box.y + 68} width={Math.max(4, ((box.w - 56) * Math.min(100, Math.max(0, soc))) / 100)} height="7" rx="3.5" fill={accent} opacity="0.85" />
        </g>
      )}

      {sub && (
        <text x={cx} y={box.y + (soc !== undefined ? 96 : 82)} textAnchor="middle" fill={active ? accent : 'rgba(243,237,228,0.35)'} fontSize="10.5" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.6">
          {sub}
        </text>
      )}
    </g>
  );
}
