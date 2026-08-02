/**
 * Reusable energy meter component — displays generation/consumption/import/export.
 */
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

const typeConfig: Record<MeterType, { color: string; label: string }> = {
  solar: { color: 'text-amber-500', label: 'SOLAR' },
  wind: { color: 'text-vpp-teal', label: 'WIND' },
  battery: { color: 'text-vpp-blue', label: 'BATTERY' },
  grid_import: { color: 'text-vpp-amber', label: 'GRID IMPORT' },
  grid_export: { color: 'text-vpp-green', label: 'GRID EXPORT' },
  demand: { color: 'text-gray-600', label: 'DEMAND' },
};

export function EnergyMeter({
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
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-4 shadow border border-grid-200 transition-all duration-200",
        onClick ? "cursor-pointer hover:shadow-md hover:border-vpp-blue" : "",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${config.color} uppercase`}>
          {label || config.label}
        </span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value.toFixed(1)} {unit}
      </div>
      {trend !== 'neutral' && (
        <div className={`text-xs ${trendColor} mt-1`}>
          {trend === 'up' ? '▲' : '▼'} {Math.abs(value).toFixed(1)}
        </div>
      )}
    </div>
  );
}
