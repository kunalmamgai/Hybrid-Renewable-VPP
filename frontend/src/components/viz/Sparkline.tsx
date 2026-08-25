/**
 * Sparkline — dependency-free inline SVG micro-chart.
 */
interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export function Sparkline({
  values,
  width = 88,
  height = 26,
  stroke = '#f59e0b',
  fill,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (!values || values.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = strokeWidth;
  const stepX = (width - pad * 2) / (values.length - 1);

  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M${pts.join(' L')}`;
  const area = `${line} L${(width - pad).toFixed(1)},${height} L${pad},${height} Z`;
  const gradientId = `spark-${stroke.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg width={width} height={height} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill ?? stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={fill ?? stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
