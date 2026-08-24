/**
 * GanttTimeline — 24-hour operational timeline (SVG).
 * Rows of horizontal blocks communicating scheduled operations.
 * Used by the Scheduler and Gantt Timeline pages.
 */
export interface GanttRow {
  id: string;
  label: string;
  color: string;
  blocks: Array<{ start: number; end: number; label?: string }>;
}

interface GanttTimelineProps {
  rows: GanttRow[];
  /** Highlight marker at this hour (e.g., "now"), 0–24 */
  nowHour?: number | null;
  onBlockClick?: (rowId: string, blockIndex: number) => void;
}

const ROW_H = 34;
const LABEL_W = 118;
const HOUR_W = 44; // viewBox units per hour

export function GanttTimeline({ rows, nowHour, onBlockClick }: GanttTimelineProps) {
  const width = LABEL_W + 24 * HOUR_W + 12;
  const height = 30 + rows.length * (ROW_H + 6) + 8;

  return (
    <div className="chart-scroll">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: `${width * 0.72}px` }}
        className="block h-auto w-full min-w-[720px]"
        role="img"
        aria-label="24 hour operations timeline"
      >
        {/* Hour grid */}
        {Array.from({ length: 25 }).map((_, i) => {
          const x = LABEL_W + i * HOUR_W;
          const major = i % 3 === 0;
          return (
            <g key={`grid-${i}`}>
              <line x1={x} y1={22} x2={x} y2={height - 4} stroke="rgba(224,197,160,0.08)" strokeWidth="1" />
              {major && (
                <text x={x} y={14} textAnchor="middle" fill="rgba(243,237,228,0.4)" fontSize="10" fontFamily="JetBrains Mono, monospace">
                  {String(i).padStart(2, '0')}:00
                </text>
              )}
            </g>
          );
        })}

        {/* Now marker */}
        {nowHour !== null && nowHour !== undefined && (
          <g>
            <line
              x1={LABEL_W + nowHour * HOUR_W} y1={22} x2={LABEL_W + nowHour * HOUR_W} y2={height - 4}
              stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8"
            />
            <circle cx={LABEL_W + nowHour * HOUR_W} cy={22} r="3" fill="#fbbf24" />
          </g>
        )}

        {/* Rows */}
        {rows.map((row, r) => {
          const y = 28 + r * (ROW_H + 6);
          return (
            <g key={row.id}>
              <text
                x={0} y={y + ROW_H / 2 + 4}
                fill="rgba(243,237,228,0.55)" fontSize="10.5" fontWeight="700"
                fontFamily="JetBrains Mono, monospace" letterSpacing="1"
              >
                {row.label.toUpperCase()}
              </text>

              {row.blocks.map((b, bi) => {
                const bx = LABEL_W + b.start * HOUR_W;
                const bw = Math.max(4, (b.end - b.start) * HOUR_W);
                const clickable = Boolean(onBlockClick);
                return (
                  <g
                    key={bi}
                    onClick={clickable ? () => onBlockClick?.(row.id, bi) : undefined}
                    className={clickable ? 'cursor-pointer' : undefined}
                    role={clickable ? 'button' : undefined}
                    aria-label={clickable ? `${row.label} ${b.label ?? ''} ${fmtHour(b.start)} to ${fmtHour(b.end)}` : undefined}
                  >
                    <rect
                      x={bx} y={y} width={bw} height={ROW_H - 8} rx="5"
                      fill={row.color} opacity="0.16"
                      stroke={row.color} strokeOpacity="0.55" strokeWidth="1"
                    />
                    {bw > 56 && (
                      <text
                        x={bx + bw / 2} y={y + ROW_H / 2 - 1}
                        textAnchor="middle" fill={row.color} fontSize="9"
                        fontWeight="600" fontFamily="Inter, sans-serif"
                      >
                        {b.label ?? fmtRange(b.start, b.end)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function fmtHour(h: number): string {
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
}

function fmtRange(start: number, end: number): string {
  return `${fmtHour(start)}–${fmtHour(end)}`;
}
