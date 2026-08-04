/**
 * LandingSections — scroll-triggered reveal sections below the hero.
 * Includes: Desert Transition, How It Works, Live Stats, Compliance Badges, CTA Footer.
 * Uses Framer Motion for professional scroll-triggered animations.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Cloud,
  Cpu,
  Zap,
  Sun,
  Wind,
  Battery,
  Shield,
  IndianRupee,
  Leaf,
  Building2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

// ─── Scroll Reveal Wrapper (Framer Motion) ───
export function RevealSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Counter ───
function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2000 }: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(target * eased);
      setCount(start);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <div ref={ref} className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// ─── Background Glow Accent ───
export function BackgroundGlow({ color = 'emerald', size = '300px', top = '0%', left = '0%', opacity = 0.15, blur = '80px', animate = true }) {
  const colorMap = {
    emerald: 'bg-vpp-emerald',
    teal: 'bg-vpp-accent-teal',
    blue: 'bg-vpp-blue',
    amber: 'bg-vpp-accent-gold',
    orange: 'bg-vpp-accent-orange',
    peach: 'bg-hero-sunset-peach',
    sky: 'bg-hero-sunlight',
    sunlight: 'bg-hero-sunlight',
    sand: 'bg-desert-transition-sand',
    dune: 'bg-desert-transition-dune',
    clay: 'bg-desert-transition-sand',
    dusk: 'bg-vpp-deep-night',
  };
  
  return (
    <motion.div 
      animate={animate ? { scale: [1, 1.1, 1], opacity: [opacity, opacity * 1.3, opacity] } : {}}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute pointer-events-none rounded-full ${colorMap[color as keyof typeof colorMap]}`}
      style={{
        width: size,
        height: size,
        top,
        left,
        opacity,
        filter: `blur(${blur})`,
        zIndex: 0,
      }}
    />
  );
}

// ─── Terrain Silhouette Motif ───
function TerrainDivider({ color = "#2d2317", opacity = 0.8, flip = false }) {
  return (
    <div className={`absolute inset-x-0 bottom-0 h-48 pointer-events-none overflow-hidden ${flip ? 'rotate-180 top-0 bottom-auto' : ''}`}>
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          d="M0,192L80,170.7C160,149,320,107,480,106.7C640,107,800,149,960,170.7C1120,192,1280,192,1360,192L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          fill={color}
          fillOpacity={opacity}
        />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════

export function DesertTransitionBand() {
  return (
    <section className="relative overflow-hidden">
      {/* Blended Transition: Hero to Desert */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#101214] via-[#2a1e14] to-[#f3e1bf]" />
      
      <BackgroundGlow color="orange" size="600px" top="-20%" left="-10%" opacity={0.1} blur="140px" animate={false} />
      <BackgroundGlow color="clay" size="500px" top="20%" left="70%" opacity={0.07} blur="160px" animate={false} />
      <BackgroundGlow color="sunlight" size="400px" top="60%" left="10%" opacity={0.2} blur="120px" animate={false} />

      <TerrainDivider color="#2d2317" opacity={0.9} />

      <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-40 text-center">
        <RevealSection className="mx-auto max-w-2xl">
          <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-[0.28em]">Desert Transition</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            From the <span className="text-sunset-gradient">sunset</span> into the control layer
          </h2>
          <p className="mt-6 text-base md:text-lg text-white/72 leading-relaxed font-light">
            The hero fades into warm dunes, then into the live energy model. The motion stays continuous, so the landing page feels like one long scene instead of separate blocks.
          </p>
        </RevealSection>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { title: 'Sun-washed context', text: 'A warm buffer softens the handoff from the hero to the operational dashboard.' },
            { title: 'Dune-shaped flow', text: 'Wave layers and blurred glows create a natural valley between sections.' },
            { title: 'Oasis signal', text: 'The next sections rise out of the sand with calmer contrast and clearer hierarchy.' },
          ].map((item, index) => (
            <RevealSection key={item.title} delay={index * 0.15}>
              <div className="vpp-glass-warm p-8 text-left h-full flex flex-col">
                <div className="mb-4 h-1 w-12 rounded-full bg-[#d97706]" />
                <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/62 font-light">{item.text}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      icon: <Cloud size={28} className="text-vpp-accent-teal" />,
      title: 'AI Forecasts Weather',
      desc: 'Machine learning reads cloud cover, wind speed, and demand patterns to predict energy supply 5 minutes ahead.',
      accent: 'bg-vpp-accent-teal/10',
    },
    {
      icon: <Cpu size={28} className="text-vpp-emerald" />,
      title: 'Optimizes Every Building',
      desc: 'The VPP engine decides: charge battery now, shift non-critical loads, or dispatch solar to the grid for maximum savings.',
      accent: 'bg-vpp-emerald/10',
    },
    {
      icon: <Zap size={28} className="text-vpp-accent-orange" />,
      title: 'Dispatches in Real-Time',
      desc: 'Decisions execute every 5 minutes with WebSocket streaming. Technicians see AI reasoning in plain English.',
      accent: 'bg-vpp-accent-orange/10',
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Seamless Transition: Dark Forest Green */}
      <div className="absolute inset-0 bg-vpp-deep-forest" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#7a5d3a]/20 to-transparent" />
      
      <BackgroundGlow color="teal" size="500px" top="20%" left="-10%" opacity={0.1} blur="120px" />
      <BackgroundGlow color="emerald" size="400px" top="50%" left="70%" opacity={0.08} blur="140px" />

      <div className="relative max-w-6xl mx-auto">
        <RevealSection className="text-center mb-16">
          <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            From Weather to <span className="text-sunset-gradient">Smart Dispatch</span>
          </h2>
          <p className="text-white/50 mt-6 max-w-2xl mx-auto text-base font-light leading-relaxed">
            Three steps from raw weather data to optimized energy decisions across your entire campus.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <RevealSection key={i} delay={i * 0.2}>
              <div className="vpp-glass p-8 group h-full relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${step.accent} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute top-4 right-4 text-4xl font-black text-white/5 group-hover:text-vpp-accent-gold/10 transition-colors duration-300">
                  0{i + 1}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-vpp-accent-gold transition-colors duration-300">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed font-light">{step.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LiveStatsSection() {
  const stats = [
    {
      icon: <IndianRupee size={22} className="text-vpp-accent-gold" />,
      value: 12400,
      prefix: 'INR ',
      suffix: '',
      label: 'Cost Savings',
      sub: 'Lifetime logged savings',
      animate: true,
    },
    {
      icon: <Leaf size={22} className="text-vpp-accent-teal" />,
      value: 84,
      prefix: '',
      suffix: '%',
      label: 'Self-Consumption',
      sub: 'Of renewable energy on-site',
      animate: true,
    },
    {
      icon: <Building2 size={22} className="text-vpp-emerald" />,
      value: 4,
      prefix: '',
      suffix: '',
      label: 'Buildings Protected',
      sub: 'Critical loads always powered',
      animate: false,
    },
    {
      icon: <Shield size={22} className="text-vpp-accent-orange" />,
      value: 0,
      prefix: '',
      suffix: ' kg CO₂',
      label: 'Carbon Offset',
      sub: 'Vs. grid-only operation',
      animate: false,
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-vpp-deep-night" />
      <div className="absolute inset-0 bg-gradient-to-b from-vpp-deep-forest via-vpp-deep-night to-vpp-deep-night" />
      
      <BackgroundGlow color="emerald" size="600px" top="-10%" left="30%" opacity={0.06} blur="160px" />
      <BackgroundGlow color="teal" size="400px" top="40%" left="-10%" opacity={0.04} blur="140px" />

      <div className="relative max-w-6xl mx-auto">
        <RevealSection className="text-center mb-16">
          <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">Live Performance</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            Numbers That <span className="text-sunset-gradient">Speak</span>
          </h2>
        </RevealSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <RevealSection key={i} delay={i * 0.15}>
              <div className="vpp-glass p-8 text-center group">
                <div className="flex items-center justify-center mb-4 text-white/30 group-hover:text-vpp-accent-gold transition-colors duration-300">
                  {stat.icon}
                </div>
                {stat.animate ? (
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                ) : (
                  <div className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                    {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
                  </div>
                )}
                <p className="text-sm font-semibold text-white/80 mt-3">{stat.label}</p>
                <p className="text-[11px] text-white/30 mt-1 font-light">{stat.sub}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComplianceBadgesSection() {
  const badges = [
    { icon: <Shield size={18} />, text: 'RERC Compliant', sub: 'Third Amendment 2025' },
    { icon: <Zap size={18} />, text: 'Net Metering Ready', sub: 'VNM & GNM Credits' },
    { icon: <Sun size={18} />, text: 'Microgrid Ready', sub: 'Island Mode Capable' },
    { icon: <Wind size={18} />, text: '100% Renewable', sub: 'Solar + Wind Hybrid' },
    { icon: <Building2 size={18} />, text: 'Made in India', sub: 'VPP Platform' },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-vpp-deep-night" />
      <div className="absolute inset-0 bg-gradient-to-b from-vpp-deep-night via-vpp-deep-teal to-vpp-deep-night" />
      
      <BackgroundGlow color="emerald" size="500px" top="-10%" left="60%" opacity={0.05} blur="140px" />
      <BackgroundGlow color="teal" size="400px" top="40%" left="-10%" opacity={0.04} />

      <div className="relative max-w-6xl mx-auto">
        <RevealSection className="text-center mb-16">
          <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">Built for India</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            Compliance & <span className="text-sunset-gradient">Standards</span>
          </h2>
        </RevealSection>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {badges.map((badge, i) => (
            <RevealSection key={i} delay={i * 0.1}>
              <div className="vpp-glass px-8 py-5 flex items-center gap-5 group">
                <div className="text-vpp-accent-gold group-hover:scale-110 transition-transform duration-300">
                  {badge.icon}
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-vpp-accent-gold transition-colors duration-300">{badge.text}</span>
                  <span className="text-[10px] text-white/30 font-light">{badge.sub}</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTAFooter() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-vpp-deep-night" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.12),_transparent_40%),linear-gradient(180deg,rgba(10,13,15,1),rgba(45,35,23,0.9))]" />
      
      <BackgroundGlow color="orange" size="600px" top="-10%" left="20%" opacity={0.12} blur="140px" />
      <BackgroundGlow color="sunlight" size="400px" top="40%" left="70%" opacity={0.08} blur="120px" />

      <TerrainDivider color="#d97706" opacity={0.15} />

      <div className="relative max-w-4xl mx-auto text-center">
        <RevealSection>
          <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">Get Started</span>
          <h2 className="text-3xl md:text-6xl font-extrabold text-white mt-6 tracking-tight leading-tight">
            Ready to Put Your Campus<br />
            on <span className="text-sunset-gradient">Autopilot</span>?
          </h2>
          <p className="text-white/50 mt-8 text-base md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
            Schedule a live demo and see the AI optimize your solar, wind, and battery in real-time.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <button
              className="text-white px-10 py-4 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-vpp-accent-gold/20"
              style={{
                background: 'linear-gradient(135deg, #ff9f1c, #d97706)',
              }}
            >
              Book a Demo
              <ArrowRight size={16} />
            </button>
            <Link
              to="/dashboard"
              className="text-white/90 px-10 py-4 rounded-full text-sm font-bold transition-all duration-300 border border-white/20 backdrop-blur-md hover:bg-white/10 hover:text-white"
            >
              Explore Platform
            </Link>
          </div>
        </RevealSection>

        <div className="mt-32 pt-10 border-t border-white/5 relative z-10">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-medium">
            Hybrid Renewable VPP — Rajasthan DTE Smart Energy Platform
          </p>
        </div>
      </div>
    </section>
  );
}

export function ScrollIndicator() {
  return (
    <motion.div 
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
    >
      <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Scroll</span>
      <ChevronDown size={16} className="text-white/35" />
    </motion.div>
  );
}
