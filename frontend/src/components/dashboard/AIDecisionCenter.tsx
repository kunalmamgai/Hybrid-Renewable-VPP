/**
 * AI Decision Center — history of all AI decisions with filtering and search.
 * Glass-morphism style matching the landing page aesthetic.
 */
import { useState, useMemo } from 'react';
import { DecisionCard } from '../common/DecisionCard';
import { Search, BarChart3, CheckCircle, AlertTriangle, Battery, TrendingUp } from 'lucide-react';
import { useDecisions } from '../../hooks/useDecisions';
import type { Decision } from '../../types';

const typeIcons = {
  dispatch: BarChart3,
  battery: Battery,
  reliability: AlertTriangle,
  load_shift: CheckCircle,
  vnm: TrendingUp,
};

export function AIDecisionCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const { decisions, loading, error, refetch } = useDecisions(100);

  const filtered = useMemo(() => {
    if (!decisions) return [];
    return decisions.filter((d: Decision) => {
      const matchesSearch = d.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.building_id && d.building_id.includes(searchTerm));
      const matchesType = typeFilter === 'all' || d.decision_type === typeFilter;
      const matchesConfidence = confidenceFilter === 'all' ||
        (confidenceFilter === 'high' && d.confidence_pct >= 80) ||
        (confidenceFilter === 'medium' && d.confidence_pct >= 60 && d.confidence_pct < 80) ||
        (confidenceFilter === 'low' && d.confidence_pct < 60);
      return matchesSearch && matchesType && matchesConfidence;
    });
  }, [decisions, searchTerm, typeFilter, confidenceFilter]);

  if (loading) {
    return (
      <div className="page-bg min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4 drop-shadow-md">AI Decision Center</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vpp-emerald"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-bg min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4 drop-shadow-md">AI Decision Center</h1>
          <div className="glass-card-dark border-red-400/30 rounded-2xl p-4">
            <p className="text-red-300">Error loading decisions: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white drop-shadow-md">AI Decision Center</h1>
          <button
            onClick={refetch}
            className="px-4 py-2 text-sm font-semibold bg-vpp-emerald text-white rounded-xl hover:bg-vpp-emerald-light transition-all duration-200 shadow-emerald-glow"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search decisions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="glass-input px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="dispatch">Dispatch</option>
            <option value="battery">Battery</option>
            <option value="reliability">Reliability</option>
            <option value="load_shift">Load Shift</option>
            <option value="vnm">VNM/GNM</option>
          </select>

          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value as any)}
            className="glass-input px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="all">All Confidence</option>
            <option value="high">High (80%+)</option>
            <option value="medium">Medium (60-79%)</option>
            <option value="low">Low (&lt;60%)</option>
          </select>
        </div>

        {/* Filters Summary */}
        <div className="flex items-center gap-2 mb-4 text-xs text-white/50">
          <span>{filtered.length} decisions found</span>
          {searchTerm && <span>• Search: "{searchTerm}"</span>}
          {typeFilter !== 'all' && <span>• Type: {typeFilter}</span>}
          {confidenceFilter !== 'all' && <span>• Confidence: {confidenceFilter}</span>}
        </div>

        {/* Decision List */}
        {filtered.length === 0 ? (
          <div className="vpp-card p-8 text-center">
            <BarChart3 className="mx-auto text-white/20" size={48} />
            <p className="text-white/50 mt-2 font-medium">No decisions match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d: Decision) => (
              <DecisionCard key={d.decision_id} decision={d} />
            ))}
          </div>
        )}

        {/* Decision Type Legend */}
        <div className="mt-6 vpp-card p-4">
          <h3 className="font-bold text-vpp-cream mb-3 text-sm font-display">Decision Types</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(typeIcons).map(([type, Icon]) => (
              <div key={type} className="flex items-center gap-2">
                <Icon size={16} className="text-white/50" />
                <span className="text-sm text-white/60 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
