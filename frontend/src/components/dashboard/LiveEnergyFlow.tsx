/**
 * Live Energy Flow — animated flow diagram showing real-time energy routing.
 * solar + wind → battery → buildings → grid/export
 * Uses React Flow for the node-based visualization.
 * Glass-morphism style matching the landing page aesthetic.
 */
import React, { useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  NodeTypes,
  ConnectionLineType,
} from 'reactflow';
import { Sun, Wind, Battery, Zap, Home } from 'lucide-react';
import 'reactflow/dist/style.css';
import { useVppData } from '../../context/VppDataContext';
import FlowErrorBoundary from './FlowErrorBoundary';
import type { BuildingTwin } from '../../types';

// Custom node component for energy sources — glass style
const EnergySourceNode = React.memo(function EnergySourceNode({ data }: { data: any }) {
  const { icon: Icon, label, value } = data;
  return (
    <div className={`glass-card-strong rounded-2xl p-3 min-w-[90px] text-center border-vpp-accent-gold/20`}>
      <div className="flex justify-center mb-1">{Icon && <Icon size={20} />}</div>
      <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-vpp-cream font-display mt-0.5">{Number(value ?? 0).toFixed(1)}</div>
      <div className="text-[10px] text-white/45">kW</div>
    </div>
  );
});

// Custom node for buildings — glass style
const BuildingNode = React.memo(function BuildingNode({ data }: { data: any }) {
  const { label, value, tier, soc } = data;
  return (
    <div
      className={`glass-card-strong rounded-2xl p-3 text-center min-w-[100px] ${
        tier === 'critical'
          ? 'border-vpp-blue/40'
          : 'border-white/40'
      }`}
    >
      <Home size={20} className="mx-auto mb-1 text-vpp-amber" />
      <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-vpp-cream font-display mt-0.5">{Number(value ?? 0).toFixed(1)} kW</div>
      <div className={`text-[9px] font-bold mt-1.5 px-2 py-0.5 rounded-full inline-block tracking-wider ${
        tier === 'critical' ? 'bg-vpp-blue/15 text-vpp-blue' : 'bg-white/10 text-white/60'
      }`}>
        {tier === 'critical' ? 'CRITICAL' : 'NON-CRIT'}
      </div>
      {soc !== undefined && (
        <div className="text-[10px] text-vpp-blue mt-1.5 font-semibold">{Number(soc ?? 0).toFixed(0)}% SoC</div>
      )}
    </div>
  );
});

// Custom node for battery — glass style
const BatteryNode = React.memo(function BatteryNode({ data }: { data: any }) {
  const { soc, power } = data;
  const powerKw = Number(power ?? 0);
  return (
    <div className="glass-card-strong rounded-2xl p-3 border-vpp-blue/30 text-center min-w-[90px]">
      <Battery size={24} className="mx-auto mb-1 text-vpp-blue" />
      <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">BATTERY</div>
      <div className="text-lg font-bold text-vpp-cream font-display mt-0.5">{Number(soc ?? 0).toFixed(0)}%</div>
      <div className="text-[10px] text-white/45 mt-0.5">
        {powerKw > 0 ? `↓${powerKw.toFixed(1)}` : powerKw < 0 ? `↑${Math.abs(powerKw).toFixed(1)}` : 'IDLE'} kW
      </div>
      <div className="text-[9px] text-white/30">SOC / 5min</div>
    </div>
  );
});

const nodeTypes: NodeTypes = {
  energySource: EnergySourceNode,
  building: BuildingNode,
  battery: BatteryNode,
};

// Static skeleton of the flow graph — rendered immediately, before any
// live data arrives, so the canvas is never blank.
const STATIC_NODES: Node[] = [
  {
    id: 'solar',
    type: 'energySource',
    position: { x: 100, y: 200 },
    data: { icon: Sun, label: 'SOLAR', value: 0, color: 'border-amber-400' },
  },
  {
    id: 'wind',
    type: 'energySource',
    position: { x: 100, y: 320 },
    data: { icon: Wind, label: 'WIND', value: 0, color: 'border-teal-400' },
  },
  {
    id: 'battery',
    type: 'battery',
    position: { x: 300, y: 260 },
    data: { soc: 50, power: 0 },
  },
  {
    id: 'grid',
    type: 'energySource',
    position: { x: 700, y: 260 },
    data: { icon: Zap, label: 'GRID', value: 0, color: 'border-amber-500' },
  },
];

