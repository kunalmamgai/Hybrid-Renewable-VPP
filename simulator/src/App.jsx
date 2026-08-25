import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BatteryCharging,
  Building2,
  ChevronDown,
  CloudRain,
  Compass,
  Eye,
  EyeOff,
  Gauge,
  Info,
  Layers3,
  LocateFixed,
  Map,
  PanelRightClose,
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
import { BUILDINGS, CampusScene } from "./CampusScene";
import CampusDashboard from "./CampusDashboard";
import EngineeringLab, { HazardStatusBanner } from "./EngineeringLab";
import RegionalCampusSimulator from "./RegionalCampusSimulator";
import SuryaMark from "./SuryaMark";
import { getCampus } from "./campuses";
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
  fetchLiveWeather,
  weatherLabel,
} from "./weather";

const CAMERA_OPTIONS = [
  ["overview", "Campus"],
  ["main", "Main block"],
  ["hostel", "Girls Hostel Block-1"],
  ["chancellor", "Chancellor Residence"],
  ["hostel2", "Girls Hostel Block-2"],
  ["boys", "Boys Hostel Block-1"],
  ["hostels", "Boys Hostel Blocks 2–5"],
  ["modernHostel", "Modern Boys Hostel 6"],
  ["racingGarden", "Racing Garden & Track"],
  ["boysMess", "Boys’ Hostel Mess"],
  ["lab", "Lab complex"],
  ["architecture", "Architecture Block"],
  ["underbelly", "Underbelly"],
  ["block2", "Block 2"],
  ["football", "Football"],
  ["specialBlock", "Special Block"],
  ["hall", "Hall"],
  ["gate2", "Gate 2"],
  ["gate", "Main gate"],
];

const ASSET_CAMERA_PRESETS = {
  main: "main",
  hostel: "hostel",
  chancellor: "chancellor",
  hostel2: "hostel2",
  boys: "boys",
  hostels: "hostels",
  modernHostel: "modernHostel",
  racingGarden: "racingGarden",
  boysMess: "boysMess",
  lab: "lab",
  architecture: "architecture",
  underbelly: "underbelly",
  block2: "block2",
  football: "football",
  auditorium: "specialBlock",
  hall: "hall",
  gate2: "gate2",
  gate: "gate",
  solar: "solar",
  wind: "wind",
  battery: "battery",
  grid: "grid",
};

