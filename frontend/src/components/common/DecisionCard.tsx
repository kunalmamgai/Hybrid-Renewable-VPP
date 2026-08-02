/**
 * DecisionCard — displays a single AI decision in plain language for technicians.
 * Shows: action, confidence %, reason, alternative considered, savings, carbon.
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
        return <CheckCircle className="text-vpp-green" size={20} />;
      default:
        return <CheckCircle className="text-vpp-green" size={20} />;
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

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-4 shadow border-l-4 transition-all duration-200",
        decision.decision_type === 'reliability' ? 'border-vpp-red' :
        decision.confidence_pct > 80 ? 'border-vpp-green' :
        decision.confidence_pct > 60 ? 'border-vpp-amber' : 'border-gray-400',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {getTypeLabel()}
            </span>
            <div className="text-sm text-gray-500 mt-1">
              {decision.timestamp && new Date(decision.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true
              })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {decision.confidence_pct.toFixed(0)}%
          </div>
          <span className="text-xs text-gray-500">CONFIDENCE</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm text-gray-800 font-medium">{decision.action}</p>

        {decision.reason && (
          <p className="text-xs text-gray-600">{decision.reason}</p>
        )}

        {decision.building_id && (
          <span className={cn(
            "inline-block text-xs px-2 py-0.5 rounded-full",
            decision.context?.criticality === 'critical'
              ? "bg-vpp-blue/10 text-vpp-blue"
              : "bg-gray-100 text-gray-600",
          )}>
            {decision.building_id.replace('_', ' ').toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-grid-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-vpp-green">
            <IndianRupee size={14} />
            <span className="text-sm font-semibold">{decision.expected_savings_inr.toFixed(1)}</span>
          </div>
          <span className="text-xs text-gray-500">Savings (INR)</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-vpp-teal">
            <Leaf size={14} />
            <span className="text-sm font-semibold">{decision.expected_carbon_reduction_kg.toFixed(2)}</span>
          </div>
          <span className="text-xs text-gray-500">Carbon (kg)</span>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-700">
            {decision.battery_soc_after_pct.toFixed(0)}%
          </div>
          <span className="text-xs text-gray-500">SoC After</span>
        </div>
      </div>

      {decision.alternative_considered && (
        <div className="mt-3 pt-2 border-t border-grid-200">
          <span className="text-xs text-gray-500">Alternative:</span>
          <p className="text-xs text-gray-600 mt-1">{decision.alternative_considered}</p>
        </div>
      )}
    </div>
  );
}
