/**
 * Copilot engine — a deterministic, rule-based energy analyst.
 * Answers are composed from live telemetry, the AI decision log, the derived
 * 24h forecast and reliability status. No LLM calls, no mock data: every
 * sentence cites real values so the analyst is fully explainable.
 */
import type { Decision, DecisionStats, ReliabilityStatus } from '../types';
import type { CampusMetrics } from '../context/MetricsContext';
import type { CampusForecast } from '../lib/forecast';
import { formatPower, formatINR, formatCO2, pct } from '../lib/format';

export interface CopilotContext {
  metrics: CampusMetrics;
  reliability: ReliabilityStatus | null;
  latestDecisions: Decision[];
  decisionStats: DecisionStats | null;
  forecast: CampusForecast | null;
}

export interface SuggestedQuestion {
  q: string;
  match: RegExp;
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { q: 'Why is grid import high?', match: /grid import|import high/i },
  { q: "How can I reduce today's energy cost?", match: /reduce.*cost|save.*money|energy cost/i },
  { q: 'When should the battery charge?', match: /battery.*charge|charge.*battery/i },
  { q: 'What is causing the carbon spike?', match: /carbon|emission|co2/i },
  { q: 'Simulate a 20% increase in demand.', match: /simulate|increase in demand|\+?20%/i },
  { q: "Explain today's energy schedule.", match: /schedule|plan|timeline/i },
  { q: 'Find anomalies in the current system.', match: /anomal|unusual|problem/i },
  { q: 'Give me the three best actions right now.', match: /best actions|recommend/i },
];

function topDecision(ctx: CopilotContext): Decision | null {
  return ctx.latestDecisions[0] ?? null;
}

