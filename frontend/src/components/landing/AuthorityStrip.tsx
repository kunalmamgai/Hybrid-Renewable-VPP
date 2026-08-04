/**
 * AuthorityStrip — trust badges / testimonial strip section.
 * Shows compliance certifications, authority endorsements,
 * and key differentiators in a horizontal scrolling strip.
 * Standardized to VPP Glass system.
 */
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Shield,
  Globe,
  Award,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  IndianRupee,
  Leaf,
  Battery,
  Cpu,
  Zap,
} from 'lucide-react';
import { RevealSection } from './LandingSections';

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

export function AuthorityStrip() {
  return (
    <section className="relative py-24 px-6 overflow-hidden bg-vpp-deep-night">
      {/* Background Accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-vpp-deep-night via-vpp-deep-teal to-vpp-deep-night opacity-50" />
      
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <RevealSection className="text-center mb-16">
          <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">
            Trusted Technology
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            Built for <span className="text-sunset-gradient">India's Energy Future</span>
          </h2>
        </RevealSection>

        {/* Authority badges — horizontal strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {authorityItems.map((item, i) => (
            <RevealSection key={i} delay={i * 0.08}>
              <div className="vpp-glass px-6 py-4 flex items-center gap-4 group">
                <span className="text-white/30 group-hover:text-vpp-accent-gold transition-colors duration-300">
                  {item.icon}
                </span>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-vpp-accent-gold transition-colors duration-300">{item.label}</span>
                  <span className="text-[10px] text-white/30 font-light">{item.sub}</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {stats.map((stat, i) => (
            <RevealSection key={i} delay={0.4 + i * 0.08}>
              <div className="vpp-glass p-6 text-center group">
                <div className="flex items-center justify-center mb-3 text-white/20 group-hover:text-vpp-accent-gold transition-colors duration-300">
                  {stat.icon}
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</div>
                <div className="text-[10px] text-white/30 mt-2 uppercase tracking-widest font-bold">
                  {stat.label}
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Bottom quote / testimonial */}
        <RevealSection delay={1.2} className="mt-20 text-center">
          <div className="max-w-3xl mx-auto relative">
            <div className="text-6xl text-vpp-accent-gold/10 absolute -top-10 -left-4 font-serif italic">"</div>
            <p className="text-white/60 text-lg md:text-xl italic leading-relaxed font-light">
              The system predicted a 3-hour solar deficit and pre-charged our battery to 92% before
              the clouds rolled in. Not a single critical load was affected — and we saved INR 2,400
              that afternoon alone.
            </p>
            <p className="text-vpp-accent-gold/60 text-[11px] mt-6 font-bold uppercase tracking-[0.3em]">
              — Campus Energy Manager, Rajasthan DTE
            </p>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
