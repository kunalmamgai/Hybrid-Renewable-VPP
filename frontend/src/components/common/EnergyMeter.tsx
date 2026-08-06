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
  solar: { color: 'text-vpp-amber', label: 'SOLAR', glowColor: 'rgba(245, 158, 11, 0.12)' },
  wind: { color: 'text-vpp-teal', label: 'WIND', glowColor: 'rgba(20, 184, 166, 0.12)' },
  battery: { color: 'text-vpp-blue', label: 'BATTERY', glowColor: 'rgba(59, 130, 246, 0.12)' },
  grid_import: { color: 'text-vpp-amber', label: 'GRID IMPORT', glowColor: 'rgba(245, 158, 11, 0.08)' },
  grid_export: { color: 'text-vpp-emerald', label: 'GRID EXPORT', glowColor: 'rgba(16, 185, 129, 0.12)' },
  demand: { color: 'text-vpp-navy-muted', label: 'DEMAND', glowColor: 'rgba(51, 65, 85, 0.08)' },
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
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-vpp-navy-muted/50';

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-4 transition-all duration-200",
        onClick ? "cursor-pointer hover:shadow-glass-lg hover:border-glass-border-strong" : "",
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
      <div className="text-2xl font-bold text-vpp-navy">
        {value.toFixed(1)} <span className="text-sm font-medium text-vpp-navy-muted">{unit}</span>
      </div>
      {trend !== 'neutral' && (
        <div className={`text-xs ${trendColor} mt-1 font-medium`}>
          {trend === 'up' ? '▲' : '▼'} {Math.abs(value).toFixed(1)}
        </div>
      )}
    </div>
  );
});
