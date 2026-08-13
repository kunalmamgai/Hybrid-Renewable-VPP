const enIN = new Intl.NumberFormat('en-IN');

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