export function askCopilot(question: string, ctx: CopilotContext): string {
  const m = ctx.metrics;
  if (!m.hasData) {
    return 'Telemetry is still connecting. Once the digital twin stream is live I can analyse generation, storage and grid flows in real time.';
  }

  const f = ctx.forecast;

  // ── Why is grid import high?
  if (/grid import|import high|why.*grid/i.test(question)) {
    const parts: string[] = [];
    parts.push(`Campus is currently importing ${formatPower(m.gridImportKw)} while demand stands at ${formatPower(m.demandKw)}.`);
    if (m.renewablePct < 100) {
      parts.push(`Renewables are covering only ${pct(m.renewablePct, 0)} of demand (${formatPower(m.renewableKw)}), so the balance comes from the grid.`);
    }
    if (m.batteryKw !== null && m.batteryKw > 1) {
      parts.push('The battery is discharging right now, which is already reducing the import you would otherwise see.');
    } else if (m.avgSocPct < 30) {
      parts.push(`Battery SOC is low at ${pct(m.avgSocPct, 0)}, limiting discharge support.`);
    }
    const rel = ctx.reliability;
    if (rel && !rel.emergency_mode) {
      parts.push(`Reliability guard reports ${(rel.reserve_duration_hours ?? 0).toFixed(1)}h of reserve autonomy with no emergency shortfall predicted.`);
    }
    if (f && f.deficitWindows.length > 0) {
      const w = f.deficitWindows[0];
      parts.push(`Forecast expects the next deficit window around ${w.start}–${w.end}; shifting flexible load out of it will cut imports further.`);
    }
    return parts.join(' ');
  }

  // ── Reduce cost
  if (/reduce.*cost|cost reduction|save.*money|cheaper|energy cost/i.test(question)) {
    const parts: string[] = [];
    const td = topDecision(ctx);
    if (td) {
      parts.push(`The optimizer's current best action saves ${formatINR(td.expected_savings_inr)} per cycle: “${td.action}”`);
    }
    if (f && f.surplusWindows.length > 0) {
      const w = f.surplusWindows[0];
      parts.push(`Run flexible loads during the ${w.start}–${w.end} surplus window to soak up free renewable power instead of paying peak tariffs.`);
    }
    parts.push(`Lifetime savings logged so far: ${formatINR(ctx.decisionStats?.total_savings_inr ?? 0)} across ${ctx.decisionStats?.total_decisions ?? 0} AI decisions.`);
    return parts.join(' ');
  }

  // ── Battery charging window
  if (/battery.*(charge|discharge)|charge.*battery|soc/i.test(question)) {
    const parts: string[] = [];
    parts.push(`Battery bank is at ${pct(m.avgSocPct, 0)} SOC${m.batteryKw !== null ? (m.batteryKw < 0 ? ' and charging' : ' and discharging') : ''}.`);
    if (f && f.surplusWindows.length > 0) {
      const w = f.surplusWindows[0];
      parts.push(`Best charging window today is ${w.start}–${w.end}, when solar+wind exceed demand by ~${formatPower(w.avgSurplusKw)} on average.`);
      if (f.solarPeak) parts.push(`Solar peaks at ${f.solarPeak.time} (${formatPower(f.solarPeak.kw)}) — prioritise charging through that period.`);
    } else {
      parts.push('No clear renewable surplus is forecast in the next 24h, so charge during off-peak tariff hours to minimise cost.');
    }
    return parts.join(' ');
  }

  // ── Carbon
  if (/carbon|emission|co2|greenhouse/i.test(question)) {
    const parts: string[] = [];
    parts.push(`Lifetime carbon avoided is ${formatCO2(ctx.decisionStats?.total_carbon_reduction_kg ?? 0)}, driven by displacing grid import (0.74 kg CO₂/kWh Rajasthan average).`);
    parts.push(`Right now renewables supply ${pct(m.renewablePct, 0)} of campus demand — every kW imported from the grid carries the full emission factor.`);
    if (m.gridImportKw > 20) {
      parts.push(`The current ${formatPower(m.gridImportKw)} import is the main emission driver this hour; battery discharge or load shift directly reduces it.`);
    }
    if (f && f.totalDemandKwh > 0) {
      const renewableShare = Math.min(100, ((f.totalSolarKwh + f.totalWindKwh) / f.totalDemandKwh) * 100);
      parts.push(`Over the next 24h the forecast implies a ${renewableShare.toFixed(0)}% renewable share, avoiding roughly ${((Math.max(0, f.totalDemandKwh - (f.totalSolarKwh + f.totalWindKwh))) * 0 + (f.totalSolarKwh + f.totalWindKwh) * 0.74 / 1000).toFixed(2)} tCO₂ versus full-grid supply.`);
    }
    return parts.join(' ');
  }

  // ── Simulate demand increase
  if (/simulate|increase in demand|\d+\s*%(\s)*(more|higher|increase)|what if/i.test(question)) {
    const parts: string[] = [];
    const scaled = m.demandKw * 1.2;
    const gap = scaled - m.renewableKw - Math.max(0, m.gridImportKw);
    parts.push(`A 20% demand rise takes campus load from ${formatPower(m.demandKw)} to ~${formatPower(scaled)}.`);
    if (gap > 0) {
      parts.push(`Renewables (${formatPower(m.renewableKw)}) plus current import would leave a ~${formatPower(gap)} shortfall that must come from extra grid draw or battery discharge.`);
    } else {
      parts.push('Renewable supply would still cover the higher load, keeping grid import near current levels.');
    }
    const rel = ctx.reliability;
    if (rel) {
      const newReserve = rel.reserve_duration_hours / 1.2;
      parts.push(`Battery reserve autonomy would drop from ~${rel.reserve_duration_hours.toFixed(1)}h to ~${newReserve.toFixed(1)}h against the critical-load floor.`);
    }
    parts.push('Open Digital Twin → Simulation mode to run this scenario with live sliders and compare cost, reliability, carbon and battery-health impacts.');
    return parts.join(' ');
  }

  // ── Schedule explanation
  if (/schedule|timeline|plan|gantt/i.test(question)) {
    const parts: string[] = [];
    const recent = ctx.latestDecisions.slice(0, 3);
    if (recent.length === 0) {
      parts.push('No AI schedule has been generated yet — trigger a cycle from Overview → Force Cycle and I will walk you through it.');
    } else {
      parts.push(`Today's plan was selected by scoring dispatch × battery strategies on weighted cost (70%) and carbon (30%), then filtering by the reliability reserve floor.`);
      for (const d of recent) {
        parts.push(`• ${d.decision_type.toUpperCase()} — ${d.action}`);
      }
      parts.push('See Scheduler for the block-by-block timeline of today\'s operations.');
    }
    return parts.join(' ');
  }

  // ── Fallback: system summary
  const parts: string[] = [
    `System snapshot: generating ${formatPower(m.renewableKw)} from renewables against ${formatPower(m.demandKw)} demand.`,
    `Grid import is ${formatPower(m.gridImportKw)}, battery sits at ${pct(m.avgSocPct, 0)} SOC.`,
  ];
  const td = topDecision(ctx);
  if (td) parts.push(`Latest AI action: ${td.action}`);
  parts.push('Ask me about grid import, cost savings, battery timing, carbon, or today’s schedule.');
  return parts.join(' ');
}
