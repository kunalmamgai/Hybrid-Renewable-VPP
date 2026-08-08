/**
 * DecisionCard — displays a single AI decision in plain language for technicians.
 * Glass-morphism style matching the landing page aesthetic.
 */
import { memo } from 'react';
import { CheckCircle, AlertTriangle, Battery, Leaf, IndianRupee, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Decision } from '../../types';

export const DecisionCard = memo(function DecisionCard({ decision }: { decision: Decision }) {
  const getIcon = () => {
    switch (decision.decision_type) {
      case 'reliability':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'battery':
        return <Battery className="text-amber-600" size={20} />;
      case 'dispatch':
        return <BarChart3 className="text-amber-700" size={20} />;
      case 'vnm':
        return <TrendingUp className="text-amber-700" size={20} />;
      case 'load_shift':
        return <CheckCircle className="text-amber-700" size={20} />;
      default:
        return <CheckCircle className="text-amber-700" size={20} />;
    }
  };

  const getTypeLabel = () => {
    switch (decision.decision_type) {
      case 'reliability': return 'RELIABILITY GUARD';
      case 'battery': return 'BATTERY';
      case 'dispatch': return 'DISPATCH';
      case 'vnm': return 'VNM/GNM';
      case 'load_shift': return 'LOAD ADVISOR';
      default: return 'SYSTEM';
    }
  };

  const borderClass =
    decision.decision_type === 'reliability' ? 'border-red-500' :
    decision.confidence_pct > 80 ? 'border-amber-600' :
    decision.confidence_pct > 60 ? 'border-amber-700' : 'border-amber-950/20';

  return (
    <div
      className={cn(
        "vpp-card p-4 border-l-4 transition-all duration-200 hover:shadow-glass-lg",
        borderClass,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <span className="text-[10px] font-bold text-amber-950/50 uppercase tracking-wider">
              {getTypeLabel()}
            </span>
            <div className="text-xs text-amber-950/45 mt-0.5">
              {decision.timestamp && new Date(decision.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true
              })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-950 font-display">
            {decision.confidence_pct.toFixed(0)}%
          </div>
          <span className="text-[10px] text-amber-950/45 uppercase tracking-wider">CONFIDENCE</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm text-amber-950 font-semibold leading-relaxed">{decision.action}</p>

        {decision.reason && (
          <p className="text-xs text-amber-950/60 leading-relaxed">{decision.reason}</p>
        )}

        {decision.building_id && (
          <span className={cn(
            "inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide",
            decision.context?.criticality === 'critical'
              ? "bg-vpp-blue/15 text-vpp-blue"
              : "bg-amber-950/8 text-amber-950/60",
          )}>
            {decision.building_id.replace('_', ' ').toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-amber-950/10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-700">
            <IndianRupee size={14} />
            <span className="text-sm font-bold font-display">{decision.expected_savings_inr.toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-amber-950/50">Savings (INR)</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-700">
            <Leaf size={14} />
            <span className="text-sm font-bold font-display">{decision.expected_carbon_reduction_kg.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-amber-950/50">Carbon (kg)</span>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-amber-950 font-display">
            {decision.battery_soc_after_pct.toFixed(0)}%
          </div>
          <span className="text-[10px] text-amber-950/50">SoC After</span>
        </div>
      </div>

      {decision.alternative_considered && (
        <div className="mt-3 pt-2 border-t border-amber-950/10">
          <span className="text-[10px] text-amber-950/50 font-medium">Alternative:</span>
          <p className="text-xs text-amber-950/60 mt-1 leading-relaxed">{decision.alternative_considered}</p>
        </div>
      )}
    </div>
  );
});
