/**
 * ReportsPage — period summary + statutory export console.
 * Aggregated export stats from the backend, CSV/PDF statutory downloads with
 * per-button loading/error states, and factual reporting notes.
 */
import { useState } from 'react';
import {
  Battery, Download, FileSpreadsheet, FileText, IndianRupee,
  Leaf, Percent, PlugZap, RefreshCw, Sun, Wind,
} from 'lucide-react';
import { MetricTile } from '../components/viz/MetricTile';
import { useApiStats } from '../hooks/useApiStats';
import { downloadCSV, downloadPDF } from '../services/apiClient';
import {
  formatCO2, formatINR, formatKwh, formatDateTime,
} from '../lib/format';

type ExportKind = 'csv' | 'pdf';

export default function ReportsPage() {
  const stats = useApiStats();
  const [dlStatus, setDlStatus] = useState<Record<ExportKind, 'idle' | 'loading' | 'error'>>({
    csv: 'idle', pdf: 'idle',
  });
  const [dlError, setDlError] = useState<Record<ExportKind, string>>({ csv: '', pdf: '' });

  const handleDownload = async (kind: ExportKind) => {
    setDlStatus(s => ({ ...s, [kind]: 'loading' }));
    setDlError(e => ({ ...e, [kind]: '' }));
    try {
      await (kind === 'csv' ? downloadCSV() : downloadPDF());
      setDlStatus(s => ({ ...s, [kind]: 'idle' }));
    } catch (err) {
      setDlStatus(s => ({ ...s, [kind]: 'error' }));
      setDlError(e => ({
        ...e,
        [kind]: err instanceof Error ? err.message : `Failed to generate the ${kind.toUpperCase()} export.`,
      }));
    }
  };

  const e = stats.exportStats;
  const d = stats.decisionStats;
  const bothFailed = !!stats.error && !e && !d;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="tech-label mb-1.5">REPORTS</div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Reports</h1>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            Reporting-period aggregates and statutory exports for the hybrid renewable VPP.
          </p>
        </div>
        {e && <span className="ops-chip ops-chip-cyan num">{e.period}</span>}
      </div>

      {/* ── Global error banner (both stat endpoints failed) ── */}
      {bothFailed && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-3"
        >
          <p className="text-[12px] text-red-200">{stats.error}</p>
          <button type="button" onClick={() => void stats.refresh()} className="ops-btn shrink-0">
            <RefreshCw size={12} /> RETRY
          </button>
        </div>
      )}

      {/* ── Period summary ── */}
      <section aria-label="Reporting period summary">
        <div className="tech-label tech-label-cyan mb-2.5">PERIOD SUMMARY</div>
        {stats.loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="ops-panel !rounded-xl p-3.5 animate-pulse">
                <div className="h-2.5 w-20 bg-white/10 rounded" />
                <div className="h-6 w-24 bg-white/[0.07] rounded mt-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            <MetricTile
              label="Solar Generation"
              value={e?.total_solar_generation_kwh ?? 0}
              format={formatKwh}
              sublabel={e?.period}
              tone="amber"
              icon={<Sun size={13} />}
            />
            <MetricTile
              label="Wind Generation"
              value={e?.total_wind_generation_kwh ?? 0}
              format={formatKwh}
              sublabel={e?.period}
              tone="cyan"
              icon={<Wind size={13} />}
            />
            <MetricTile
              label="Grid Import"
              value={e?.total_grid_import_kwh ?? 0}
              format={formatKwh}
              sublabel="from utility"
              tone="neutral"
              icon={<PlugZap size={13} />}
            />
            <MetricTile
              label="Grid Export"
              value={e?.total_grid_export_kwh ?? 0}
              format={formatKwh}
              sublabel="net metering"
              tone="cyan"
              icon={<Battery size={13} />}
            />
            <MetricTile
              label="Cost Savings"
              value={e?.total_cost_savings_inr ?? 0}
              format={v => formatINR(v, true)}
              sublabel="vs grid-only baseline"
              tone="green"
              icon={<IndianRupee size={13} />}
            />
            <MetricTile
              label="Carbon Reduction"
              value={e?.total_carbon_reduction_kg ?? 0}
              format={v => formatCO2(v).replace(' CO₂', '')}
              unit=""
              sublabel="avoided emissions"
              tone="green"
              icon={<Leaf size={13} />}
            />
            <MetricTile
              label="Self-Consumption"
              value={e?.renewable_self_consumption_pct ?? 0}
              format={v => `${v.toFixed(1)}`}
              unit="%"
              sublabel="renewable used on-site"
              tone="cyan"
              icon={<Percent size={13} />}
            />
            <MetricTile
              label="Total Decisions"
              value={d?.total_decisions ?? 0}
              format={v => `${Math.round(v)}`}
              sublabel={`₹${Math.round(d?.total_savings_inr ?? 0).toLocaleString('en-IN')} saved`}
              tone="green"
              icon={<RefreshCw size={13} />}
            />
          </div>
        )}
      </section>

      {/* ── Statutory export ── */}
      <section aria-label="Statutory export">
        <div className="tech-label tech-label-cyan mb-2.5">STATUTORY EXPORT</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* CSV card */}
          <div className="ops-panel p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 grid place-items-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-300">
                <FileSpreadsheet size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white/90">CSV — Regulatory Data Sheet</p>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                  Machine-readable generation, import/export, savings and carbon ledger for the current
                  reporting period. Suitable for compliance uploads and audit reconciliation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => void handleDownload('csv')}
                disabled={dlStatus.csv === 'loading'}
                aria-label="Download statutory CSV export"
                className="ops-btn ops-btn-primary"
              >
                {dlStatus.csv === 'loading'
                  ? <LoaderSpinner />
                  : <Download size={12} />}
                DOWNLOAD CSV
              </button>
              {dlStatus.csv === 'error' && (
                <span role="alert" className="text-[11px] font-semibold text-red-300">{dlError.csv}</span>
              )}
            </div>
          </div>

          {/* PDF card */}
          <div className="ops-panel p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 grid place-items-center rounded-lg border border-amber-300/25 bg-amber-400/10 text-amber-300">
                <FileText size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white/90">PDF — Signed Summary Report</p>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                  Formatted statutory report with period KPIs, renewable shares and carbon accounting —
                  ready for filing with the distribution licensee.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => void handleDownload('pdf')}
                disabled={dlStatus.pdf === 'loading'}
                aria-label="Download statutory PDF report"
                className="ops-btn ops-btn-primary"
              >
                {dlStatus.pdf === 'loading'
                  ? <LoaderSpinner />
                  : <Download size={12} />}
                DOWNLOAD PDF
              </button>
              {dlStatus.pdf === 'error' && (
                <span role="alert" className="text-[11px] font-semibold text-red-300">{dlError.pdf}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reporting notes ── */}
      <section className="ops-panel-flat p-4" aria-label="Reporting notes">
        <div className="tech-label mb-2">REPORTING NOTES</div>
        <ul className="space-y-1.5 text-[11px] text-white/50 list-disc list-inside leading-relaxed">
          <li>Period covered: <b className="text-white/70 num">{e?.period ?? 'unavailable until the backend is reachable'}</b>.</li>
          <li>Summary generated at <b className="text-white/70 num">{formatDateTime(new Date())}</b> from live backend state.</li>
          <li>Source: SURYA backend statutory export endpoints (<span className="num">/api/v1/export/stats</span>, <span className="num">/api/v1/export/csv</span>, <span className="num">/api/v1/export/pdf</span>) — no locally computed figures.</li>
        </ul>
      </section>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
