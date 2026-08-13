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
  Cog,
  Battery,
  Building2,
  IndianRupee,
  Leaf,
  Target,
  BatteryCharging,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { SuryaMark } from '../common/SuryaMark';

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
function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2000, decimals = 0 }: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(target * eased);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  const display =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.round(count).toLocaleString();

  return (
    <div ref={ref} className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
      {prefix}{display}{suffix}
    </div>
  );
}

// ─── Background Glow Accent ───
export function BackgroundGlow({ color = 'emerald', size = '300px', top = '0%', left = '0%', opacity = 0.15, blur = '80px', animate = true }) {
  const colorMap = {
    emerald: 'bg-vpp-emerald',
    teal: 'bg-vpp-accent-teal',
    orange: 'bg-vpp-accent-orange',
    sky: 'bg-hero-sunlight',
    sunlight: 'bg-hero-sunlight',
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

// ═══════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════

export function HowItWorksSection() {
  const steps = [
    {
      icon: <Cloud size={22} className="text-vpp-accent-teal" />,
      title: 'Weather Forecast',
      desc: 'Cloud, wind & demand read 5 min ahead',
    },
    {
      icon: <Cpu size={22} className="text-vpp-emerald" />,
      title: 'AI Prediction',
      desc: 'Supply & load forecast with confidence',
    },
    {
      icon: <Cog size={22} className="text-vpp-accent-gold" />,
      title: 'Optimization Engine',
      desc: 'Cost-weighted plan for every building',
    },
    {
      icon: <Battery size={22} className="text-vpp-accent-orange" />,
      title: 'Battery Dispatch',
      desc: 'Charge, discharge or hold reserve',
    },
    {
      icon: <Building2 size={22} className="text-vpp-blue" />,
      title: 'Campus Balance',
      desc: 'Critical loads stay powered',
    },
  ];

  return (
    <section className="relative py-20 px-6 overflow-hidden">
      <BackgroundGlow color="teal" size="500px" top="20%" left="-10%" opacity={0.08} blur="140px" />
      <BackgroundGlow color="emerald" size="400px" top="50%" left="70%" opacity={0.06} blur="140px" />

      <div className="relative max-w-6xl mx-auto">
        <RevealSection className="text-center mb-12">
          <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            From Weather to <span className="text-sunset-gradient">Smart Dispatch</span>
          </h2>
          <p className="text-white/50 mt-6 max-w-2xl mx-auto text-base font-light leading-relaxed">
            One continuous decision pipeline — from raw weather data to a protected campus.
          </p>
        </RevealSection>

        <RevealSection delay={0.15}>
          <div className="vpp-sheet relative p-8 md:p-12">
            {/* faint connector line behind the icons */}
            <div className="hidden lg:block absolute top-[4.9rem] left-12 right-12 h-px bg-gradient-to-r from-transparent via-vpp-accent-gold/20 to-transparent" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-0">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="relative flex items-center gap-4 lg:flex-col lg:items-center lg:text-center lg:px-2"
                >
                  {/* pulsing gold connector dot */}
                  {i < steps.length - 1 && (
                    <span
                      className="flow-dot hidden lg:block absolute top-7 -right-1.5 z-10 w-2 h-2 rounded-full bg-vpp-accent-gold"
                      style={{ animationDelay: `${i * 0.35}s` }}
                    />
                  )}
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{step.title}</h3>
                    <p className="text-xs text-white/45 font-light mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

export function LiveStatsSection() {
  const stats = [
    {
      icon: <IndianRupee size={20} className="text-vpp-accent-gold" />,
      value: 12400,
      prefix: 'INR ',
      suffix: '',
      decimals: 0,
      label: 'Cost Savings',
      sub: 'Lifetime logged savings',
    },
    {
      icon: <Target size={20} className="text-vpp-accent-teal" />,
      value: 96,
      prefix: '',
      suffix: '%',
      decimals: 0,
      label: 'Forecast Accuracy',
      sub: '5-min ahead AI predictions',
    },
    {
      icon: <BatteryCharging size={20} className="text-vpp-emerald" />,
      value: 62,
      prefix: '',
      suffix: '%',
      decimals: 0,
      label: 'Grid Independence',
      sub: 'Of demand covered on-site',
    },
    {
      icon: <Leaf size={20} className="text-vpp-accent-orange" />,
      value: 12.4,
      prefix: '',
      suffix: ' t',
      decimals: 1,
      label: 'CO₂ Avoided',
      sub: 'Vs. grid-only operation',
    },
  ];

  return (
    <section className="relative py-20 px-6 overflow-hidden">
      <BackgroundGlow color="emerald" size="600px" top="-10%" left="30%" opacity={0.06} blur="160px" />
      <BackgroundGlow color="teal" size="400px" top="40%" left="-10%" opacity={0.04} blur="140px" />

      <div className="relative max-w-6xl mx-auto">
        <RevealSection className="text-center mb-12">
          <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">Live Performance</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            Numbers That <span className="text-sunset-gradient">Speak</span>
          </h2>
        </RevealSection>

        {/* One connected HUD strip — hairline dividers, no floating boxes */}
        <RevealSection delay={0.15}>
          <div className="vpp-sheet grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[#0f1613]/80 p-8 md:p-10 text-center group">
                <div className="flex items-center justify-center mb-4 text-white/30 group-hover:text-vpp-accent-gold transition-colors duration-300">
                  {stat.icon}
                </div>
                <AnimatedCounter
                  target={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
                <p className="text-sm font-semibold text-white/80 mt-3">{stat.label}</p>
                <p className="text-[11px] text-white/30 mt-1 font-light">{stat.sub}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

export function CTAFooter() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <BackgroundGlow color="orange" size="600px" top="-10%" left="20%" opacity={0.12} blur="140px" />
      <BackgroundGlow color="sunlight" size="400px" top="40%" left="70%" opacity={0.08} blur="120px" />

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
            <Link
              to="/signup"
              className="text-white px-10 py-4 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-vpp-accent-gold/20"
              style={{
                background: 'linear-gradient(135deg, #ff9f1c, #d97706)',
              }}
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="text-white/90 px-10 py-4 rounded-full text-sm font-bold transition-all duration-300 border border-white/20 backdrop-blur-md hover:bg-white/10 hover:text-white"
            >
              Explore Platform
            </Link>
          </div>
        </RevealSection>

        {/* Compact footer bar */}
        <div className="mt-24 pt-8 border-t border-white/8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <Link
            to="/"
            aria-label="Go to SURYA home page"
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          >
            <SuryaMark size={34} className="shrink-0 drop-shadow-[0_0_8px_rgba(217,119,6,0.3)]" />
            <div className="text-left">
              <div className="text-sm font-bold text-white">
                SURYA
              </div>
              <div className="text-[10px] text-white/35 tracking-wide">Rajasthan DTE Smart Energy Platform</div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/45">
            <Link to="/dashboard" className="hover:text-amber-200 transition-colors duration-300">Platform</Link>
            <Link to="/energy-flow" className="hover:text-amber-200 transition-colors duration-300">Live Demo</Link>
            <Link to="/decisions" className="hover:text-amber-200 transition-colors duration-300">Impact</Link>
            <Link to="/settings" className="hover:text-amber-200 transition-colors duration-300">Settings</Link>
          </div>

          <p className="text-[10px] text-white/25 uppercase tracking-[0.3em] font-medium">
            © 2026 Rajasthan DTE
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
