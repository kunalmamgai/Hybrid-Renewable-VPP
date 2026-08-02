/**
 * Live Energy Flow — animated flow diagram showing real-time energy routing.
 * solar + wind → battery → buildings → grid/export
 * Uses React Flow for the node-based visualization.
 */
import React, { useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  NodeTypes,
  ConnectionLineType,
} from 'reactflow';
import { Sun, Wind, Battery, Zap, Home, Warehouse } from 'lucide-react';
import 'reactflow/dist/style.css';
import { useVppWebSocket } from '../../hooks/useVppWebSocket';
import type { BuildingTwin } from '../../types';

// Custom node component for energy sources
function EnergySourceNode({ data }: { data: any }) {
  const { icon: Icon, label, value, color } = data;
  return (
    <div className={`bg-white rounded-xl p-3 shadow-lg border-2 ${color} min-w-[80px] text-center`}>
      <div className="flex justify-center mb-1">{Icon && <Icon size={20} />}</div>
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value.toFixed(1)}</div>
      <div className="text-xs text-gray-500">kW</div>
    </div>
  );
}

// Custom node for buildings
function BuildingNode({ data }: { data: any }) {
  const { label, value, tier, soc } = data;
  return (
    <div
      className={`rounded-xl p-3 shadow-lg border-2 text-center min-w-[90px] ${
        tier === 'critical'
          ? 'border-vpp-blue bg-vpp-blue/5'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <Home size={20} className="mx-auto mb-1" />
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value.toFixed(1)} kW</div>
      <div className={`text-xs mt-1 px-1 py-0.5 rounded-full ${
        tier === 'critical' ? 'bg-vpp-blue/10 text-vpp-blue' : 'bg-gray-100 text-gray-600'
      }`}>
        {tier === 'critical' ? 'CRITICAL' : 'NON-CRIT'}
      </div>
      {soc !== undefined && (
        <div className="text-xs text-vpp-blue mt-1">{soc.toFixed(0)}% SoC</div>
      )}
    </div>
  );
}

// Custom node for battery
function BatteryNode({ data }: { data: any }) {
  const { soc, power } = data;
  return (
    <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-vpp-blue text-center min-w-[80px]">
      <Battery size={24} className="mx-auto mb-1 text-vpp-blue" />
      <div className="text-xs font-semibold text-gray-700">BATTERY</div>
      <div className="text-lg font-bold text-gray-900">{soc.toFixed(0)}%</div>
      <div className="text-xs text-gray-500">{power > 0 ? `↓${power.toFixed(1)}` : power < 0 ? `↑${Math.abs(power).toFixed(1)}` : 'IDLE'} kW</div>
      <div className="text-xs text-gray-500">SOC / 5min</div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  energySource: EnergySourceNode,
  building: BuildingNode,
  battery: BatteryNode,
};

const generateNodes = (buildings: BuildingTwin[]): Node[] => {
  const nodes: Node[] = [
    // Solar node
    {
      id: 'solar',
      type: 'energySource',
      position: { x: 100, y: 200 },
      data: { icon: Sun, label: 'SOLAR', value: 0, color: 'border-amber-400' },
    },
    // Wind node
    {
      id: 'wind',
      type: 'energySource',
      position: { x: 100, y: 320 },
      data: { icon: Wind, label: 'WIND', value: 0, color: 'border-teal-400' },
    },
    // Battery node
    {
      id: 'battery',
      type: 'battery',
      position: { x: 300, y: 260 },
      data: { soc: 50, power: 0 },
    },
    // Grid node
    {
      id: 'grid',
      type: 'energySource',
      position: { x: 700, y: 260 },
      data: { icon: Zap, label: 'GRID', value: 0, color: 'border-amber-500' },
    },
  ];

  // Building nodes in a row
  buildings.forEach((b, i) => {
    nodes.push({
      id: b.building_id,
      type: 'building',
      position: { x: 500 + i * 200, y: 100 + (i % 2) * 200 },
      data: {
        label: b.name || b.building_id.replace('_', ' '),
        value: 0,
        tier: b.criticality_tier,
        soc: b.battery_soc_pct,
      },
    });
  });

  return nodes;
};

const generateEdges = (buildings: BuildingTwin[]): Edge[] => {
  const edges: Edge[] = [
    { id: 'solar-battery', source: 'solar', target: 'battery', animated: true, style: { stroke: '#f59e0b', strokeWidth: 3 } },
    { id: 'wind-battery', source: 'wind', target: 'battery', animated: true, style: { stroke: '#0d9488', strokeWidth: 3 } },
  ];

  buildings.forEach((b) => {
    edges.push(
      { id: `solar-${b.building_id}`, source: 'solar', target: b.building_id, animated: true, style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' } },
      { id: `wind-${b.building_id}`, source: 'wind', target: b.building_id, animated: true, style: { stroke: '#0d9488', strokeWidth: 2, strokeDasharray: '5,5' } },
      { id: `battery-${b.building_id}`, source: 'battery', target: b.building_id, animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: `building-${b.building_id}-grid`, source: b.building_id, target: 'grid', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, label: 'export', labelStyle: { fill: '#10b981', fontSize: 10 } },
    );
  });

  return edges;
};

export function LiveEnergyFlow() {
  const { buildings } = useVppWebSocket();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Initialize nodes and edges
  useEffect(() => {
    if (buildings.length > 0) {
      setNodes(generateNodes(buildings));
      setEdges(generateEdges(buildings));
    }
  }, [buildings]);

  // Update node data with live values
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === 'solar') {
          const totalSolar = buildings.reduce((sum, b) => sum + b.solar_generation_kwh * 12, 0);
          return { ...node, data: { ...node.data, value: totalSolar } };
        }
        if (node.id === 'wind') {
          const totalWind = buildings.reduce((sum, b) => sum + b.wind_generation_kwh * 12, 0);
          return { ...node, data: { ...node.data, value: totalWind } };
        }
        if (node.id === 'battery') {
          const avgSoC = buildings.reduce((sum, b) => sum + b.battery_soc_pct, 0) / (buildings.length || 1);
          const totalPower = buildings.reduce((sum, b) => sum + b.grid_import_kwh * 12, 0) -
                            buildings.reduce((sum, b) => sum + b.grid_export_kwh * 12, 0);
          return { ...node, data: { soc: avgSoC, power: totalPower } };
        }
        // Building node
        const building = buildings.find((b) => b.building_id === node.id);
        if (building) {
          const demand = building.consumption_kwh * 12;
          return {
            ...node,
            data: {
              ...node.data,
              label: building.name || building.building_id.replace('_', ' '),
              value: demand,
              tier: building.criticality_tier,
              soc: building.battery_soc_pct,
            },
          };
        }
        return node;
      }),
    );
  }, [buildings]);

  // Update edge styles dynamically based on energy flow
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const sourceId = edge.source;
        const targetId = edge.target;

        // Solar/Wind → Battery: thickness based on total generation
        if (sourceId === 'solar' && targetId === 'battery') {
          const totalSolar = buildings.reduce((sum, b) => sum + b.solar_generation_kwh * 12, 0);
          return { ...edge, style: { ...edge.style, strokeWidth: Math.max(2, Math.min(8, totalSolar / 10)) } };
        }
        if (sourceId === 'wind' && targetId === 'battery') {
          const totalWind = buildings.reduce((sum, b) => sum + b.wind_generation_kwh * 12, 0);
          return { ...edge, style: { ...edge.style, strokeWidth: Math.max(2, Math.min(8, totalWind / 10)) } };
        }

        // Battery → Building: thickness based on battery SoC
        if (sourceId === 'battery' && buildings.some((b) => b.building_id === targetId)) {
          const building = buildings.find((b) => b.building_id === targetId);
          if (building) {
            const soc = building.battery_soc_pct;
            return { ...edge, style: { ...edge.style, strokeWidth: Math.max(1, (soc / 100) * 4) } };
          }
        }

        // Building → Grid: thickness based on grid export
        if (targetId === 'grid' && buildings.some((b) => b.building_id === sourceId)) {
          const building = buildings.find((b) => b.building_id === sourceId);
          if (building) {
            const exportPower = building.grid_export_kwh * 12;
            return { ...edge, style: { ...edge.style, strokeWidth: Math.max(1, Math.min(6, exportPower / 5)) } };
          }
        }

        return edge;
      }),
    );
  }, [buildings]);

  return (
    <div className="h-screen bg-grid-100">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Energy Flow</h1>
        <p className="text-sm text-gray-600 mb-4">
          Real-time energy routing: Solar + Wind → Battery → Buildings → Grid/Export
        </p>
      </div>

      <div className="h-[calc(100vh-120px)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          attributionPosition="bottom-left"
        >
          <Background gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
