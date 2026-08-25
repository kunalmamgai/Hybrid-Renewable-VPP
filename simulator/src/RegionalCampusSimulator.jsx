import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BatteryCharging,
  Building2,
  ChevronDown,
  CloudRain,
  Gauge,
  Info,
  Layers3,
  LocateFixed,
  Map,
  RefreshCw,
  RotateCcw,
  Sun,
  Thermometer,
  Wind,
  Wrench,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import EngineeringLab, { HazardStatusBanner } from "./EngineeringLab";
import RegionalCampusScene from "./RegionalCampusScene";
import SuryaMark from "./SuryaMark";
import {
  aggregateProposals,
  getHazardImpact,
} from "./engineeringEngine";
import {
  calculateCampusEnergy,
  createDefaultEnergyConfig,
} from "./energyIntelligence";
import useHazardSimulation from "./useHazardSimulation";
import {
  FALLBACK_WEATHER,
  SCENARIOS,
  compassDirection,
  fetchCampusWeather,
  weatherLabel,
} from "./weather";

const BASE_CAMERA_OPTIONS = [
  ["overview", "Campus"],
  ["landmark", "Landmark"],
  ["academic", "Academic"],
  ["residential", "Residential"],
  ["energy", "Energy zone"],
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const power = (value) => `${Math.abs(value).toFixed(value >= 10 ? 1 : 2)} MW`;
const FACILITY_DETAILS = {
  landmark: ["Administration and campus services", 0.08, "Critical daytime load"],
  academic: ["Teaching rooms, studios and faculty spaces", 0.09, "Occupancy-responsive load"],
  lab: ["Laboratories, workshops and research equipment", 0.13, "High equipment demand"],
  library: ["Library, study halls and digital services", 0.07, "Extended-hours load"],
  hostel: ["Student residences and common facilities", 0.1, "Evening peak demand"],
  residential: ["Residential apartments and shared services", 0.09, "Residential load"],
  amenity: ["Dining, events and student services", 0.065, "Variable event load"],
  sports: ["Sports grounds, lighting and recreation", 0.045, "Lighting-led demand"],
  hospital: ["Inpatient care, diagnostics and life-safety systems", 0.2, "24×7 critical load"],
  medical: ["Clinical care, diagnostics and treatment spaces", 0.16, "Essential clinical load"],
};

function calculateEnergy(
  campus,
  weather,
  occupancy,
  batterySoc,
  gridOutage,
  proposalVisible,
  planningSummary,
  hazard,
  energyConfig,
) {
  return calculateCampusEnergy({
    campus,
    config: energyConfig,
    weather,
    occupancy,
    batterySoc,
    gridOutage,
    proposalVisible,
    planningSummary,
    hazardImpact: getHazardImpact(hazard),
  });
}

function Toggle({ checked, onChange, label, icon: Icon }) {
  return (
    <label className="switch-row">
      <span className="switch-label">{Icon && <Icon size={16} />}{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="switch" />
    </label>
  );
}

function RegionalMetric({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-icon"><Icon size={17} /></div>
      <div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></div>
    </div>
  );
}

export default function RegionalCampusSimulator({ campus, onBack, embedded = false }) {
  const [liveWeather, setLiveWeather] = useState({ ...FALLBACK_WEATHER, temperature: 31, feelsLike: 33 });
  const [weatherMode, setWeatherMode] = useState("live");
  const [scenario, setScenario] = useState("clear");
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [occupancy, setOccupancy] = useState(72);
  const [batterySoc, setBatterySoc] = useState(66);
  const [energyConfig, setEnergyConfig] = useState(() =>
    createDefaultEnergyConfig(campus),
  );
  const [gridOutage, setGridOutage] = useState(false);
  const [proposalVisible, setProposalVisible] = useState(true);
  const [flowVisible, setFlowVisible] = useState(true);
  const [activityVisible, setActivityVisible] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [engineeringOpen, setEngineeringOpen] = useState(false);
  const [planningProposals, setPlanningProposals] = useState([]);
  const { hazard, runHazard, resetHazard } = useHazardSimulation();
  const [selected, setSelected] = useState(null);
  const [cameraPreset, setCameraPreset] = useState("overview");
  const [cameraRevision, setCameraRevision] = useState(0);
  const [zoomAction, setZoomAction] = useState({ id: 0, direction: "in" });

  const refreshWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const [latitude, longitude] = campus.coordinates;
      setLiveWeather(await fetchCampusWeather(latitude, longitude));
    } catch {
      setLiveWeather((current) => ({ ...current, source: "local climate model" }));
    } finally {
      setWeatherLoading(false);
    }
  }, [campus]);

  useEffect(() => {
    refreshWeather();
    const timer = window.setInterval(refreshWeather, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [refreshWeather]);

  const weather = useMemo(
    () => weatherMode === "live"
      ? liveWeather
      : { ...SCENARIOS[scenario], time: new Date().toISOString(), source: "scenario simulation" },
    [liveWeather, scenario, weatherMode],
  );
  const planningSummary = useMemo(
    () => aggregateProposals(planningProposals),
    [planningProposals],
  );
  const energy = useMemo(
    () =>
      calculateEnergy(
        campus,
        weather,
        occupancy,
        batterySoc,
        gridOutage,
        proposalVisible,
        planningSummary,
        hazard,
        energyConfig,
      ),
    [
      batterySoc,
      campus,
      gridOutage,
      occupancy,
      proposalVisible,
      weather,
      planningSummary,
      hazard,
      energyConfig,
    ],
  );
  useEffect(() => {
    const timer = window.setInterval(
      () => setBatterySoc((value) => clamp(value + energy.batteryFlow * 0.024, 5, 100)),
      3000,
    );
    return () => window.clearInterval(timer);
  }, [energy.batteryFlow]);

  useEffect(() => {
    if (!embedded || window.parent === window) return;

    let parentOrigin = "*";
    try {
      parentOrigin = document.referrer ? new URL(document.referrer).origin : "*";
    } catch {
      parentOrigin = "*";
    }

    window.parent.postMessage(
      {
        type: "surya:campus-telemetry",
        payload: {
          campus: campus.shortName,
          demandMw: energy.demand,
          solarMw: energy.solar,
          windMw: energy.wind,
          gridMw: energy.grid,
          renewableShare: energy.share,
          batterySoc,
          occupancy,
          gridOffline: energy.gridOffline,
          weather: weatherLabel(weather.weatherCode),
          temperature: weather.temperature,
          source: weather.source,
          updatedAt: new Date().toISOString(),
        },
      },
      parentOrigin,
    );
  }, [batterySoc, campus, embedded, energy, occupancy, weather]);

  const chooseCamera = (id) => {
    setCameraPreset(id);
    setCameraRevision((value) => value + 1);
  };
  const selectBuilding = (name) => {
    setSelected(name);
    if (name) chooseCamera(`building:${name}`);
  };
  const cameraOptions = useMemo(
    () => [
      ...BASE_CAMERA_OPTIONS,
      ...campus.buildings.map((building) => [`building:${building[0]}`, building[0]]),
    ],
    [campus],
  );
  const selectedBuilding = campus.buildings.find((building) => building[0] === selected);
  const localTime = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date());

  return (
    <main className={`app-shell regional-simulator ${embedded ? "embedded-mode" : ""} ${engineeringOpen ? "engineering-open" : ""} ${controlsOpen ? "controls-open" : ""}`} style={{ "--campus-accent": campus.accent }}>
      <div className="scene-shell">
        <RegionalCampusScene
          campus={campus}
          weather={weather}
          energy={energy}
          occupancy={occupancy}
          selected={selected}
          onSelect={selectBuilding}
          cameraPreset={cameraPreset}
          cameraRevision={cameraRevision}
          zoomAction={zoomAction}
          proposalVisible={proposalVisible}
          flowVisible={flowVisible && hazard.phase !== "tripped"}
          activityVisible={activityVisible}
          planningProposals={planningProposals}
          hazard={hazard}
        />
      </div>

      <header className="topbar">
        <div className="brand regional-brand">
          <button className="hub-back" onClick={onBack} aria-label="Back to all campus simulators"><ArrowLeft size={18} /></button>
          <div className="brand-mark"><SuryaMark size={38} /></div>
          <div><strong>{campus.shortName}</strong><span>Flagship Campus Energy Twin</span></div>
        </div>
        <div className="topbar-center">
          <span className={`status-pill status-${weatherMode === "live" ? "live" : "scenario"}`}><span className="pulse-dot" />{weatherMode === "live" ? "Live campus" : "Scenario mode"}</span>
          <span className="location"><LocateFixed size={14} />{campus.city}, Rajasthan</span>
        </div>
        <div className="topbar-actions">
          <button
            className="engineering-button"
            onClick={() => {
              setEngineeringOpen((value) => !value);
              setControlsOpen(false);
            }}
            aria-expanded={engineeringOpen}
          >
            <Wrench size={16} /><span>Engineering Lab</span>
            {planningProposals.length > 0 && <b>{planningProposals.length}</b>}
          </button>
          <button
            className="primary-button"
            onClick={() => {
              setControlsOpen((value) => !value);
              setEngineeringOpen(false);
            }}
            aria-expanded={controlsOpen}
          >
            <Gauge size={16} />Controls
          </button>
        </div>
      </header>

      <section className="weather-panel">
        <div className="weather-primary">
          <div className="weather-icon">{weather.precipitation > 0.1 ? <CloudRain /> : <Sun />}</div>
          <div><strong>{weather.temperature.toFixed(0)}°</strong><span>{weatherLabel(weather.weatherCode)}</span></div>
        </div>
        <div className="weather-grid">
          <div><Thermometer size={14} /><span>Feels like</span><strong>{weather.feelsLike.toFixed(0)}°C</strong></div>
          <div><Wind size={14} /><span>Wind</span><strong>{weather.windSpeed.toFixed(0)} km/h</strong></div>
          <div><Activity size={14} /><span>Direction</span><strong>{compassDirection(weather.windDirection)}</strong></div>
          <div><Sun size={14} /><span>Solar</span><strong>{weather.radiation.toFixed(0)} W/m²</strong></div>
        </div>
        <div className="weather-source"><span>{localTime} IST • {weather.source}</span><button className="refresh-button" onClick={refreshWeather} disabled={weatherLoading} aria-label="Refresh live weather"><RefreshCw size={14} className={weatherLoading ? "spin" : ""} /></button></div>
      </section>

      <nav className="camera-bar regional-camera-bar" aria-label="Campus camera views">
        <Map size={15} />
        {cameraOptions.map(([id, label]) => (
          <button key={id} className={cameraPreset === id ? "is-active" : ""} onClick={() => chooseCamera(id)}>{label}</button>
        ))}
        <span className="camera-divider" aria-hidden="true" />
        <button className="camera-icon-button" onClick={() => setZoomAction((value) => ({ id: value.id + 1, direction: "in" }))} aria-label="Zoom closer" title="Zoom closer"><ZoomIn size={15} /></button>
        <button className="camera-icon-button" onClick={() => setZoomAction((value) => ({ id: value.id + 1, direction: "out" }))} aria-label="Zoom farther" title="Zoom farther"><ZoomOut size={15} /></button>
        <button className="camera-icon-button" onClick={() => chooseCamera("overview")} aria-label="Reset campus view" title="Reset campus view"><RotateCcw size={14} /></button>
      </nav>

      <div className="metrics-row">
        <RegionalMetric icon={Sun} label="Solar generation" value={power(energy.solar)} detail={`${campus.solarMw} MWp installed`} tone="cyan" />
        <RegionalMetric icon={Wind} label="Wind generation" value={power(energy.wind)} detail={`${campus.windMw} MW capacity`} tone="green" />
        <RegionalMetric icon={Building2} label="Campus demand" value={power(energy.demand)} detail={`${occupancy}% occupancy${planningProposals.length ? ` • ${planningProposals.length} proposal${planningProposals.length > 1 ? "s" : ""}` : ""}`} tone="amber" />
        <RegionalMetric icon={Zap} label="Renewable share" value={`${energy.share.toFixed(0)}%`} detail={`${power(energy.renewable)} available`} tone="magenta" />
      </div>

      <aside className={`control-panel ${controlsOpen ? "is-open" : ""}`}>
        <div className="control-head"><div><span className="eyebrow">Simulation controls</span><h2>{campus.shortName}</h2></div><button className="icon-button" onClick={() => setControlsOpen(false)} aria-label="Close controls"><X size={17} /></button></div>
        <div className="mode-segment">
          <button className={weatherMode === "live" ? "is-active" : ""} onClick={() => setWeatherMode("live")}>Live weather</button>
          <button className={weatherMode === "scenario" ? "is-active" : ""} onClick={() => setWeatherMode("scenario")}>Scenarios</button>
        </div>
        {weatherMode === "scenario" && (
          <label className="field-label">Weather event<span className="select-wrap"><select value={scenario} onChange={(event) => setScenario(event.target.value)}>{Object.entries(SCENARIOS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select><ChevronDown size={16} /></span></label>
        )}
        <label className="range-field"><span><span>Campus occupancy</span><strong>{occupancy}%</strong></span><input type="range" min="15" max="100" value={occupancy} onChange={(event) => setOccupancy(Number(event.target.value))} /></label>
        <div className="control-switches">
          <Toggle checked={proposalVisible} onChange={setProposalVisible} label="Renewable infrastructure" icon={Layers3} />
          <Toggle checked={flowVisible} onChange={setFlowVisible} label="Animated energy flow" icon={Activity} />
          <Toggle checked={activityVisible} onChange={setActivityVisible} label="Traffic and students" icon={Activity} />
          <Toggle checked={gridOutage} onChange={setGridOutage} label="Simulate grid outage" icon={Zap} />
        </div>
        <div className="control-note"><Info size={15} /><span>Drag to orbit • scroll to zoom • select buildings for details.</span></div>
      </aside>

      <section className="bottom-dock">
        <div className="balance-card">
          <div className="balance-head"><div><span className="eyebrow">Real-time power balance</span><strong>{power(energy.demand)} campus demand</strong></div><span className={energy.gridOffline ? "grid-alert" : "grid-state"}>{energy.gridOffline ? `${power(energy.unmet)} unsupported` : energy.grid >= 0 ? `${power(energy.grid)} import` : `${power(energy.grid)} export`}</span></div>
          <div className="energy-bar"><span className="bar-solar" style={{ width: `${Math.min(100, energy.solar / Math.max(energy.demand, 0.1) * 100)}%` }} /><span className="bar-wind" style={{ width: `${Math.min(100, energy.wind / Math.max(energy.demand, 0.1) * 100)}%` }} /><span className="bar-grid" style={{ flex: 1 }} /></div>
          <div className="balance-legend"><span><i className="legend-dot solar-dot" />Solar {power(energy.solar)}</span><span><i className="legend-dot wind-dot" />Wind {power(energy.wind)}</span><span className="battery-inline"><BatteryCharging size={14} />Battery {batterySoc.toFixed(0)}%</span></div>
        </div>
      </section>

      <HazardStatusBanner hazard={hazard} onReset={resetHazard} />
      <EngineeringLab
        open={engineeringOpen}
        onClose={() => setEngineeringOpen(false)}
        campus={campus}
        currentEnergy={energy}
        energyConfig={energyConfig}
        onEnergyConfigChange={setEnergyConfig}
        batterySoc={batterySoc}
        weather={weather}
        proposals={planningProposals}
        onAddProposal={(proposal) =>
          setPlanningProposals((current) => [...current, proposal])
        }
        onRemoveProposal={(id) =>
          setPlanningProposals((current) =>
            current.filter((proposal) => proposal.id !== id),
          )
        }
        hazard={hazard}
        onRunHazard={runHazard}
        onResetHazard={resetHazard}
      />

      {selectedBuilding && (
        <aside className="asset-panel">
          <button className="icon-button asset-close" onClick={() => setSelected(null)} aria-label="Close building details"><X size={16} /></button>
          <span className="asset-type">{selectedBuilding[1]} facility</span><h2>{selectedBuilding[0]}</h2>
          <p>{(FACILITY_DETAILS[selectedBuilding[1]] || FACILITY_DETAILS.academic)[0]} at {campus.shortName}. Its live demand responds to occupancy, climate and grid scenarios.</p>
          <div className="asset-facts">
            <div><span>Floors / estimated load</span><strong>{selectedBuilding[6]} • {power(campus.baseDemand * (FACILITY_DETAILS[selectedBuilding[1]] || FACILITY_DETAILS.academic)[1])}</strong></div>
            <div><span>Energy role</span><strong>{(FACILITY_DETAILS[selectedBuilding[1]] || FACILITY_DETAILS.academic)[2]} • rooftop solar</strong></div>
          </div>
        </aside>
      )}

    </main>
  );
}