const CAMERA_ASSETS = {
  specialBlock: "auditorium",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateEnergy(
  weather,
  occupancy,
  batterySoc,
  batteryMode,
  gridOutage,
  proposalVisible,
  planningSummary,
  hazard,
  energyConfig,
) {
  return calculateCampusEnergy({
    campus: getCampus("vit-bhopal"),
    config: energyConfig,
    weather,
    occupancy,
    batterySoc,
    batteryMode,
    gridOutage,
    proposalVisible,
    planningSummary,
    hazardImpact: getHazardImpact(hazard),
  });
}

function formatPower(value) {
  return `${Math.abs(value).toFixed(Math.abs(value) >= 10 ? 1 : 2)} MW`;
}

function StatusPill({ children, tone = "live" }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}

function Metric({ icon: Icon, label, value, detail, accent }) {
  return (
    <div className={`metric ${accent ? `metric-${accent}` : ""}`}>
      <div className="metric-icon">
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div>
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <span className="metric-detail">{detail}</span>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, icon: Icon }) {
  return (
    <label className="switch-row">
      <span className="switch-label">
        {Icon && <Icon size={16} aria-hidden="true" />}
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}

function EnergyBalance({ energy, batterySoc, gridOutage, proposalVisible }) {
  const total = Math.max(energy.demand + Math.max(0, energy.batteryFlow), 0.1);
  const solarWidth = clamp((energy.solar / total) * 100, 0, 100);
  const windWidth = clamp((energy.wind / total) * 100, 0, 100 - solarWidth);
  const gridWidth = clamp(100 - solarWidth - windWidth, 0, 100);

  return (
    <section className="balance-card" aria-label="Campus energy balance">
      <div className="balance-head">
        <div>
          <span className="eyebrow">Real-time power balance</span>
          <strong>{formatPower(energy.demand)} campus demand</strong>
        </div>
        <span className={gridOutage ? "grid-alert" : "grid-state"}>
          {gridOutage
            ? `${formatPower(energy.unmet)} unsupported`
            : energy.grid >= 0
              ? `${formatPower(energy.grid)} import`
              : `${formatPower(energy.grid)} export`}
        </span>
      </div>
      <div className="energy-bar" aria-hidden="true">
        <span className="bar-solar" style={{ width: `${solarWidth}%` }} />
        <span className="bar-wind" style={{ width: `${windWidth}%` }} />
        <span className="bar-grid" style={{ width: `${gridWidth}%` }} />
      </div>
      <div className="balance-legend">
        <span>
          <i className="legend-dot solar-dot" /> Solar {formatPower(energy.solar)}
        </span>
        <span>
          <i className="legend-dot wind-dot" /> Wind {formatPower(energy.wind)}
        </span>
        <span>
          <i className="legend-dot grid-dot" /> Grid{" "}
          {gridOutage ? "isolated" : formatPower(energy.grid)}
        </span>
        {proposalVisible ? (
          <span className="battery-inline">
            <BatteryCharging size={14} /> Battery {batterySoc.toFixed(0)}% •{" "}
            {energy.batteryFlow >= 0 ? "charging" : "supporting"}{" "}
            {formatPower(energy.batteryFlow)}
          </span>
        ) : (
          <span className="battery-inline">Proposal layer excluded</span>
        )}
      </div>
    </section>
  );
}

function SelectedAsset({ selected, onClose }) {
  const asset = selected ? BUILDINGS[selected] : null;
  if (!asset) return null;
  return (
    <aside className="asset-panel">
      <button className="icon-button asset-close" onClick={onClose} aria-label="Close asset details">
        <PanelRightClose size={18} />
      </button>
      <span className="asset-type">{asset.type}</span>
      <h2>{asset.name}</h2>
      <p>{asset.description}</p>
      <div className="asset-facts">
        <div>
          <span>Capacity / demand</span>
          <strong>{asset.load}</strong>
        </div>
        <div>
          <span>Energy role</span>
          <strong>{asset.energy}</strong>
        </div>
      </div>
    </aside>
  );
}

function VitBhopalSimulator({ onBack, embedded = false }) {
  const [liveWeather, setLiveWeather] = useState(FALLBACK_WEATHER);
  const [weatherError, setWeatherError] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherMode, setWeatherMode] = useState("live");
  const [scenario, setScenario] = useState("clear");
  const [occupancy, setOccupancy] = useState(74);
  const [batterySoc, setBatterySoc] = useState(67);
  const [batteryMode, setBatteryMode] = useState("auto");
  const [energyConfig, setEnergyConfig] = useState(() =>
    createDefaultEnergyConfig(getCampus("vit-bhopal")),
  );
  const [gridOutage, setGridOutage] = useState(false);
  const [proposalVisible, setProposalVisible] = useState(true);
  const [flowVisible, setFlowVisible] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cameraPreset, setCameraPreset] = useState("overview");
  const [cameraRevision, setCameraRevision] = useState(0);
  const [zoomAction, setZoomAction] = useState({ id: 0, direction: "in" });
  const [controlsOpen, setControlsOpen] = useState(false);
  const [engineeringOpen, setEngineeringOpen] = useState(false);
  const [planningProposals, setPlanningProposals] = useState([]);
  const { hazard, runHazard, resetHazard } = useHazardSimulation();

  const refreshWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const weather = await fetchLiveWeather();
      setLiveWeather(weather);
    } catch (error) {
      setWeatherError("Live service unavailable — using the local weather model.");
      setLiveWeather((previous) => ({ ...FALLBACK_WEATHER, ...previous, source: "offline model" }));
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWeather();
    const refreshTimer = window.setInterval(refreshWeather, 10 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
  }, [refreshWeather]);

  const weather = useMemo(() => {
    if (weatherMode === "live") return liveWeather;
    return {
      ...SCENARIOS[scenario],
      time: new Date().toISOString(),
      source: "scenario simulation",
    };
  }, [liveWeather, scenario, weatherMode]);

  const planningSummary = useMemo(
    () => aggregateProposals(planningProposals),
    [planningProposals],
  );

  const energy = useMemo(
    () =>
      calculateEnergy(
        weather,
        occupancy,
        batterySoc,
        batteryMode,
        gridOutage,
        proposalVisible,
        planningSummary,
        hazard,
        energyConfig,
      ),
    [
      weather,
      occupancy,
      batterySoc,
      batteryMode,
      gridOutage,
      proposalVisible,
      planningSummary,
      hazard,
      energyConfig,
    ],
  );

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
          campus: "VIT Bhopal",
          demandMw: energy.demand,
          solarMw: energy.solar,
          windMw: energy.wind,
          gridMw: energy.grid,
          renewableShare: energy.renewableShare,
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
  }, [batterySoc, embedded, energy, occupancy, weather]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBatterySoc((previous) =>
        clamp(previous + energy.batteryFlow * 0.025, 5, 100),
      );
    }, 3000);
    return () => window.clearInterval(timer);
  }, [energy.batteryFlow]);

  const selectAsset = (id) => {
    setSelected(id);
    const nextPreset = ASSET_CAMERA_PRESETS[id];
    if (nextPreset) {
      setCameraPreset(nextPreset);
      setCameraRevision((value) => value + 1);
    }
  };

  const chooseCamera = (id) => {
    setCameraPreset(id);
    setSelected(id === "overview" ? null : CAMERA_ASSETS[id] || (BUILDINGS[id] ? id : null));
    setCameraRevision((value) => value + 1);
  };

  const zoomCamera = (direction) => {
    setZoomAction((current) => ({ id: current.id + 1, direction }));
  };

  const localTime = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());

  return (
    <main className={`app-shell ${embedded ? "embedded-mode" : ""} ${engineeringOpen ? "engineering-open" : ""} ${controlsOpen ? "controls-open" : ""} ${cameraPreset === "underbelly" ? "underbelly-view" : ""}`}>
      <div className="scene-shell" aria-label="Interactive 3D model of VIT Bhopal campus">
        <CampusScene
          weather={weather}
          energy={energy}
          selected={selected}
          onSelect={selectAsset}
          cameraPreset={cameraPreset}
          cameraRevision={cameraRevision}
          zoomAction={zoomAction}
          proposalVisible={proposalVisible}
          flowVisible={flowVisible && cameraPreset !== "underbelly" && hazard.phase !== "tripped"}
          planningProposals={planningProposals}
          hazard={hazard}
        />
      </div>

      <header className="topbar">
        <div className="brand">
          <button className="hub-back" onClick={onBack} aria-label="Back to all campus simulators">
            <ArrowLeft size={18} />
          </button>
          <div className="brand-mark">
            <SuryaMark size={38} />
          </div>
          <div>
            <strong>VIT Bhopal</strong>
            <span>Campus Energy Twin</span>
          </div>
        </div>
        <div className="topbar-center">
          <StatusPill tone={weatherMode === "live" ? "live" : "scenario"}>
            <span className="pulse-dot" />
            {weatherMode === "live" ? "Live campus" : "Scenario mode"}
          </StatusPill>
          <span className="location">
            <LocateFixed size={14} />
            Kothri Kalan, Madhya Pradesh
          </span>
        </div>
        <div className="topbar-actions">
          <button
            className="engineering-button"
            onClick={() => {
              setEngineeringOpen((open) => !open);
              setControlsOpen(false);
            }}
            aria-expanded={engineeringOpen}
          >
            <Wrench size={16} />
            <span>Engineering Lab</span>
            {planningProposals.length > 0 && <b>{planningProposals.length}</b>}
          </button>
          <button
            className="primary-button"
            onClick={() => {
              setControlsOpen((open) => !open);
              setEngineeringOpen(false);
            }}
            aria-expanded={controlsOpen}
          >
            <Gauge size={16} />
            Controls
          </button>
        </div>
      </header>

      <section className="weather-panel">
        <div className="weather-primary">
          <div className="weather-icon">
            {weather.precipitation > 0.1 ? <CloudRain /> : <Sun />}
          </div>
          <div>
            <strong>{weather.temperature.toFixed(0)}°</strong>
            <span>{weatherLabel(weather.weatherCode)}</span>
          </div>
        </div>
        <div className="weather-grid">
          <div>
            <Thermometer size={14} />
            <span>Feels like</span>
            <strong>{weather.feelsLike.toFixed(0)}°C</strong>
          </div>
          <div>
            <Wind size={14} />
            <span>Wind</span>
            <strong>{weather.windSpeed.toFixed(0)} km/h</strong>
          </div>
          <div>
            <Compass size={14} />
            <span>Direction</span>
            <strong>{compassDirection(weather.windDirection)}</strong>
          </div>
          <div>
            <Sun size={14} />
            <span>Solar</span>
            <strong>{weather.radiation.toFixed(0)} W/m²</strong>
          </div>
        </div>
        <div className="weather-source">
          <span>{localTime} IST • {weather.source}</span>
          {weatherMode === "live" && (
            <button
              className="refresh-button"
              onClick={refreshWeather}
              disabled={weatherLoading}
              aria-label="Refresh live weather"
            >
              <RefreshCw size={14} className={weatherLoading ? "spin" : ""} />
            </button>
          )}
        </div>
        {weatherError && <span className="weather-error">{weatherError}</span>}
      </section>

      <nav
        className="camera-bar"
        aria-label="Campus camera views"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <Map size={15} aria-hidden="true" />
        {CAMERA_OPTIONS.map(([id, label]) => (
          <button
            key={id}
            className={cameraPreset === id ? "is-active" : ""}
            onClick={() => chooseCamera(id)}
          >
            {label}
          </button>
        ))}
        <span className="camera-divider" aria-hidden="true" />
        <button
          className="camera-icon-button"
          onClick={() => zoomCamera("in")}
          aria-label="Zoom closer"
          title="Zoom closer"
        >
          <ZoomIn size={15} />
        </button>
        <button
          className="camera-icon-button"
          onClick={() => zoomCamera("out")}
          aria-label="Zoom farther"
          title="Zoom farther"
        >
          <ZoomOut size={15} />
        </button>
        <button
          className="camera-icon-button"
          onClick={() => chooseCamera("overview")}
          aria-label="Reset campus view"
          title="Reset campus view"
        >
          <RotateCcw size={14} />
        </button>
      </nav>

      <div className="metrics-row">
        <Metric
          icon={Sun}
          label="Solar generation"
          value={formatPower(energy.solar)}
          detail={`${weather.radiation.toFixed(0)} W/m² irradiance`}
          accent="cyan"
        />
        <Metric
          icon={Wind}
          label="Wind generation"
          value={formatPower(energy.wind)}
          detail={`${weather.windSpeed.toFixed(0)} km/h live wind`}
          accent="green"
        />
        <Metric
          icon={Building2}
          label="Campus demand"
          value={formatPower(energy.demand)}
          detail={`${occupancy}% occupancy${planningProposals.length ? ` • ${planningProposals.length} proposal${planningProposals.length > 1 ? "s" : ""}` : ""}`}
          accent="amber"
        />
        <Metric
          icon={Zap}
          label="Renewable share"
          value={`${energy.renewableShare.toFixed(0)}%`}
          detail={`${formatPower(energy.renewable)} available`}
          accent="magenta"
        />
      </div>

      <div className={`control-panel ${controlsOpen ? "is-open" : ""}`}>
        <div className="control-head">
          <div>
            <span className="eyebrow">Digital twin controls</span>
            <h2>Operate the campus</h2>
          </div>
          <button
            className="icon-button"
            onClick={() => setControlsOpen(false)}
            aria-label="Close controls"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mode-segment">
          <button
            className={weatherMode === "live" ? "is-active" : ""}
            onClick={() => setWeatherMode("live")}
          >
            Live weather
          </button>
          <button
            className={weatherMode === "scenario" ? "is-active" : ""}
            onClick={() => setWeatherMode("scenario")}
          >
            Test scenario
          </button>
        </div>

        {weatherMode === "scenario" && (
          <label className="field-label">
            Weather event
            <span className="select-wrap">
              <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
                {Object.entries(SCENARIOS).map(([id, item]) => (
                  <option key={id} value={id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </span>
          </label>
        )}

        <label className="range-field">
          <span>
            <span>Campus occupancy</span>
            <strong>{occupancy}%</strong>
          </span>
          <input
            type="range"
            min="15"
            max="100"
            value={occupancy}
            onChange={(event) => setOccupancy(Number(event.target.value))}
          />
        </label>

        <label className="field-label">
          Battery strategy
          <span className="select-wrap">
            <select
              value={batteryMode}
              onChange={(event) => setBatteryMode(event.target.value)}
            >
              <option value="auto">Smart balance</option>
              <option value="charge">Charge from surplus</option>
              <option value="reserve">Emergency reserve</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </label>

        <div className="control-switches">
          <Toggle
            checked={proposalVisible}
            onChange={setProposalVisible}
            label="Renewable proposal"
            icon={Layers3}
          />
          <Toggle
            checked={flowVisible}
            onChange={setFlowVisible}
            label="Animated energy flow"
            icon={flowVisible ? Eye : EyeOff}
          />
          <Toggle
            checked={gridOutage}
            onChange={setGridOutage}
            label="Simulate grid outage"
            icon={Zap}
          />
        </div>

        <div className="control-note">
          <Info size={15} />
          <span>
            Drag to orbit • scroll to zoom • select any building or energy asset for details.
          </span>
        </div>
      </div>

      <div className="bottom-dock">
        <EnergyBalance
          energy={energy}
          batterySoc={batterySoc}
          gridOutage={energy.gridOffline}
          proposalVisible={proposalVisible}
        />
      </div>

      <HazardStatusBanner hazard={hazard} onReset={resetHazard} />
      <EngineeringLab
        open={engineeringOpen}
        onClose={() => setEngineeringOpen(false)}
        campus={getCampus("vit-bhopal")}
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
      <SelectedAsset selected={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

export default function App() {
  const embedded = new URLSearchParams(window.location.search).get("embed") === "1";
  const [campusId, setCampusId] = useState(() => {
    const requested = window.location.hash.replace("#", "");
    return getCampus(requested) ? requested : null;
  });

  useEffect(() => {
    const syncCampusFromUrl = () => {
      const requested = window.location.hash.replace("#", "");
      setCampusId(getCampus(requested) ? requested : null);
    };

    window.addEventListener("hashchange", syncCampusFromUrl);
    return () => window.removeEventListener("hashchange", syncCampusFromUrl);
  }, []);

  const selectCampus = (id) => {
    window.location.hash = id;
    setCampusId(id);
  };

  const returnToDashboard = () => {
    if (embedded && window.parent !== window) {
      let parentOrigin = "*";
      try {
        parentOrigin = document.referrer ? new URL(document.referrer).origin : "*";
      } catch {
        parentOrigin = "*";
      }
      window.parent.postMessage(
        { type: "surya:campus-selection", payload: { campusId: "all" } },
        parentOrigin,
      );
    }
    window.history.replaceState(null, "", window.location.pathname);
    setCampusId(null);
  };

  if (!campusId) return <CampusDashboard onSelect={selectCampus} />;
  if (campusId === "vit-bhopal") {
    return <VitBhopalSimulator onBack={returnToDashboard} embedded={embedded} />;
  }
  const campus = getCampus(campusId);
  return <RegionalCampusSimulator campus={campus} onBack={returnToDashboard} embedded={embedded} />;
}
