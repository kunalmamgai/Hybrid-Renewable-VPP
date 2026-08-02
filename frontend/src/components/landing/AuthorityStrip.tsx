/**
 * AuthorityStrip — trust badges / testimonial strip section.
 * Shows compliance certifications, authority endorsements,
 * and key differentiators in a horizontal scrolling strip.
 * Uses framer-motion for smooth entrance animation.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Globe,
  Award,
  Users,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle2,
  IndianRupee,
  Leaf,
  Battery,
  Cpu,
} from 'lucide-react';

// ─── Data ───
const authorityItems = [
  { icon: <Shield size={16} />, label: 'RERC Compliant', sub: 'Third Amendment 2025' },
  { icon: <Zap size={16} />, label: 'VNM Credits Active', sub: 'Virtual Net Metering' },
  { icon: <Globe size={16} />, label: 'Open-Meteo API', sub: 'Live weather forecasting' },
  { icon: <Award size={16} />, label: 'Rajasthan DTE', sub: 'Dept. of Technical Education' },
  { icon: <Battery size={16} />, label: 'Island Mode', sub: 'Microgrid capable' },
  { icon: <Cpu size={16} />, label: 'AI Decision Loop', sub: 'Every 5 minutes' },
];

const stats = [
  { icon: <TrendingUp size={18} />, value: '97.9%', label: 'Self-Consumption' },
  { icon: <IndianRupee size={18} />, value: '₹12,400+', label: 'Cost Saved' },
  { icon: <Leaf size={18} />, value: '0 kg', label: 'CO₂ Emitted' },
  { icon: <Clock size={18} />, value: '24/7', label: 'AI Monitoring' },
  { icon: <Users size={18} />, value: '4', label: 'Buildings' },
  { icon: <CheckCircle2 size={18} />, value: '5', label: 'Decision Types' },
];

// ─── Scroll Reveal Hook ───
function useScrollReveal(threshold = 0.1) {
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

// ═══════════════════════════════════════════════════════════════
// EXPORTED COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function AuthorityStrip() {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section className="relative py-16 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a15] via-[#0d1814] to-[#0f1a15]" />

      <div ref={ref} className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-[10px] font-bold text-vpp-emerald uppercase tracking-[0.25em]">
            Trusted Technology
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Built for <span className="text-emerald-gradient">India's Energy Future</span>
          </h2>
        </motion.div>

        {/* Authority badges — horizontal strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {authorityItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-default transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(16, 185, 129, 0.1)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16, 185, 129, 0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.04)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <span className="text-emerald-400/70 group-hover:text-emerald-400 transition-colors duration-300">
                {item.icon}
              </span>
              <div>
                <span className="text-[11px] font-bold text-white/80 block">{item.label}</span>
                <span className="text-[9px] text-white/35">{item.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
              className="relative rounded-2xl p-4 text-center transition-all duration-300 group"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(16, 185, 129, 0.08)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.04)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <div className="flex items-center justify-center mb-2 text-emerald-400/60 group-hover:text-emerald-400 transition-colors duration-300">
                {stat.icon}
              </div>
              <div className="text-xl font-extrabold text-white">{stat.value}</div>
              <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom quote / testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-12 text-center"
        >
          <div className="max-w-2xl mx-auto">
            <div className="text-3xl text-emerald-500/30 mb-2">"</div>
            <p className="text-white/50 text-sm italic leading-relaxed">
              The system predicted a 3-hour solar deficit and pre-charged our battery to 92% before
              the clouds rolled in. Not a single critical load was affected — and we saved INR 2,400
              that afternoon alone.
            </p>
            <p className="text-white/25 text-[11px] mt-3 font-medium uppercase tracking-wider">
              — Campus Energy Manager, Rajasthan DTE
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
