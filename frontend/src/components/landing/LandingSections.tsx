/**
 * LandingSections — scroll-triggered reveal sections below the hero.
 * Includes: How It Works, Live Stats, Compliance Badges, CTA Footer.
 * Uses Intersection Observer for scroll-triggered animations.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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

// ─── Scroll Reveal Hook ───
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// ─── Animated Counter ───
function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2000 }: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal(0.3);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(target * eased);
      setCount(start);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-extrabold text-white">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// ─── Section Wrapper ───
function RevealSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function ScrollIndicator() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
      <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Scroll</span>
      <ChevronDown size={16} className="text-white/30" />
    </div>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      icon: <Cloud size={28} className="text-vpp-teal" />,
      title: 'AI Forecasts Weather',
      desc: 'Machine learning reads cloud cover, wind speed, and demand patterns to predict energy supply 5 minutes ahead.',
      color: 'from-teal-500/20 to-transparent',
      borderColor: 'border-teal-500/20',
      iconBg: 'bg-teal-500/15',
    },
    {
      icon: <Cpu size={28} className="text-vpp-emerald" />,
      title: 'Optimizes Every Building',
      desc: 'The VPP engine decides: charge battery now, shift non-critical loads, or dispatch solar to the grid for maximum savings.',
      color: 'from-emerald-500/20 to-transparent',
      borderColor: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
    },
    {
      icon: <Zap size={28} className="text-vpp-amber" />,
      title: 'Dispatches in Real-Time',
      desc: 'Decisions execute every 5 minutes with WebSocket streaming. Technicians see AI reasoning in plain English.',
      color: 'from-amber-500/20 to-transparent',
      borderColor: 'border-amber-500/20',
      iconBg: 'bg-amber-500/15',
    },
  ];

  return (
    <section className="relative py-24 px-6">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a1512] to-[#0f1a15]" />

      <div className="relative max-w-6xl mx-auto">
        <RevealSection className="text-center mb-16">
          <span className="text-[10px] font-bold text-vpp-emerald uppercase tracking-[0.25em]">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
            From Weather to <span className="text-emerald-gradient">Smart Dispatch</span>
          </h2>
          <p className="text-white/50 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
            Three steps from raw weather data to optimized energy decisions across your entire campus.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <RevealSection key={i} delay={i * 200}>
              <div className={`relative glass-card rounded-2xl p-6 border ${step.borderColor} hover:border-white/30 transition-all duration-300 group`}>
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#0f1a15] border border-white/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-white/60">{i + 1}</span>
                </div>
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                {/* Content */}
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
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
      icon: <IndianRupee size={22} className="text-vpp-emerald" />,
      value: 12400,
      prefix: 'INR ',
      suffix: '',
      label: 'Cost Savings',
      sub: 'Lifetime logged savings',
      animate: true,
    },
    {
      icon: <Leaf size={22} className="text-vpp-teal" />,
      value: 84,
      prefix: '',
      suffix: '%',
      label: 'Self-Consumption',
      sub: 'Of renewable energy on-site',
      animate: true,
    },
    {
      icon: <Building2 size={22} className="text-vpp-blue" />,
      value: 4,
      prefix: '',
      suffix: '',
      label: 'Buildings Protected',
      sub: 'Critical loads always powered',
      animate: false,
    },
    {
      icon: <Shield size={22} className="text-vpp-amber" />,
      value: 0,
      prefix: '',
      suffix: ' kg CO₂',
      label: 'Carbon Offset',
      sub: 'Vs. grid-only operation',
      animate: false,
    },
  ];

  return (
    <section className="relative py-20 px-6">
      {/* Darker background strip */}
      <div className="absolute inset-0 bg-[#0a1512]" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5" />

      <div className="relative max-w-6xl mx-auto">
        <RevealSection className="text-center mb-12">
          <span className="text-[10px] font-bold text-vpp-emerald uppercase tracking-[0.25em]">Live Performance</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Numbers That <span className="text-emerald-gradient">Speak</span>
          </h2>
        </RevealSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <RevealSection key={i} delay={i * 150}>
              <div className="glass-card rounded-2xl p-6 text-center group hover:shadow-emerald-glow-lg transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  {stat.icon}
                </div>
                {stat.animate ? (
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                ) : (
                  <div className="text-3xl md:text-4xl font-extrabold text-white">
                    {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
                  </div>
                )}
                <p className="text-sm font-semibold text-white/80 mt-2">{stat.label}</p>
                <p className="text-[11px] text-white/40 mt-1">{stat.sub}</p>
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
    { icon: <Battery size={18} />, text: 'Microgrid Ready', sub: 'Island Mode Capable' },
    { icon: <Sun size={18} />, text: '100% Renewable', sub: 'Solar + Wind Hybrid' },
    { icon: <Wind size={18} />, text: 'Made in India', sub: 'DTE Platform' },
  ];

  return (
    <section className="relative py-16 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1512] to-[#0f1a15]" />

      <div className="relative max-w-5xl mx-auto">
        <RevealSection className="text-center mb-10">
          <span className="text-[10px] font-bold text-vpp-emerald uppercase tracking-[0.25em]">Built for India</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Compliance & <span className="text-emerald-gradient">Standards</span>
          </h2>
        </RevealSection>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {badges.map((badge, i) => (
            <RevealSection key={i} delay={i * 100}>
              <div className="glass-card rounded-xl px-5 py-3 flex items-center gap-3 hover:border-vpp-emerald/30 transition-all duration-300 group cursor-default">
                <div className="text-vpp-emerald group-hover:scale-110 transition-transform duration-200">
                  {badge.icon}
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">{badge.text}</span>
                  <span className="text-[10px] text-white/40">{badge.sub}</span>
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
    <section className="relative py-24 px-6">
      <div className="absolute inset-0 bg-[#0f1a15]" />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent" />

      <div className="relative max-w-3xl mx-auto text-center">
        <RevealSection>
          <span className="text-[10px] font-bold text-vpp-emerald uppercase tracking-[0.25em]">Get Started</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            Ready to Put Your Campus<br />
            on <span className="text-emerald-gradient">Autopilot</span>?
          </h2>
          <p className="text-white/50 mt-4 max-w-lg mx-auto text-sm leading-relaxed">
            Schedule a live demo and see the AI optimize your solar, wind, and battery in real-time.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              className="text-white px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-emerald-glow-lg"
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
              }}
            >
              Book a Demo
              <ArrowRight size={16} />
            </button>
            <Link
              to="/dashboard"
              className="text-white/80 px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:border-white/60 hover:bg-white/[0.06] hover:text-white"
              style={{
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              Explore Platform
              <ArrowRight size={16} />
            </Link>
          </div>
        </RevealSection>

        {/* Bottom branding */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
            Hybrid Renewable VPP — Rajasthan DTE Clean Energy Platform
          </p>
        </div>
      </div>
    </section>
  );
}
