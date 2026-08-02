/**
 * AI Decision Center — history of all AI decisions with filtering and search.
 * Shows: timeline of decisions, each with confidence %, reason, alternative, savings, carbon.
 */
import { useState, useMemo, useEffect } from 'react';
import { DecisionCard } from '../common/DecisionCard';
import { Search, Filter, BarChart3, CheckCircle, AlertTriangle, Battery, TrendingUp } from 'lucide-react';
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
      <div className="min-h-screen bg-grid-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Decision Center</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vpp-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-grid-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Decision Center</h1>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            Error loading decisions: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Decision Center</h1>
          <button
            onClick={refetch}
            className="px-3 py-1.5 text-sm bg-vpp-blue text-white rounded-lg hover:bg-vpp-blue/90 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search decisions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-grid-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vpp-blue"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-grid-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-vpp-blue text-sm"
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
            className="px-3 py-2 border border-grid-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-vpp-blue text-sm"
          >
            <option value="all">All Confidence</option>
            <option value="high">High (80%+)</option>
            <option value="medium">Medium (60-79%)</option>
            <option value="low">Low (&lt;60%)</option>
          </select>
        </div>

        {/* Filters Summary */}
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
          <span>{filtered.length} decisions found</span>
          {searchTerm && <span>• Search: "{searchTerm}"</span>}
          {typeFilter !== 'all' && <span>• Type: {typeFilter}</span>}
          {confidenceFilter !== 'all' && <span>• Confidence: {confidenceFilter}</span>}
        </div>

        {/* Decision List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow">
            <BarChart3 className="mx-auto text-gray-300" size={48} />
            <p className="text-gray-500 mt-2">No decisions match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d: Decision) => (
              <DecisionCard key={d.decision_id} decision={d} />
            ))}
          </div>
        )}

        {/* Decision Type Legend */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Decision Types</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(typeIcons).map(([type, Icon]) => (
              <div key={type} className="flex items-center gap-2">
                <Icon size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
