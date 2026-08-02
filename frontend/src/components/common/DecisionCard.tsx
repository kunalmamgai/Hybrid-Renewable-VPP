/**
 * DecisionCard — displays a single AI decision in plain language for technicians.
 * Glass-morphism style matching the landing page aesthetic.
 */
import { CheckCircle, AlertTriangle, Battery, Leaf, IndianRupee, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Decision } from '../../types';

export function DecisionCard({ decision }: { decision: Decision }) {
  const getIcon = () => {
    switch (decision.decision_type) {
      case 'reliability':
        return <AlertTriangle className="text-vpp-red" size={20} />;
      case 'battery':
        return <Battery className="text-vpp-blue" size={20} />;
      case 'dispatch':
        return <BarChart3 className="text-vpp-amber" size={20} />;
      case 'vnm':
        return <TrendingUp className="text-vpp-teal" size={20} />;
      case 'load_shift':
        return <CheckCircle className="text-vpp-emerald" size={20} />;
      default:
        return <CheckCircle className="text-vpp-emerald" size={20} />;
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
    decision.decision_type === 'reliability' ? 'border-vpp-red' :
    decision.confidence_pct > 80 ? 'border-vpp-emerald' :
    decision.confidence_pct > 60 ? 'border-vpp-amber' : 'border-white/30';

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-4 border-l-4 transition-all duration-200 hover:shadow-glass-lg",
        borderClass,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <span className="text-[10px] font-bold text-vpp-navy-muted uppercase tracking-wider">
              {getTypeLabel()}
            </span>
            <div className="text-xs text-vpp-navy-muted mt-0.5">
              {decision.timestamp && new Date(decision.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true
              })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-vpp-navy">
            {decision.confidence_pct.toFixed(0)}%
          </div>
          <span className="text-[10px] text-vpp-navy-muted uppercase tracking-wider">CONFIDENCE</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm text-vpp-navy font-semibold leading-relaxed">{decision.action}</p>

        {decision.reason && (
          <p className="text-xs text-vpp-navy-muted leading-relaxed">{decision.reason}</p>
        )}

        {decision.building_id && (
          <span className={cn(
            "inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide",
            decision.context?.criticality === 'critical'
              ? "bg-vpp-blue/15 text-vpp-blue"
              : "bg-vpp-navy-muted/10 text-vpp-navy-muted",
          )}>
            {decision.building_id.replace('_', ' ').toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-vpp-emerald">
            <IndianRupee size={14} />
            <span className="text-sm font-bold">{decision.expected_savings_inr.toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-vpp-navy-muted">Savings (INR)</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-vpp-teal">
            <Leaf size={14} />
            <span className="text-sm font-bold">{decision.expected_carbon_reduction_kg.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-vpp-navy-muted">Carbon (kg)</span>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-vpp-navy">
            {decision.battery_soc_after_pct.toFixed(0)}%
          </div>
          <span className="text-[10px] text-vpp-navy-muted">SoC After</span>
        </div>
      </div>

      {decision.alternative_considered && (
        <div className="mt-3 pt-2 border-t border-white/20">
          <span className="text-[10px] text-vpp-navy-muted font-medium">Alternative:</span>
          <p className="text-xs text-vpp-navy-muted mt-1 leading-relaxed">{decision.alternative_considered}</p>
        </div>
      )}
    </div>
  );
}