const STATIC_EDGES: Edge[] = [
  { id: 'solar-battery', source: 'solar', target: 'battery', animated: true, style: { stroke: '#f59e0b', strokeWidth: 3 } },
  { id: 'wind-battery', source: 'wind', target: 'battery', animated: true, style: { stroke: '#14b8a6', strokeWidth: 3 } },
];

const generateBuildingNodes = (buildings: BuildingTwin[]): Node[] =>
  buildings.map((b, i) => ({
    id: b.building_id,
    type: 'building',
    position: { x: 500 + i * 200, y: 100 + (i % 2) * 200 },
    data: {
      label: b.name || b.building_id.replace('_', ' '),
      value: b.consumption_kwh * 12,
      tier: b.criticality_tier,
      soc: b.battery_soc_pct,
    },
  }));

const generateBuildingEdges = (buildings: BuildingTwin[]): Edge[] =>
  buildings.flatMap((b) => [
    { id: `solar-${b.building_id}`, source: 'solar', target: b.building_id, animated: true, style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' } },
    { id: `wind-${b.building_id}`, source: 'wind', target: b.building_id, animated: true, style: { stroke: '#14b8a6', strokeWidth: 2, strokeDasharray: '5,5' } },
    { id: `battery-${b.building_id}`, source: 'battery', target: b.building_id, animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: `building-${b.building_id}-grid`, source: b.building_id, target: 'grid', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, label: 'export', labelStyle: { fill: '#10b981', fontSize: 10 } },
  ]);

export function LiveEnergyFlow() {
  const { buildings } = useVppData();

  // Compute the entire graph in a single pass so a live refresh results in
  // one state reconciliation instead of three sequential effects.
  const { nodes, edges } = useMemo(() => {
    const totalSolar = buildings.reduce((sum, b) => sum + b.solar_generation_kwh * 12, 0);
    const totalWind = buildings.reduce((sum, b) => sum + b.wind_generation_kwh * 12, 0);
    const avgSoC = buildings.reduce((sum, b) => sum + b.battery_soc_pct, 0) / (buildings.length || 1);
    const gridPower =
      buildings.reduce((sum, b) => sum + b.grid_import_kwh * 12, 0) -
      buildings.reduce((sum, b) => sum + b.grid_export_kwh * 12, 0);

    const nodes: Node[] = [
      { ...STATIC_NODES[0], data: { ...STATIC_NODES[0].data, value: totalSolar } },
      { ...STATIC_NODES[1], data: { ...STATIC_NODES[1].data, value: totalWind } },
      { ...STATIC_NODES[2], data: { soc: avgSoC, power: gridPower } },
      ...generateBuildingNodes(buildings),
    ];

    const solarEdge: Edge = {
      ...STATIC_EDGES[0],
      style: { ...STATIC_EDGES[0].style, strokeWidth: Math.max(2, Math.min(8, totalSolar / 10)) },
    };
    const windEdge: Edge = {
      ...STATIC_EDGES[1],
      style: { ...STATIC_EDGES[1].style, strokeWidth: Math.max(2, Math.min(8, totalWind / 10)) },
    };
    const buildingEdges = generateBuildingEdges(buildings).map((edge) => {
      const { source, target } = edge;
      const building = buildings.find((b) => b.building_id === source) ??
        buildings.find((b) => b.building_id === target);
      if (!building) return edge;
      if (source === 'battery') {
        const soc = building.battery_soc_pct;
        return { ...edge, style: { ...edge.style, strokeWidth: Math.max(1, (soc / 100) * 4) } };
      }
      if (target === 'grid') {
        const exportPower = building.grid_export_kwh * 12;
        return { ...edge, style: { ...edge.style, strokeWidth: Math.max(1, Math.min(6, exportPower / 5)) } };
      }
      return edge;
    });

    return { nodes, edges: [solarEdge, windEdge, ...buildingEdges] };
  }, [buildings]);

  return (
    <div className="page-bg h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-md">Live Energy Flow</h1>
        <p className="text-sm text-white/50 mb-4">
          Real-time energy routing: Solar + Wind → Battery → Buildings → Grid/Export
        </p>
        {buildings.length === 0 && (
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs text-vpp-amber bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-vpp-amber animate-pulse" />
            Waiting for live data…
          </div>
        )}
      </div>

      <div className="h-[calc(100vh-120px)] w-full">
        <FlowErrorBoundary>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} color="rgba(255,255,255,0.05)" />
            <Controls
              className="glass-card !rounded-xl !border-0"
              showInteractive={false}
            />
          </ReactFlow>
        </FlowErrorBoundary>
      </div>
    </div>
  );
}
