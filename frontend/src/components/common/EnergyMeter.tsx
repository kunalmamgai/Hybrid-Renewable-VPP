/**
 * Reusable energy meter component — displays generation/consumption/import/export.
 * Glass-morphism style matching the landing page aesthetic.
 */
import { memo } from 'react';
import { cn } from '../../lib/utils';

export type MeterType = 'solar' | 'wind' | 'battery' | 'grid_import' | 'grid_export' | 'demand';

interface EnergyMeterProps {
  type: MeterType;
  value: number;
  label: string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  onClick?: () => void;
}

const typeConfig: Record<MeterType, { color: string; label: string; glowColor: string }> = {
  solar: { color: 'text-amber-600', label: 'SOLAR', glowColor: 'rgba(217, 119, 6, 0.12)' },
  wind: { color: 'text-amber-700', label: 'WIND', glowColor: 'rgba(180, 83, 9, 0.1)' },
  battery: { color: 'text-amber-800', label: 'BATTERY', glowColor: 'rgba(146, 64, 14, 0.1)' },
  grid_import: { color: 'text-amber-700', label: 'GRID IMPORT', glowColor: 'rgba(180, 83, 9, 0.08)' },
  grid_export: { color: 'text-amber-600', label: 'GRID EXPORT', glowColor: 'rgba(217, 119, 6, 0.1)' },
  demand: { color: 'text-amber-800', label: 'DEMAND', glowColor: 'rgba(146, 64, 14, 0.1)' },
};

export const EnergyMeter = memo(function EnergyMeter({
  type,
  value,
  label,
  unit = 'kW',
  icon,
  trend = 'neutral',
  className,
  onClick,
}: EnergyMeterProps) {
  const config = typeConfig[type];
  const trendColor = trend === 'up' ? 'text-amber-600' : trend === 'down' ? 'text-red-600' : 'text-amber-950/40';

  return (
    <div
      className={cn(
        "vpp-card p-4 transition-all duration-200",
        onClick ? "cursor-pointer hover:shadow-glass-lg" : "",
        className,
      )}
      style={onClick ? { boxShadow: `0 4px 20px ${config.glowColor}` } : undefined}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold ${config.color} uppercase tracking-wider`}>
          {label || config.label}
        </span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-amber-950 font-display">
        {value.toFixed(1)} <span className="text-sm font-medium text-amber-950/55">{unit}</span>
      </div>
      {trend !== 'neutral' && (
        <div className={`text-xs ${trendColor} mt-1 font-medium`}>
          {trend === 'up' ? '▲' : '▼'} {Math.abs(value).toFixed(1)}
        </div>
      )}
    </div>
  );
});
