import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Building2,
  Calculator,
  CloudSun,
  Factory,
  Flame,
  Gauge,
  GitCompareArrows,
  Network,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  Sun,
  Trash2,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import {
  BUILDING_TEMPLATES,
  HAZARD_SCENARIOS,
  SITE_OPTIONS,
  aggregateProposals,
  predictBuilding,
} from "./engineeringEngine";
import { createDefaultEnergyConfig, TOPOLOGY_OPTIONS } from "./energyIntelligence";

const power = (value) => `${Math.abs(value || 0).toFixed(Math.abs(value || 0) >= 10 ? 1 : 2)} MW`;
const energy = (value) => `${Math.abs(value || 0).toFixed(Math.abs(value || 0) >= 10 ? 1 : 2)} MWh`;

const DEFAULT_DRAFT = {
  name: "",
  type: "academic",
  site: "north",
  footprint: 2200,
  floors: 4,
  occupancy: 78,
  efficiency: 18,
  operatingHours: 10,
};

function PredictionValue({ label, value, detail, tone = "" }) {
  return (
    <div className={`engineering-result ${tone ? `is-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

const currency = (value) =>
  `₹${Math.max(0, Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function EnergyIntelligence({
  campus,
  currentEnergy,
  energyConfig,
  onEnergyConfigChange,
  batterySoc,
  weather,
}) {
  const comparison = currentEnergy?.comparison;
  const losses = currentEnergy?.losses;
  const risk = currentEnergy?.forecastRisk;
  const forecast = (currentEnergy?.forecast || []).filter((_, index) => index % 4 === 0).slice(0, 12);
  const dailyProfile = currentEnergy?.dailyProfile || [];
  const comparisonBasis = comparison?.basis;
  const profileCeiling = Math.max(
    0.1,
    ...dailyProfile.map((item) => Math.max(item.demand || 0, item.renewable || 0, item.gridImport || 0)),
  );
  const weatherIsLive = /open-meteo|wttr\.in/i.test(weather?.source || "");

  const updateConfig = (field, value) => {
    onEnergyConfigChange((current) => ({ ...current, [field]: value }));
  };

  const numberField = (label, field, unit, min, max, step = 1) => (
    <label className="engineering-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={energyConfig[field]}
          onChange={(event) => updateConfig(field, Number(event.target.value))}
        />
        <em>{unit}</em>
      </div>
    </label>
  );

  return (
    <div className="engineering-lab-body energy-intelligence">
      <section className="engineering-section energy-dispatch-section">
        <div className="engineering-section-title">
          <div><Network size={16} /><span><b>Modelled multi-source dispatch</b><small>Calculated routing after conversion losses</small></span></div>
          <span className={`engineering-model-tag risk-${risk?.level || "low"}`}>{currentEnergy?.gridOffline ? "Island mode" : "Grid connected"}</span>
        </div>
        <div className="energy-flow-board">
          <div className="energy-source-column">
            <div className="flow-node source-solar"><Sun size={14} /><span>Solar PV<b>{power(currentEnergy?.solar)}</b></span></div>
            <div className="flow-node source-wind"><Activity size={14} /><span>Wind<b>{power(currentEnergy?.wind)}</b></span></div>
            <div className={`flow-node source-battery ${currentEnergy?.batteryFlow < 0 ? "is-active" : ""}`}><BatteryCharging size={14} /><span>BESS<b>{batterySoc?.toFixed(0)}% SoC</b></span></div>
            <div className={`flow-node source-diesel ${currentEnergy?.diesel > 0 ? "is-active" : ""}`}><Factory size={14} /><span>Diesel backup<b>{power(currentEnergy?.diesel)}</b></span></div>
            <div className={`flow-node source-grid ${currentEnergy?.gridOffline ? "is-offline" : ""}`}><Zap size={14} /><span>Utility grid<b>{currentEnergy?.gridOffline ? "Isolated" : power(currentEnergy?.grid)}</b></span></div>
          </div>
          <div className="energy-bus">
            <i />
            <span>AC campus bus</span>
            <b>{power(currentEnergy?.demand)}</b>
            <small>{power(losses?.totalMw)} conversion + routing loss</small>
          </div>
        </div>
        <div className="dispatch-rule-list">
          {(currentEnergy?.dispatchRules || []).map((rule) => <p key={rule}><i />{rule}</p>)}
        </div>
      </section>

      <section className="engineering-section">
        <div className="engineering-section-title">
          <div><SlidersHorizontal size={16} /><span><b>PV and storage configuration</b><small>Editable parameters recalculate the entire twin</small></span></div>
          <button
            type="button"
            className="engineering-reset-action"
            onClick={() => onEnergyConfigChange(createDefaultEnergyConfig(campus))}
          >
            <RotateCcw size={11} /> Reset defaults
          </button>
        </div>
        <div className="engineering-form-grid energy-config-grid">
          {numberField("Panel count", "panelCount", "qty", 1, 100000, 1)}
          {numberField("Panel wattage", "panelWatt", "W", 100, 900, 5)}
          {numberField("Tilt angle", "tiltDeg", "°", 0, 60, 1)}
          <label className="engineering-field">
            <span>String topology</span>
            <select value={energyConfig.topology} onChange={(event) => updateConfig("topology", event.target.value)}>
              {Object.entries(TOPOLOGY_OPTIONS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
            </select>
          </label>
          {numberField("Panels per string", "panelsPerString", "qty", 1, 40, 1)}
          {numberField("Parallel strings", "parallelStrings", "qty", 1, 10000, 1)}
          {numberField("Battery capacity", "batteryKwh", "kWh", 100, 100000, 100)}
          {numberField("Battery C-rate", "batteryCRate", "C", 0.1, 2, 0.1)}
          {numberField("Battery round-trip efficiency", "batteryRtePct", "%", 60, 99, 1)}
          {numberField("Inverter efficiency", "inverterEfficiencyPct", "%", 70, 99.9, 0.1)}
          {numberField("Distribution line loss", "lineLossPct", "%", 0, 20, 0.1)}
          {numberField("Diesel backup capacity", "dieselCapacityMw", "MW", 0, 30, 0.1)}
          {numberField("Off-peak grid tariff", "offPeakTariff", "₹/kWh", 0, 30, 0.1)}
          {numberField("Peak grid tariff", "peakTariff", "₹/kWh", 0, 40, 0.1)}
          {numberField("Export credit", "exportTariff", "₹/kWh", 0, 20, 0.1)}
          {numberField("Daily fixed charge", "fixedDailyCharge", "₹/day", 0, 100000, 500)}
          {numberField("Demand charge", "demandChargePerKwMonth", "₹/kW-mo", 0, 2000, 10)}
        </div>
        {currentEnergy?.array?.unwiredPanels > 0 && energyConfig.topology !== "microinverter" && (
          <div className="array-warning">
            <AlertTriangle size={14} />
            <span><b>{currentEnergy.array.unwiredPanels.toLocaleString("en-IN")} panels are not connected.</b> Increase panels per string or parallel strings to include them in generation.</span>
          </div>
        )}
        <label className="energy-smart-toggle">
          <span><CloudSun size={16} /><span><b>Forecast-aware pre-charging</b><small>Charge from the grid only during off-peak hours before low-solar weather</small></span></span>
          <input type="checkbox" checked={energyConfig.smartPrecharge} onChange={(event) => updateConfig("smartPrecharge", event.target.checked)} />
          <i />
        </label>
      </section>

      <section className="engineering-section forecast-section">
        <div className="engineering-section-title">
          <div><CloudSun size={16} /><span><b>48-hour predictive weather</b><small>Solar irradiance, cloud, wind and precipitation intelligence</small></span></div>
          <span className={`engineering-model-tag risk-${risk?.level || "low"}`}>{risk?.level || "low"} risk</span>
        </div>
        <div className={`precharge-decision ${currentEnergy?.prechargeScheduled ? "is-scheduled" : ""}`}>
          <BatteryCharging size={18} />
          <span>
            <b>{currentEnergy?.prechargeActive ? "Battery pre-charging now" : currentEnergy?.prechargeScheduled ? "Off-peak pre-charge scheduled" : "No pre-charge required"}</b>
            <small>{risk?.meanCloud || 0}% expected cloud • {risk?.rainHours || 0} rain-risk hours • {risk?.meanRadiation || 0} W/m² daylight irradiance</small>
          </span>
        </div>
        <div className="forecast-strip">
          {forecast.map((item) => {
            const date = new Date(item.time);
            return (
              <div key={item.time}>
                <span>{date.toLocaleDateString("en-IN", { weekday: "short" })} {date.toLocaleTimeString("en-IN", { hour: "2-digit", hour12: true })}</span>
                <i style={{ "--solar-level": `${Math.min(100, item.radiation / 10)}%` }} />
                <b>{Math.round(item.radiation)} W/m²</b>
                <small>{Math.round(item.cloudCover)}% cloud • {Math.round(item.windSpeed)} km/h</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="engineering-section projection-section">
        <div className="engineering-section-title">
          <div><Activity size={16} /><span><b>Next 24-hour operating trace</b><small>Hourly load, renewable output and utility import — not a snapshot multiplied by 24</small></span></div>
          <span className="engineering-model-tag">{dailyProfile.length} hourly steps</span>
        </div>
        <div className="projection-chart" role="img" aria-label="Hourly projection of demand, renewable generation and grid import">
          {dailyProfile.map((item, index) => {
            const hour = new Date(item.time).toLocaleTimeString("en-IN", { hour: "2-digit", hour12: false });
            return (
              <div
                key={item.time}
                title={`${hour}:00 • load ${power(item.demand)} • renewable ${power(item.renewable)} • grid import ${power(item.gridImport)} • battery ${item.batterySoc}%`}
              >
                <i className="projection-demand" style={{ height: `${item.demand / profileCeiling * 100}%` }} />
                <i className="projection-renewable" style={{ height: `${item.renewable / profileCeiling * 100}%` }} />
                <i className="projection-grid" style={{ height: `${item.gridImport / profileCeiling * 100}%` }} />
                {index % 3 === 0 && <span>{hour}</span>}
              </div>
            );
          })}
        </div>
        <div className="projection-legend">
          <span><i className="is-demand" />Campus load</span>
          <span><i className="is-renewable" />Renewables</span>
          <span><i className="is-grid" />Grid import</span>
        </div>
        <div className="projection-summary">
          <span><b>{comparisonBasis?.demandMwhDay || 0} MWh</b>forecast load</span>
          <span><b>{comparisonBasis?.renewableMwhDay || 0} MWh</b>renewable output</span>
          <span><b>{comparisonBasis?.startSocPct || 0}% → {comparisonBasis?.endSocPct || 0}%</b>battery SoC</span>
        </div>
      </section>

      <section className="engineering-section">
        <div className="engineering-section-title">
          <div><GitCompareArrows size={16} /><span><b>24-hour baseline vs hybrid forecast</b><small>Same hourly load and weather in both cases; only the energy system changes</small></span></div>
        </div>
        <div className="scenario-comparison">
          <div className="scenario-comparison-head"><span>Metric</span><b>Grid-only</b><strong>Hybrid plan</strong></div>
          <div><span>Utility import</span><b>{comparison?.baseline.gridMwhDay || 0} MWh</b><strong>{comparison?.hybrid.gridMwhDay || 0} MWh</strong></div>
          <div><span>Utility bill estimate</span><b>{currency(comparison?.baseline.costDay)}</b><strong>{currency(comparison?.hybrid.costDay)}</strong></div>
          <div><span>Network efficiency</span><b>{comparison?.baseline.efficiencyPct || 0}%</b><strong>{comparison?.hybrid.efficiencyPct || 0}%</strong></div>
        </div>
        <p className="cost-basis-note">
          Includes {currency(comparisonBasis?.fixedChargeDay)} daily fixed charge plus demand charges of {currency(comparisonBasis?.baselineDemandCharge)} (grid-only) and {currency(comparisonBasis?.hybridDemandCharge)} (hybrid). Export: {comparisonBasis?.gridExportMwhDay || 0} MWh credited at the configured rate.
        </p>
        <div className="efficiency-matrix">
          <PredictionValue label="Renewable utilization" value={`${comparison?.solarSelfConsumptionPct || 0}%`} detail="24h renewable energy used directly or stored" tone="solar" />
          <PredictionValue label="Energy autonomy" value={`${comparison?.autonomyPct || 0}%`} detail="24h load served without utility import" tone="safe" />
          <PredictionValue label="Efficiency shift" value={`${(comparison?.efficiencyGainPct || 0) >= 0 ? "+" : ""}${comparison?.efficiencyGainPct || 0}%`} detail="Conversion-loss difference versus grid-only" />
          <PredictionValue label="Peak shaving" value={`${comparison?.peakShavingPct || 0}%`} detail="Reduction in forecast maximum grid import" />
          <PredictionValue label="Estimated bill reduction" value={`${comparison?.billReductionPct || 0}%`} detail="Includes energy, fixed and demand charges" tone="safe" />
          <PredictionValue label="Estimated carbon offset" value={`${comparison?.carbonOffsetTonsYear || 0} t/year`} detail="24h forecast annualised; not a verified credit" tone="safe" />
        </div>
      </section>

      <section className="engineering-section model-confidence-section">
        <div className="engineering-section-title">
          <div><ShieldCheck size={16} /><span><b>Data quality and model limits</b><small>What is measured, forecast and assumed</small></span></div>
          <span className={`engineering-model-tag ${weatherIsLive ? "is-live-data" : "is-assumed-data"}`}>{weatherIsLive ? "Live weather" : "Scenario data"}</span>
        </div>
        <div className="model-provenance-grid">
          <div><span>Weather input</span><b>{weather?.source || "Local forecast model"}</b><small>Current conditions + hourly forecast</small></div>
          <div><span>Demand input</span><b>Engineering load profile</b><small>Occupancy, schedule, HVAC and proposed buildings — not a campus smart meter</small></div>
          <div><span>Financial model</span><b>Editable tariff assumptions</b><small>Energy, export, fixed and monthly demand charges</small></div>
          <div><span>Confidence</span><b>Planning-grade estimate</b><small>Calibrate with 12 months of bills and interval-meter data before investment</small></div>
        </div>
      </section>

      <section className="engineering-section loss-section">
        <div className="engineering-section-title">
          <div><Gauge size={16} /><span><b>Efficiency and loss breakdown</b><small>Instantaneous modelled power losses by conversion stage</small></span></div>
        </div>
        <div className="loss-bars">
          {[
            ["PV inverter / topology", losses?.inverterMw, "#72dfea"],
            ["Distribution lines", losses?.lineMw, "#f4bd64"],
            ["Battery conversion", losses?.batteryMw, "#bd8df2"],
          ].map(([label, value, color]) => (
            <div key={label}>
              <span>{label}<b>{power(value)}</b></span>
              <i><em style={{ width: `${Math.min(100, ((value || 0) / Math.max(losses?.totalMw || 0.01, 0.01)) * 100)}%`, background: color }} /></i>
            </div>
          ))}
        </div>
        <p className="engineering-safety-note">
          <ShieldCheck size={14} />
          Planning-grade digital-twin estimates for {campus?.shortName || "the campus"}. Validate final designs with site measurements, utility tariffs and certified electrical studies.
        </p>
      </section>

      <details className="engineering-model-details">
        <summary><Calculator size={15} /> Calculation model, schemas and dispatch flow</summary>
        <div>
          <h3>Control sequence</h3>
          <ol className="model-flow">
            <li><b>1</b><span>Ingest current + 48-hour weather, tariffs, campus load and asset state.</span></li>
            <li><b>2</b><span>Convert PV DC and wind output to usable AC after topology, inverter and line losses.</span></li>
            <li><b>3</b><span>Serve load from renewables; charge surplus into BESS within C-rate and SoC limits.</span></li>
            <li><b>4</b><span>Discharge BESS for residual demand; import/export grid energy when connected.</span></li>
            <li><b>5</b><span>During isolation, start diesel only for the remaining deficit, then report unmet load.</span></li>
          </ol>
          <h3>Core equations</h3>
          <code>PV_AC(MW) = N_wired × W_panel / 1,000,000 × G/1000 × f_tilt × f_temp × η_topology × η_inverter × η_line</code>
          <code>P_bess ≤ min(C_bess × C_rate, usable SoC energy); RTE = η_charge × η_discharge</code>
          <code>Autonomy = (1 − GridImport / Load) × 100; BillReduction = (Cost_baseline − Cost_hybrid) / Cost_baseline × 100</code>
          <h3>Input → output schema</h3>
          <p><b>Inputs:</b> weather[48h], load MW, SoC %, panel/string configuration, PV/BESS/wind/diesel ratings, efficiencies, losses, tariffs and grid state.</p>
          <p><b>Outputs:</b> source MW, charge/discharge MW, import/export MW, unmet MW, conversion losses, forecast decision, baseline/hybrid cost, autonomy, peak shaving and CO₂ offset.</p>
        </div>
      </details>
    </div>
  );
}

export function HazardStatusBanner({ hazard, onReset }) {
  if (!hazard || hazard.phase === "idle") return null;
  const scenario = HAZARD_SCENARIOS[hazard.type];
  const phaseLabel = {
    warning: "Abnormal condition detected",
    fault: "Fault active — protection operating",
    tripped: "Circuit isolated — supply interrupted",
    recovering: "System recovery in progress",
  }[hazard.phase];

  return (
    <section className={`hazard-status-banner phase-${hazard.phase}`} aria-live="assertive">
      <span className="hazard-banner-icon"><AlertTriangle size={18} /></span>
      <div>
        <b>{scenario?.label || "Hazard simulation"}</b>
        <span>{phaseLabel}</span>
      </div>
      <button type="button" onClick={onReset}>Reset system</button>
    </section>
  );
}

export default function EngineeringLab({
  open,
  onClose,
  campus,
  currentEnergy,
  energyConfig,
  onEnergyConfigChange,
  batterySoc,
  weather,
  proposals,
  onAddProposal,
  onRemoveProposal,
  hazard,
  onRunHazard,
  onResetHazard,
}) {
  const [tab, setTab] = useState("energy");
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [hazardType, setHazardType] = useState("overload");
  const campusBaseDemand = campus?.baseDemand || currentEnergy?.demand || 7.5;
  const prediction = useMemo(
    () => predictBuilding(draft, campusBaseDemand),
    [campusBaseDemand, draft],
  );
  const portfolio = useMemo(() => aggregateProposals(proposals), [proposals]);
  const hazardScenario = HAZARD_SCENARIOS[hazardType];

  if (!open) return null;

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      if (field === "type") {
        next.operatingHours = BUILDING_TEMPLATES[value].hours;
      }
      return next;
    });
  };

  const commitProposal = () => {
    onAddProposal(predictBuilding({ ...draft, id: `proposal-${Date.now()}` }, campusBaseDemand));
    setDraft((current) => ({ ...DEFAULT_DRAFT, type: current.type, site: current.site }));
  };

  return (
    <aside className={`engineering-lab tab-${tab}`} aria-label="Campus engineering simulation laboratory">
      <header className="engineering-lab-head">
        <div>
          <span>Decision-support simulator</span>
          <h2>Engineering Lab</h2>
          <p>{campus?.shortName || "VIT Bhopal"} • editable planning and protection studies</p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close engineering lab">
          <X size={18} />
        </button>
      </header>

      <div className="engineering-tabs" role="tablist">
        <button
          type="button"
          className={tab === "energy" ? "is-active" : ""}
          onClick={() => setTab("energy")}
          role="tab"
          aria-selected={tab === "energy"}
        >
          <Network size={15} /> Energy system
        </button>
        <button
          type="button"
          className={tab === "planning" ? "is-active" : ""}
          onClick={() => setTab("planning")}
          role="tab"
          aria-selected={tab === "planning"}
        >
          <Building2 size={15} /> Building planner
        </button>
        <button
          type="button"
          className={tab === "hazards" ? "is-active" : ""}
          onClick={() => setTab("hazards")}
          role="tab"
          aria-selected={tab === "hazards"}
        >
          <TriangleAlert size={15} /> Hazard studies
        </button>
      </div>

      {tab === "planning" ? (
        <div className="engineering-lab-body">
          <section className="engineering-section">
            <div className="engineering-section-title">
              <div><Calculator size={16} /><span><b>Proposed building</b><small>Inputs update the forecast immediately</small></span></div>
              <span className="engineering-model-tag">Planning model v1.0</span>
            </div>

            <div className="engineering-form-grid">
              <label className="engineering-field is-wide">
                <span>Building name</span>
                <input
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  placeholder={BUILDING_TEMPLATES[draft.type].label}
                />
              </label>
              <label className="engineering-field">
                <span>Facility type</span>
                <select value={draft.type} onChange={(event) => updateDraft("type", event.target.value)}>
                  {Object.entries(BUILDING_TEMPLATES).map(([id, item]) => (
                    <option key={id} value={id}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="engineering-field">
                <span>Campus location</span>
                <select value={draft.site} onChange={(event) => updateDraft("site", event.target.value)}>
                  {Object.entries(SITE_OPTIONS).map(([id, item]) => (
                    <option key={id} value={id}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="engineering-field">
                <span>Footprint</span>
                <div><input type="number" min="300" max="20000" step="100" value={draft.footprint} onChange={(event) => updateDraft("footprint", Number(event.target.value))} /><em>m²</em></div>
              </label>
              <label className="engineering-field">
                <span>Floors</span>
                <input type="number" min="1" max="15" value={draft.floors} onChange={(event) => updateDraft("floors", Number(event.target.value))} />
              </label>
              <label className="engineering-field">
                <span>Operating schedule</span>
                <div><input type="number" min="4" max="24" value={draft.operatingHours} onChange={(event) => updateDraft("operatingHours", Number(event.target.value))} /><em>h/day</em></div>
              </label>
              <label className="engineering-range is-wide">
                <span><span>Expected occupancy</span><b>{draft.occupancy}%</b></span>
                <input type="range" min="10" max="100" value={draft.occupancy} onChange={(event) => updateDraft("occupancy", Number(event.target.value))} />
              </label>
              <label className="engineering-range is-wide">
                <span><span>Efficiency improvement</span><b>{draft.efficiency}%</b></span>
                <input type="range" min="0" max="50" value={draft.efficiency} onChange={(event) => updateDraft("efficiency", Number(event.target.value))} />
              </label>
            </div>
          </section>

          <section className="engineering-section">
            <div className="engineering-section-title">
              <div><Gauge size={16} /><span><b>Predicted electrical impact</b><small>Area, occupancy, schedule, efficiency and feeder distance are included</small></span></div>
            </div>
            <div className="engineering-results-grid">
              <PredictionValue label="Additional peak demand" value={power(prediction.peakDemandMw)} detail={`${energy(prediction.dailyEnergyMwh)} per operating day`} />
              <PredictionValue label="Distribution loss" value={`${prediction.distributionLossPct.toFixed(1)}%`} detail={`${energy(prediction.dailyLossMwh)} lost per day`} tone={prediction.distributionLossPct > 6 ? "danger" : "normal"} />
              <PredictionValue label="Solar array required" value={`${prediction.recommendedPanels.toLocaleString("en-IN")} panels`} detail={`${prediction.requiredSolarMw.toFixed(2)} MWp at 550 W`} tone="solar" />
              <PredictionValue label="Rooftop / ground split" value={`${prediction.rooftopPanels.toLocaleString("en-IN")} / ${prediction.groundPanels.toLocaleString("en-IN")}`} detail="Panels based on available roof area" />
              <PredictionValue label="Battery recommendation" value={`${prediction.recommendedBatteryMwh.toFixed(1)} MWh`} detail="Two-hour peak-load support" />
              <PredictionValue label="Transformer requirement" value={`${prediction.transformerUnits} × 1.25 MVA`} detail={prediction.reserveMarginMw < 0 ? "Campus network upgrade required" : `${power(prediction.reserveMarginMw)} estimated margin`} tone={prediction.reserveMarginMw < 0 ? "danger" : "safe"} />
              <PredictionValue label="Annual consumption" value={`${prediction.annualEnergyMwh.toLocaleString("en-IN", { maximumFractionDigits: 0 })} MWh`} detail="330 operating days per year" />
              <PredictionValue label="Annual energy cost" value={`₹${prediction.estimatedAnnualCostLakh.toFixed(1)} lakh`} detail="Screening estimate at ₹8.20/kWh" />
            </div>
            <div className={`engineering-advisory ${prediction.reserveMarginMw < 0 ? "is-warning" : "is-ready"}`}>
              {prediction.reserveMarginMw < 0 ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
              <span>
                <b>{prediction.reserveMarginMw < 0 ? "Network reinforcement required" : "Proposal can be supported"}</b>
                {prediction.reserveMarginMw < 0
                  ? "Add transformer capacity or reduce the design peak before construction."
                  : "The model predicts sufficient reserve capacity with the recommended solar and battery system."}
              </span>
            </div>
            <button type="button" className="engineering-primary-action" onClick={commitProposal}>
              <Plus size={16} /> Add proposal to 3D campus
            </button>
          </section>

          <section className="engineering-section">
            <div className="engineering-section-title">
              <div><Activity size={16} /><span><b>Committed campus plan</b><small>{proposals.length} proposed building{proposals.length === 1 ? "" : "s"} in this simulation</small></span></div>
            </div>
            {proposals.length ? (
              <>
                <div className="engineering-portfolio">
                  <span><b>{power(portfolio.peakDemandMw)}</b> peak demand</span>
                  <span><b>{portfolio.recommendedPanels.toLocaleString("en-IN")}</b> solar panels</span>
                  <span><b>{portfolio.recommendedBatteryMwh.toFixed(1)} MWh</b> battery</span>
                </div>
                <div className="engineering-proposal-list">
                  {proposals.map((proposal) => (
                    <div key={proposal.id}>
                      <i style={{ background: proposal.template.color }} />
                      <span><b>{proposal.name}</b><small>{proposal.siteLabel} • {proposal.floors} floors • {power(proposal.peakDemandMw)}</small></span>
                      <button type="button" onClick={() => onRemoveProposal(proposal.id)} aria-label={`Remove ${proposal.name}`}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="engineering-empty">No proposed buildings. Configure a building above and add it to the model.</div>
            )}
          </section>
        </div>
      ) : tab === "energy" ? (
        <EnergyIntelligence
          campus={campus}
          currentEnergy={currentEnergy}
          energyConfig={energyConfig}
          onEnergyConfigChange={onEnergyConfigChange}
          batterySoc={batterySoc}
          weather={weather}
        />
      ) : (
        <div className="engineering-lab-body">
          <section className="engineering-section hazard-selector-section">
            <div className="engineering-section-title">
              <div><Flame size={16} /><span><b>Electrical hazard scenario</b><small>Protection-sequence and resilience simulation</small></span></div>
              <span className="engineering-model-tag is-hazard">Training mode</span>
            </div>
            <label className="engineering-field is-wide">
              <span>Failure event</span>
              <select value={hazardType} onChange={(event) => setHazardType(event.target.value)}>
                {Object.entries(HAZARD_SCENARIOS).map(([id, item]) => (
                  <option key={id} value={id}>{item.label}</option>
                ))}
              </select>
            </label>
            <div className="hazard-description">
              <AlertTriangle size={18} />
              <span><b>{hazardScenario.asset}</b>{hazardScenario.description}</span>
            </div>
            <div className="hazard-actions">
              <button
                type="button"
                className="engineering-danger-action"
                onClick={() => onRunHazard(hazardType)}
                disabled={hazard?.phase && hazard.phase !== "idle"}
              >
                <Zap size={16} /> Start failure simulation
              </button>
              <button type="button" onClick={onResetHazard}><RotateCcw size={15} /> Reset</button>
            </div>
          </section>

          <section className="engineering-section">
            <div className="engineering-section-title">
              <div><ShieldCheck size={16} /><span><b>Protection sequence</b><small>Live state of the simulated electrical system</small></span></div>
            </div>
            <ol className={`hazard-timeline phase-${hazard?.phase || "idle"}`}>
              <li className={hazard?.phase !== "idle" ? "is-complete" : ""}><i />Sensors monitor voltage, current and equipment temperature</li>
              <li className={["warning", "fault", "tripped", "recovering"].includes(hazard?.phase) ? "is-complete" : ""}><i />Abnormal condition exceeds the configured protection threshold</li>
              <li className={["fault", "tripped", "recovering"].includes(hazard?.phase) ? "is-complete" : ""}><i />Fault is visualised and the protection relay issues a trip command</li>
              <li className={["tripped", "recovering"].includes(hazard?.phase) ? "is-complete" : ""}><i />Circuit breaker isolates the failed asset and energy flow stops</li>
              <li className={hazard?.phase === "recovering" ? "is-complete" : ""}><i />Operator inspection and controlled restoration</li>
            </ol>
          </section>

          <section className="engineering-section">
            <div className="engineering-section-title">
              <div><BatteryCharging size={16} /><span><b>System consequence</b><small>Calculated from the current campus operating state</small></span></div>
            </div>
            <div className="engineering-results-grid">
              <PredictionValue label="Current demand" value={power(currentEnergy?.demand)} />
              <PredictionValue label="Unsupported load" value={power(currentEnergy?.unmet)} tone={(currentEnergy?.unmet || 0) > 0.05 ? "danger" : "safe"} />
              <PredictionValue label="Grid state" value={currentEnergy?.gridOffline ? "Isolated" : "Connected"} />
              <PredictionValue label="Renewable supply" value={power(currentEnergy?.renewable)} />
            </div>
          </section>

          <p className="engineering-safety-note">
            <ShieldCheck size={14} />
            Educational digital-twin scenario only. It does not operate or replace real protection equipment, electrical studies or emergency procedures.
          </p>
        </div>
      )}
    </aside>
  );
}
