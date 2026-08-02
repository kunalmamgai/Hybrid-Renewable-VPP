/**
 * AnimatedEnergyFlow — SVG illustration of the VPP energy flow.
 * Shows solar panels, wind turbines, battery, and buildings with
 * animated energy flow lines connecting them.
 */
import { useEffect, useRef } from 'react';

export function AnimatedEnergyFlow() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Trigger re-render of animated strokes
    const paths = svg.querySelectorAll('.flow-line');
    paths.forEach((path) => {
      (path as SVGPathElement).style.animationPlayState = 'running';
    });
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <svg
        ref={svgRef}
        viewBox="0 0 800 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#10b981" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#14b8a6" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for flow lines */}
          <linearGradient id="grad-solar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="grad-wind" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="grad-battery" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <linearGradient id="grad-export" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Background subtle grid */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </pattern>
        <rect width="800" height="420" fill="url(#grid)" rx="20" />

        {/* ═══ SOLAR PANEL (left) ═══ */}
        <g transform="translate(80, 120)">
          {/* Solar panel body */}
          <rect x="0" y="0" width="90" height="60" rx="8" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Panel grid lines */}
          <line x1="30" y1="0" x2="30" y2="60" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
          <line x1="60" y1="0" x2="60" y2="60" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
          <line x1="0" y1="20" x2="90" y2="20" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
          <line x1="0" y1="40" x2="90" y2="40" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
          {/* Sun rays */}
          <circle cx="45" cy="-20" r="12" fill="rgba(245, 158, 11, 0.2)" filter="url(#glow-amber)" />
          <line x1="45" y1="-35" x2="45" y2="-30" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="30" y1="-30" x2="34" y2="-26" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="60" y1="-30" x2="56" y2="-26" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
          </line>
          {/* Label */}
          <text x="45" y="80" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700" fontFamily="system-ui" className="uppercase tracking-wider">Solar</text>
        </g>

        {/* ═══ WIND TURBINE (left-bottom) ═══ */}
        <g transform="translate(80, 260)">
          {/* Tower */}
          <line x1="45" y1="30" x2="45" y2="70" stroke="#14b8a6" strokeWidth="2" />
          {/* Turbine hub */}
          <circle cx="45" cy="30" r="5" fill="#14b8a6" filter="url(#glow-teal)" />
          {/* Blades */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 45 30" to="360 45 30" dur="3s" repeatCount="indefinite" />
            <line x1="45" y1="30" x2="45" y2="5" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
            <line x1="45" y1="30" x2="66" y2="42" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
            <line x1="45" y1="30" x2="24" y2="42" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Label */}
          <text x="45" y="90" textAnchor="middle" fill="#14b8a6" fontSize="11" fontWeight="700" fontFamily="system-ui" className="uppercase tracking-wider">Wind</text>
        </g>

        {/* ═══ AI BRAIN / VPP CORE (center) ═══ */}
        <g transform="translate(350, 150)">
          {/* Outer ring */}
          <circle cx="50" cy="50" r="45" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" strokeWidth="1.5" opacity="0.6">
            <animate attributeName="r" values="45;48;45" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.3;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          {/* Core circle */}
          <circle cx="50" cy="50" r="30" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" filter="url(#glow-emerald)" />
          {/* Brain/AI icon */}
          <text x="50" y="44" textAnchor="middle" fill="#10b981" fontSize="24">⚡</text>
          <text x="50" y="62" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="700" fontFamily="system-ui" className="uppercase tracking-widest">AI Core</text>
          {/* Pulsing dots around core */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 50 + Math.cos(rad) * 50;
            const y = 50 + Math.sin(rad) * 50;
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#10b981" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="3;5;3" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
          {/* Label */}
          <text x="50" y="115" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="700" fontFamily="system-ui" className="uppercase tracking-wider">VPP Engine</text>
        </g>

        {/* ═══ BATTERY (center-bottom) ═══ */}
        <g transform="translate(350, 310)">
          {/* Battery body */}
          <rect x="5" y="5" width="80" height="40" rx="6" fill="rgba(59, 130, 246, 0.12)" stroke="#3b82f6" strokeWidth="1.5" filter="url(#glow-blue)" />
          {/* Battery terminal */}
          <rect x="85" y="15" width="8" height="20" rx="2" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="1" />
          {/* Charge level */}
          <rect x="10" y="10" width="55" height="30" rx="4" fill="rgba(59, 130, 246, 0.25)">
            <animate attributeName="width" values="20;55;35;50;25;55" dur="8s" repeatCount="indefinite" />
          </rect>
          {/* Charge percentage text */}
          <text x="45" y="28" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="700" fontFamily="system-ui">
            87%
          </text>
          {/* Label */}
          <text x="50" y="62" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="700" fontFamily="system-ui" className="uppercase tracking-wider">Battery</text>
        </g>

        {/* ═══ BUILDINGS (right) ═══ */}
        {[0, 1, 2].map((i) => {
          const yPos = 60 + i * 110;
          const colors = ['#10b981', '#3b82f6', '#f59e0b'];
          const labels = ['Hostel', 'Lab', 'Office'];
          return (
            <g key={i} transform={`translate(650, ${yPos})`}>
              {/* Building shape */}
              <rect x="0" y="15" width="70" height="50" rx="4" fill={`rgba(${i === 0 ? '16,185,129' : i === 1 ? '59,130,246' : '245,158,11'},0.12)`} stroke={colors[i]} strokeWidth="1.5" />
              {/* Windows */}
              {[0, 1].map((row) =>
                [0, 1].map((col) => (
                  <rect key={`${row}-${col}`} x={8 + col * 28} y={22 + row * 20} width="18" height="12" rx="2" fill={`${colors[i]}20`} stroke={colors[i]} strokeWidth="0.5" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur={`${3 + i}s`} repeatCount="indefinite" />
                  </rect>
                ))
              )}
              {/* Label */}
              <text x="35" y="80" textAnchor="middle" fill={colors[i]} fontSize="10" fontWeight="600" fontFamily="system-ui" className="uppercase tracking-wider">{labels[i]}</text>
            </g>
          );
        })}

        {/* ═══ GRID (far right) ═══ */}
        <g transform="translate(720, 160)">
          <circle cx="20" cy="20" r="18" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="20" y="17" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="700" fontFamily="system-ui">⚡</text>
          <text x="20" y="30" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="600" fontFamily="system-ui">GRID</text>
          <text x="20" y="55" textAnchor="middle" fill="rgba(245,158,11,0.6)" fontSize="9" fontWeight="600" fontFamily="system-ui" className="uppercase tracking-wider">Export</text>
        </g>

        {/* ═══ FLOW LINES ═══ */}

        {/* Solar → AI Core */}
        <path
          d="M 170 150 C 230 150, 260 180, 350 180"
          stroke="url(#grad-solar)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="8,6"
          className="flow-line"
          filter="url(#glow-amber)"
          style={{ animation: 'dashMove 1.5s linear infinite' }}
        />

        {/* Wind → AI Core */}
        <path
          d="M 170 290 C 230 290, 260 230, 350 220"
          stroke="url(#grad-wind)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="8,6"
          className="flow-line"
          filter="url(#glow-teal)"
          style={{ animation: 'dashMove 1.5s linear infinite reverse' }}
        />

        {/* AI Core → Battery */}
        <path
          d="M 400 220 L 400 310"
          stroke="url(#grad-battery)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="8,6"
          className="flow-line"
          filter="url(#glow-emerald)"
          style={{ animation: 'dashMove 1.2s linear infinite' }}
        />

        {/* Battery → Buildings */}
        {[0, 1, 2].map((i) => {
          const bldgY = 90 + i * 110;
          return (
            <path
              key={`bat-bldg-${i}`}
              d={`M 430 330 C 500 330, 550 ${bldgY}, 650 ${bldgY}`}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6,5"
              className="flow-line"
              filter="url(#glow-blue)"
              style={{ animation: `dashMove ${1.2 + i * 0.3}s linear infinite` }}
              opacity="0.7"
            />
          );
        })}

        {/* Buildings → Grid */}
        {[0, 1, 2].map((i) => {
          const bldgY = 90 + i * 110;
          return (
            <path
              key={`bldg-grid-${i}`}
              d={`M 720 ${bldgY} C 730 ${bldgY}, 735 ${180 - i * 20}, 720 180`}
              stroke="#f59e0b"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4,6"
              className="flow-line"
              opacity="0.5"
              style={{ animation: `dashMove ${2 + i * 0.5}s linear infinite reverse` }}
            />
          );
        })}

        {/* ═══ FLOATING DATA PARTICLES ═══ */}
        {[...Array(6)].map((_, i) => {
          const x = 200 + Math.random() * 400;
          const y = 100 + Math.random() * 250;
          return (
            <circle
              key={`particle-${i}`}
              cx={x}
              cy={y}
              r="2"
              fill="#10b981"
              opacity="0.3"
            >
              <animate attributeName="cy" values={`${y};${y - 20};${y}`} dur={`${3 + i}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${3 + i}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
