import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Building2,
  CloudSun,
  GraduationCap,
  Hospital,
  Landmark,
  Leaf,
  MapPin,
  RadioTower,
  Search,
  Sparkles,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import { CAMPUSES, RAJASTHAN_CAMPUSES } from "./campuses";
import SuryaMark from "./SuryaMark";

const FILTERS = ["All campuses", "Technical", "Medical", "University"];

function DashboardStat({ value, label }) {
  return (
    <div className="dashboard-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function CampusPreview({ campus }) {
  return (
    <figure className="campus-preview-image">
      <img
        src={`${import.meta.env.BASE_URL}campus-previews/${campus.id}.png`}
        alt={`${campus.shortName} campus view in the 3D energy digital twin simulator`}
      />
      <figcaption>
        <span><i /> Simulator campus view</span>
        <b>{campus.shortName} digital twin</b>
      </figcaption>
    </figure>
  );
}

function CategoryIcon({ category }) {
  if (category.includes("Medical")) return Hospital;
  if (category.includes("University")) return Landmark;
  return GraduationCap;
}

export default function CampusDashboard({ onSelect }) {
  const [filter, setFilter] = useState("All campuses");
  const [query, setQuery] = useState("");
  const openCampus = (id) => {
    if (typeof onSelect === "function") {
      onSelect(id);
      return;
    }
    window.location.hash = id;
  };
  const campuses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return CAMPUSES.filter((campus) => {
      if (campus.id === "vit-bhopal") return false;
      const matchesQuery =
        !normalized ||
        `${campus.shortName} ${campus.name} ${campus.id} ${campus.city} ${campus.region} ${campus.category}`
          .toLowerCase()
          .includes(normalized);
      const matchesFilter =
        filter === "All campuses" ||
        (filter === "Technical" && /Technical|IIT|NIT/.test(campus.category)) ||
        (filter === "Medical" && campus.category.includes("Medical")) ||
        (filter === "University" && campus.category.includes("University"));
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span><SuryaMark size={42} /></span>
          <div>
            <strong>SURYA CAMPUS NETWORK</strong>
            <small>Rajasthan Campus Energy Digital Twin Programme</small>
          </div>
        </div>
        <div className="dashboard-live">
          <i />
          <span>System online</span>
          <b>{RAJASTHAN_CAMPUSES.length} participating institutions</b>
        </div>
      </header>

      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-kicker"><Landmark size={15} /> Problem Statement 004 • Renewable campus planning</span>
          <h1><span>Campus Energy</span><em>Digital Twin Programme</em></h1>
          <p className="hero-description">
            A unified public-sector platform for planning renewable generation, monitoring campus
            demand and evaluating resilient energy scenarios across participating institutions.
          </p>
          <div className="hero-actions">
            <button
              className="hero-primary"
              onClick={() => document.getElementById("campus-catalogue")?.scrollIntoView({ behavior: "smooth" })}
            >
              View campus simulators <ArrowDown size={17} />
            </button>
            <button
              className="hero-secondary"
              onClick={() => openCampus("vit-bhopal")}
            >
              Open VIT reference model <ArrowRight size={17} />
            </button>
          </div>
          <div className="hero-capabilities" aria-label="Platform capabilities">
            <span><CloudSun size={14} /> Weather inputs</span>
            <span><Leaf size={14} /> Energy scenarios</span>
            <span><RadioTower size={14} /> Infrastructure models</span>
          </div>
          <div className="dashboard-stats">
            <DashboardStat value={CAMPUSES.length} label="Campus twins" />
            <DashboardStat value={RAJASTHAN_CAMPUSES.length} label="Rajasthan campuses" />
            <DashboardStat value="Live" label="Weather + energy" />
            <DashboardStat value="3D" label="Interactive scenarios" />
          </div>
        </div>
        <aside className="hero-programme-preview">
          <div className="programme-preview-header">
            <div>
              <span>Reference digital twin</span>
              <strong>VIT Bhopal Campus View</strong>
            </div>
            <em><i /> Operational</em>
          </div>
          <div className="programme-preview-image">
            <img
              src={`${import.meta.env.BASE_URL}campus-previews/vit-bhopal.png`}
              alt="VIT Bhopal campus energy digital twin overview"
            />
            <span>Interactive 3D campus model</span>
          </div>
          <div className="programme-preview-metrics">
            <div><Sun size={15} /><span>Solar generation<b>2.25 MW</b></span></div>
            <div><Activity size={15} /><span>Campus demand<b>8.96 MW</b></span></div>
            <div><Leaf size={15} /><span>Renewable share<b>26%</b></span></div>
          </div>
          <button type="button" onClick={() => openCampus("vit-bhopal")}>
            View reference simulator <ArrowRight size={15} />
          </button>
        </aside>
      </section>

      <section className="campus-catalogue" id="campus-catalogue">
        <div className="catalogue-toolbar" data-reveal>
          <div>
            <span className="section-kicker">Participating institutions</span>
            <h2>Campus digital twins</h2>
            <p>{campuses.length} interactive simulator{campuses.length === 1 ? "" : "s"} available</p>
          </div>
          <div className="catalogue-actions">
            <label className="campus-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search campus or city"
              />
            </label>
            <div className="campus-filters">
              {FILTERS.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={filter === item ? "is-active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="campus-grid">
          {campuses.map((campus, index) => {
            const Icon = CategoryIcon(campus);
            const renewableCapacity = campus.solarMw && campus.windMw
              ? (campus.solarMw + campus.windMw).toFixed(1)
              : null;
            return (
              <article
                key={campus.id}
                data-reveal
                className="campus-card"
                style={{
                  "--campus-accent": campus.accent,
                  "--campus-secondary": campus.secondary,
                  "--reveal-delay": `${Math.min(index, 8) * 42}ms`,
                }}
              >
                <CampusPreview campus={campus} />
                <div className="campus-card-body">
                  <span className="campus-card-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="campus-card-meta">
                    <span><Icon size={13} /> {campus.category}</span>
                    <span className="ready-badge"><Activity size={11} /> {campus.ready || "Operational twin"}</span>
                  </div>
                  <h3>{campus.shortName}</h3>
                  <p>{campus.description}</p>
                  <div className="campus-energy-strip">
                    {renewableCapacity ? (
                      <>
                        <span><Zap size={13} /><b>{renewableCapacity} MW</b> renewable</span>
                        <span><Sun size={13} />{campus.solarMw} MW solar</span>
                        <span><Wind size={13} />{campus.windMw} MW wind</span>
                      </>
                    ) : (
                      <>
                        <span><Sparkles size={13} /><b>Flagship</b> reconstruction</span>
                        <span><Activity size={13} />Live energy model</span>
                      </>
                    )}
                  </div>
                  <div className="campus-card-location">
                    <MapPin size={13} />
                    {campus.city}, {campus.region}
                  </div>
                  <button
                    type="button"
                    className="launch-campus"
                    onClick={() => openCampus(campus.id)}
                  >
                    Open 3D simulator <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!campuses.length && (
          <div className="empty-campus-search">
            <Building2 size={28} />
            No campus matches this search.
          </div>
        )}
      </section>
      <footer className="dashboard-footer" data-reveal>
        Visual operational reconstructions based on official campus information and public map references.
        Not survey-grade BIM or engineering drawings.
      </footer>
    </main>
  );
}
