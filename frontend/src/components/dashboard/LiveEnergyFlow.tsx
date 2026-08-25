/**
 * Live Energy Flow — animated flow diagram showing real-time energy routing.
 * solar + wind → battery → buildings → grid/export
 * Uses React Flow for the node-based visualization.
 * Glass-morphism style matching the landing page aesthetic.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Handle,
  Node,
  Edge,
  NodeTypes,
  ConnectionLineType,
  Position,
} from 'reactflow';
import {
  Sun,
  Wind,
  Battery,
  Zap,
  Home,
  Activity,
  Building2,
  CloudSun,
  Maximize2,
  Network,
} from 'lucide-react';
import 'reactflow/dist/style.css';
import { useVppData } from '../../context/VppDataContext';
import { CAMPUS_OPTIONS } from '../../data/campusCatalog';
import { DEMO_BUILDINGS } from '../../data/demoBuildings';
import FlowErrorBoundary from './FlowErrorBoundary';
import type { BuildingTwin } from '../../types';

// Custom node component for energy sources — glass style
const EnergySourceNode = React.memo(function EnergySourceNode({ data }: { data: any }) {
  const { icon: Icon, label, value } = data;
  return (
    <div className="relative glass-card-strong rounded-2xl p-3 min-w-[90px] text-center border-vpp-accent-gold/20">
      <Handle type="target" position={Position.Left} className="!bg-vpp-accent-gold !border-0" />
      <div className="flex justify-center mb-1">{Icon && <Icon size={20} />}</div>
      <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-vpp-cream font-display mt-0.5">{Number(value ?? 0).toFixed(1)}</div>
      <div className="text-[10px] text-white/45">kW</div>
      <Handle type="source" position={Position.Right} className="!bg-vpp-accent-gold !border-0" />
    </div>
  );
});

// Custom node for buildings — glass style
const BuildingNode = React.memo(function BuildingNode({ data }: { data: any }) {
  const { label, value, tier, soc } = data;
  return (
    <div
      className={`relative glass-card-strong rounded-2xl p-3 text-center min-w-[100px] ${
        tier === 'critical'
          ? 'border-vpp-blue/40'
          : 'border-white/40'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-vpp-blue !border-0" />
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
      <Handle type="source" position={Position.Right} className="!bg-vpp-emerald !border-0" />
    </div>
  );
});

// Custom node for battery — glass style
const BatteryNode = React.memo(function BatteryNode({ data }: { data: any }) {
  const { soc, power } = data;
  const powerKw = Number(power ?? 0);
  return (
    <div className="relative glass-card-strong rounded-2xl p-3 border-vpp-blue/30 text-center min-w-[90px]">
      <Handle type="target" position={Position.Left} className="!bg-vpp-blue !border-0" />
      <Battery size={24} className="mx-auto mb-1 text-vpp-blue" />
      <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">BATTERY</div>
      <div className="text-lg font-bold text-vpp-cream font-display mt-0.5">{Number(soc ?? 0).toFixed(0)}%</div>
      <div className="text-[10px] text-white/45 mt-0.5">
        {powerKw > 0 ? `↓${powerKw.toFixed(1)}` : powerKw < 0 ? `↑${Math.abs(powerKw).toFixed(1)}` : 'IDLE'} kW
      </div>
      <div className="text-[9px] text-white/30">SOC / 5min</div>
      <Handle type="source" position={Position.Right} className="!bg-vpp-blue !border-0" />
    </div>
  );
});

const nodeTypes: NodeTypes = {
  energySource: EnergySourceNode,
  building: BuildingNode,
  battery: BatteryNode,
};

type FlowView = 'simulator' | 'network';

interface SimulatorTelemetry {
  campus: string;
  demandMw: number;
  solarMw: number;
  windMw: number;
  gridMw: number;
  renewableShare: number;
  batterySoc: number;
  occupancy: number;
  gridOffline: boolean;
  weather: string;
  temperature: number;
  source: string;
  updatedAt: string;
}

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
    position: { x: 940, y: 260 },
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
    position: { x: 500 + (i % 2) * 190, y: 80 + Math.floor(i / 2) * 180 },
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
  const [view, setView] = useState<FlowView>('simulator');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [simulatorReady, setSimulatorReady] = useState(false);
  const [telemetry, setTelemetry] = useState<SimulatorTelemetry | null>(null);
  const simulatorRef = useRef<HTMLIFrameElement>(null);
  const simulatorFrameRef = useRef<HTMLDivElement>(null);
  const activeBuildings = buildings.length > 0 ? buildings : DEMO_BUILDINGS;
  const demoMode = (import.meta.env.PROD && !import.meta.env.VITE_WS_URL) || buildings.length === 0;
  const selectedCampusInfo = CAMPUS_OPTIONS.find((campus) => campus.id === selectedCampus);
  // The twin is bundled into public/simulator (built via `npm run build:twin`)
  // so it is served identically by the dev server and production.
  const simulatorBaseUrl = `${import.meta.env.BASE_URL}simulator/index.html`;
  const simulatorUrl = `${simulatorBaseUrl}?embed=1${selectedCampus === 'all' ? '' : `#${selectedCampus}`}`;

  useEffect(() => {
    const receiveTelemetry = (event: MessageEvent) => {
      if (event.source !== simulatorRef.current?.contentWindow) return;
      if (!event.data) return;
      if (event.data.type === 'surya:campus-selection') {
        const campusId = event.data.payload?.campusId;
        if (campusId === 'all' || CAMPUS_OPTIONS.some((campus) => campus.id === campusId)) {
          setTelemetry(null);
          setSimulatorReady(false);
          setSelectedCampus(campusId);
        }
        return;
      }
      if (event.data.type !== 'surya:campus-telemetry') return;
      const payload = event.data.payload as SimulatorTelemetry;
      if (!payload || typeof payload.demandMw !== 'number') return;
      setTelemetry(payload);
      setSimulatorReady(true);
      const reportedCampus = CAMPUS_OPTIONS.find((campus) => campus.shortName === payload.campus);
      if (reportedCampus) {
        setSelectedCampus((current) => current === 'all' ? reportedCampus.id : current);
      }
    };

    window.addEventListener('message', receiveTelemetry);
    return () => window.removeEventListener('message', receiveTelemetry);
  }, []);

  // Compute the entire graph in a single pass so a live refresh results in
  // one state reconciliation instead of three sequential effects.
  const { nodes, edges } = useMemo(() => {
    const totalSolar = activeBuildings.reduce((sum, b) => sum + b.solar_generation_kwh * 12, 0);
    const totalWind = activeBuildings.reduce((sum, b) => sum + b.wind_generation_kwh * 12, 0);
    const avgSoC = activeBuildings.reduce((sum, b) => sum + b.battery_soc_pct, 0) / activeBuildings.length;
    const gridPower =
      activeBuildings.reduce((sum, b) => sum + b.grid_import_kwh * 12, 0) -
      activeBuildings.reduce((sum, b) => sum + b.grid_export_kwh * 12, 0);

    const nodes: Node[] = [
      { ...STATIC_NODES[0], data: { ...STATIC_NODES[0].data, value: totalSolar } },
      { ...STATIC_NODES[1], data: { ...STATIC_NODES[1].data, value: totalWind } },
      { ...STATIC_NODES[2], data: { soc: avgSoC, power: gridPower } },
      ...generateBuildingNodes(activeBuildings),
      { ...STATIC_NODES[3], data: { ...STATIC_NODES[3].data, value: gridPower } },
    ];

    const solarEdge: Edge = {
      ...STATIC_EDGES[0],
      style: { ...STATIC_EDGES[0].style, strokeWidth: Math.max(2, Math.min(8, totalSolar / 10)) },
    };
    const windEdge: Edge = {
      ...STATIC_EDGES[1],
      style: { ...STATIC_EDGES[1].style, strokeWidth: Math.max(2, Math.min(8, totalWind / 10)) },
    };
    const buildingEdges = generateBuildingEdges(activeBuildings).map((edge) => {
      const { source, target } = edge;
      const building = activeBuildings.find((b) => b.building_id === source) ??
        activeBuildings.find((b) => b.building_id === target);
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
  }, [activeBuildings]);

  const metrics = telemetry
    ? [
        {
          label: 'Campus demand', value: `${telemetry.demandMw.toFixed(2)} MW`,
          detail: `${telemetry.occupancy}% occupancy`, icon: Building2, tone: 'text-vpp-cream',
        },
        {
          label: 'Renewable supply', value: `${(telemetry.solarMw + telemetry.windMw).toFixed(2)} MW`,
          detail: `${telemetry.renewableShare.toFixed(0)}% renewable share`, icon: Sun, tone: 'text-vpp-amber',
        },
        {
          label: 'Battery state', value: `${telemetry.batterySoc.toFixed(0)}%`,
          detail: telemetry.gridOffline ? 'Protecting critical loads' : 'Smart balance active', icon: Battery, tone: 'text-vpp-blue',
        },
        {
          label: 'Campus weather', value: `${telemetry.temperature.toFixed(0)}°C`,
          detail: telemetry.weather, icon: CloudSun, tone: 'text-vpp-teal',
        },
      ]
    : selectedCampus === 'all'
      ? [
          { label: 'Digital-twin portfolio', value: `${CAMPUS_OPTIONS.length} campuses`, detail: 'One integrated simulator', icon: Building2, tone: 'text-vpp-cream' },
          { label: 'Technical campuses', value: '5 sites', detail: 'NIT, IIT and state technical', icon: Zap, tone: 'text-vpp-amber' },
          { label: 'Medical campuses', value: '3 sites', detail: 'Clinical and hospital loads', icon: Activity, tone: 'text-vpp-blue' },
          { label: 'Regional coverage', value: '4 cities', detail: 'Jaipur • Jodhpur • Kota • Udaipur', icon: CloudSun, tone: 'text-vpp-teal' },
        ]
      : [
          { label: 'Selected campus', value: selectedCampusInfo?.shortName || 'Campus twin', detail: selectedCampusInfo?.city || 'Loading location', icon: Building2, tone: 'text-vpp-cream' },
          { label: 'Renewable supply', value: 'Connecting…', detail: 'Live solar + wind', icon: Sun, tone: 'text-vpp-amber' },
          { label: 'Battery state', value: 'Connecting…', detail: 'Smart balance model', icon: Battery, tone: 'text-vpp-blue' },
          { label: 'Campus weather', value: 'Live feed', detail: 'Loading local conditions', icon: CloudSun, tone: 'text-vpp-teal' },
        ];

  const changeCampus = (campusId: string) => {
    setSelectedCampus(campusId);
    setTelemetry(null);
    setSimulatorReady(false);
  };

  const openFullscreen = () => {
    simulatorFrameRef.current?.requestFullscreen?.();
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200 bg-emerald-400/10 border border-emerald-300/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Live campus operations
              </span>
              <span className="text-[11px] text-white/35">
                {selectedCampusInfo ? `${selectedCampusInfo.shortName} • Digital Twin` : `${CAMPUS_OPTIONS.length}-campus portfolio`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">Live Energy Flow</h2>
            <p className="text-sm text-white/50 mt-1.5 max-w-2xl">
              Explore the campus in 3D, inspect every energy asset, and switch to the network view for real-time dispatch routing.
            </p>
          </div>

          <div className="inline-flex self-start xl:self-auto p-1 rounded-2xl bg-black/25 border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setView('simulator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                view === 'simulator'
                  ? 'bg-vpp-accent-gold text-white shadow-lg shadow-vpp-accent-gold/20'
                  : 'text-white/55 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 size={15} /> 3D Campus Twin
            </button>
            <button
              type="button"
              onClick={() => setView('network')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                view === 'network'
                  ? 'bg-vpp-accent-gold text-white shadow-lg shadow-vpp-accent-gold/20'
                  : 'text-white/55 hover:text-white hover:bg-white/5'
              }`}
            >
              <Network size={15} /> Network Flow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-4">
          {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
            <div key={label} className="live-flow-metric">
              <span className={`live-flow-metric-icon ${tone}`}><Icon size={17} /></span>
              <div className="min-w-0">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{detail}</small>
              </div>
            </div>
          ))}
        </div>

        <section className="live-flow-workspace">
          <div className="live-flow-toolbar">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-2 h-2 rounded-full ${simulatorReady ? 'bg-emerald-300' : 'bg-vpp-amber animate-pulse'}`} />
              <div className="min-w-0">
                <strong>{view === 'simulator' ? 'Interactive campus simulator' : 'VPP dispatch network'}</strong>
                <span>
                  {view === 'simulator'
                    ? simulatorReady
                      ? selectedCampus === 'all'
                        ? 'Portfolio ready • choose any campus to enter its digital twin'
                        : telemetry
                          ? `Telemetry connected${telemetry.source ? ` • ${telemetry.source}` : ''}`
                          : `${selectedCampusInfo?.shortName || 'Campus'} simulator ready`
                      : 'Starting the digital twin…'
                    : demoMode
                      ? 'Demonstration data • backend reconnects automatically'
                      : 'Live backend telemetry'}
                </span>
              </div>
            </div>
            {view === 'simulator' && (
              <div className="live-flow-toolbar-actions">
                <label className="campus-picker">
                  <span>Campus</span>
                  <select
                    aria-label="Select campus simulator"
                    value={selectedCampus}
                    onChange={(event) => changeCampus(event.target.value)}
                  >
                    <option value="all">All campuses</option>
                    {CAMPUS_OPTIONS.map((campus) => (
                      <option key={campus.id} value={campus.id}>{campus.shortName}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="live-flow-expand" onClick={openFullscreen}>
                  <Maximize2 size={15} /> <span>Full screen</span>
                </button>
              </div>
            )}
          </div>

          {view === 'simulator' ? (
            <div ref={simulatorFrameRef} className="simulator-frame-shell">
              {!simulatorReady && (
                <div className="simulator-loading" role="status">
                  <Activity size={22} className="animate-pulse text-vpp-accent-gold" />
                  <strong>
                    {selectedCampusInfo ? `Loading ${selectedCampusInfo.shortName} digital twin` : 'Loading the campus portfolio'}
                  </strong>
                  <span>Preparing buildings, live weather, vehicles and energy assets…</span>
                </div>
              )}
              <iframe
                key={selectedCampus}
                ref={simulatorRef}
                src={simulatorUrl}
                title={`${selectedCampusInfo?.shortName || 'All campuses'} interactive energy simulator`}
                className="simulator-frame"
                allow="fullscreen; autoplay"
                onLoad={() => setSimulatorReady(true)}
              />
            </div>
          ) : (
            <div className="network-flow-canvas">
              <FlowErrorBoundary>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
                  connectionLineType={ConnectionLineType.SmoothStep}
                  fitView
                  fitViewOptions={{ padding: 0.16 }}
                  minZoom={0.35}
                  attributionPosition="bottom-left"
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={18} color="rgba(255,255,255,0.055)" />
                  <Controls className="glass-card !rounded-xl !border-0" showInteractive={false} />
                </ReactFlow>
              </FlowErrorBoundary>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
