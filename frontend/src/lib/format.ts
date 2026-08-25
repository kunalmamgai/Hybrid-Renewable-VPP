/**
 * Formatting helpers — consistent units across the operations console.
 * Includes the original legacy helpers used by MissionControl & co.
 */
const enIN = new Intl.NumberFormat('en-IN');

// ─── Legacy helpers (existing components depend on these) ─────────────────

export function inrCompact(v: number): string {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${enIN.format(v)}`;
}

export function inrFull(v: number): string {
  return `₹${enIN.format(v)}`;
}

export function grouped(v: number): string {
  return enIN.format(v);
}

export function carbonShort(kg: number): string {
  if (kg >= 1000) return `${enIN.format(kg / 1000)} t`;
  return `${enIN.format(kg)} kg`;
}

export function carbonFull(kg: number): string {
  return `${enIN.format(kg)} kg`;
}

/** kW → display string in MW when >= 1000 kW. */
export function formatPower(kw: number): string {
  if (!Number.isFinite(kw)) return '—';
  if (Math.abs(kw) >= 1000) return `${(kw / 1000).toFixed(2)} MW`;
  if (Math.abs(kw) >= 10) return `${kw.toFixed(1)} kW`;
  return `${kw.toFixed(2)} kW`;
}

export function formatMW(kw: number): string {
  if (!Number.isFinite(kw)) return '0.00';
  return (kw / 1000).toFixed(2);
}

export function formatINR(value: number, compact = false): string {
  if (!Number.isFinite(value)) return '₹—';
  if (compact && Math.abs(value) >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)}L`;
  if (compact && Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatCO2(kg: number): string {
  if (!Number.isFinite(kg)) return '—';
  if (Math.abs(kg) >= 1000) return `${(kg / 1000).toFixed(2)} tCO₂`;
  return `${kg.toFixed(1)} kg CO₂`;
}

export function formatKwh(kwh: number): string {
  if (!Number.isFinite(kwh)) return '—';
  if (Math.abs(kwh) >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
}

/** "13:40" style time from an ISO timestamp or Date. */
export function formatTime(ts: string | Date): string {
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTime(ts: string | Date): string {
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function pct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}
