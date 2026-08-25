/**
 * AlertsPage — Alert Center.
 * Category-filtered alert triage with acknowledge / resolve / snooze actions,
 * expandable metadata, and per-category empty states.
 */
import { useMemo, useState } from 'react';
import { ChevronDown, Clock, ShieldCheck } from 'lucide-react';
import { useAlerts, type OpsAlertWithState } from '../context/AlertsContext';
import type { AlertCategory } from '../context/AlertsContext';
import { formatDateTime, formatTime } from '../lib/format';

const CATEGORY_COLOR: Record<AlertCategory, string> = {
  critical: '#f87171',
  warning: '#fbbf24',
  info: '#f59e0b',
  optimization: '#34d399',
};

function categoryLabel(c: AlertCategory): string {
  switch (c) {
    case 'critical': return 'CRITICAL';
    case 'warning': return 'WARNING';
    case 'info': return 'INFORMATION';
    case 'optimization': return 'OPTIMIZATION';
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Filter = 'all' | AlertCategory;

interface WiredAlertCardProps {
  alert: OpsAlertWithState;
  api: ReturnType<typeof useAlerts>;
}

function WiredAlertCard({ alert, api }: WiredAlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const color = CATEGORY_COLOR[alert.category];
  const dimmed = alert.status === 'acknowledged' || alert.status === 'snoozed';

  const handleResolve = () => {
    if (resolving) return;
    setResolving(true);
    // Inline confirmation beat before the store removes the item
    setTimeout(() => {
      api.resolve(alert.id);
      setResolving(false);
    }, 700);
  };

  return (
    <article className="relative rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden transition-opacity duration-200">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} aria-hidden="true" />

      <div className={`pl-4 pr-3 py-3 ${dimmed ? 'opacity-55' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${alert.title}`}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="ops-chip !py-0.5 !text-[9px]"
                style={{ color, borderColor: `${color}55`, background: `${color}14` }}
              >
                {categoryLabel(alert.category)}
              </span>
              {alert.status === 'acknowledged' && (
                <span className="ops-chip ops-chip-amber !py-0.5 !text-[9px]">ACKNOWLEDGED</span>
              )}
              {alert.status === 'snoozed' && (
                <span className="ops-chip ops-chip-cyan !py-0.5 !text-[9px]">
                  SNOOZED UNTIL {alert.snoozedUntil ? formatTime(new Date(alert.snoozedUntil)) : '—'}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-white/90 leading-snug">{alert.title}</p>
            <p className="mt-1 text-[12px] text-white/55 leading-relaxed">{alert.detail}</p>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[10px] text-white/40">
              {alert.metricLabel && (
                <span className="num">
                  {alert.metricLabel}:{' '}
                  <b className="text-white/70">{alert.value?.toFixed(1)}{alert.unit ?? ''}</b>
                  {alert.threshold !== undefined && (
                    <> · threshold <b className="text-white/70">{alert.threshold}{alert.unit ?? ''}</b></>
                  )}
                </span>
              )}
              <span>{relativeTime(alert.createdAt)}</span>
            </div>
          </button>

          <ChevronDown
            size={15}
            className={`shrink-0 mt-1 text-white/30 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
            {([
              ['ALERT ID', alert.id],
              ['CATEGORY', categoryLabel(alert.category)],
              ['STATUS', alert.status.toUpperCase()],
              ['METRIC', alert.metricLabel ?? '—'],
              ['VALUE', alert.value !== undefined ? `${alert.value.toFixed(2)}${alert.unit ?? ''}` : '—'],
              ['THRESHOLD', alert.threshold !== undefined ? `${alert.threshold}${alert.unit ?? ''}` : '—'],
              ['UNIT', alert.unit ?? '—'],
              ['CREATED AT', formatDateTime(new Date(alert.createdAt))],
            ] as Array<[string, string]>).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <div className="tech-label">{k}</div>
                <div className="num text-[11px] text-white/75 truncate" title={v}>{v}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 flex-wrap border-t border-white/[0.06] pt-2.5">
          {resolving ? (
            <span role="status" className="text-[11px] font-semibold" style={{ color }}>
              Resolved — removing from active queue…
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => api.acknowledge(alert.id)}
                aria-label={`Acknowledge alert ${alert.title}`}
                className="ops-btn !text-[10px] !py-1 !px-2.5"
              >
                ACKNOWLEDGE
              </button>
              <button
                type="button"
                onClick={handleResolve}
                aria-label={`Resolve alert ${alert.title}`}
                className="ops-btn !text-[10px] !py-1 !px-2.5"
              >
                RESOLVE
              </button>
              <span className="ml-auto hidden sm:flex items-center gap-1.5 text-[10px] text-white/35">
                <Clock size={10} /> SNOOZE
              </span>
              <button
                type="button"
                onClick={() => api.snooze(alert.id, 30)}
                aria-label={`Snooze alert ${alert.title} for 30 minutes`}
                className="ops-btn !text-[10px] !py-1 !px-2"
              >
                30 MIN
              </button>
              <button
                type="button"
                onClick={() => api.snooze(alert.id, 120)}
                aria-label={`Snooze alert ${alert.title} for 2 hours`}
                className="ops-btn !text-[10px] !py-1 !px-2"
              >
                2 H
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AlertsPage() {
  const alertsApi = useAlerts();
  const [filter, setFilter] = useState<Filter>('all');

  const tabs: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'all', label: 'ALL', count: alertsApi.activeCount },
    { key: 'critical', label: 'CRITICAL', count: alertsApi.counts.critical },
    { key: 'warning', label: 'WARNING', count: alertsApi.counts.warning },
    { key: 'info', label: 'INFORMATION', count: alertsApi.counts.info },
    { key: 'optimization', label: 'OPTIMIZATION', count: alertsApi.counts.optimization },
  ];

  const visible = useMemo(
    () => alertsApi.alerts.filter(a => filter === 'all' || a.category === filter),
    [alertsApi.alerts, filter],
  );

  const chipTone = (key: Filter): string => {
    if (filter !== key) return '';
    switch (key) {
      case 'critical': return 'ops-chip-red';
      case 'warning': return 'ops-chip-amber';
      case 'info': return 'ops-chip-cyan';
      case 'optimization': return 'ops-chip-green';
      default: return 'ops-chip-cyan';
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="tech-label mb-1.5">ALERT CENTER</div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">Alerts</h1>
          <p className="text-[12px] text-white/45 mt-1 max-w-2xl">
            Live operational alerts derived from campus telemetry and your configured thresholds.
            Acknowledge to claim triage, snooze to defer, resolve to clear.
          </p>
        </div>
        <span className={`ops-chip num ${alertsApi.activeCount > 0 ? 'ops-chip-red' : 'ops-chip-green'}`}>
          <ShieldCheck size={11} />
          {alertsApi.activeCount} ACTIVE
        </span>
      </div>

      {/* ── Summary header chips ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.filter(t => t.key !== 'all').map(t => (
          <span key={t.key} className="ops-chip num">
            <span
              className="status-dot-green"
              style={{ background: CATEGORY_COLOR[t.key as AlertCategory], boxShadow: `0 0 6px ${CATEGORY_COLOR[t.key as AlertCategory]}66` }}
              aria-hidden="true"
            />
            {t.label} {t.count}
          </span>
        ))}
      </div>

      {/* ── Category filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 ops-scroll" role="tablist" aria-label="Alert category filters">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={`ops-chip !px-3 !py-1.5 transition-colors shrink-0 ${chipTone(t.key)}`}
          >
            {t.label}
            <span className="num ml-1 opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Alert list ── */}
      {visible.length === 0 ? (
        <section className="ops-panel-flat p-10 text-center">
          <ShieldCheck size={40} className="mx-auto text-emerald-400/70" />
          <p className="text-white/60 mt-3 font-medium text-[13px]">
            No alerts in this category — system operating within limits.
          </p>
          <p className="text-[11px] text-white/35 mt-1">
            Alerts appear automatically when live metrics cross configured thresholds.
          </p>
        </section>
      ) : (
        <section className="space-y-2.5" aria-label="Active alerts">
          {visible.map(a => (
            <WiredAlertCard key={a.id} alert={a} api={alertsApi} />
          ))}
        </section>
      )}
    </div>
  );
}
