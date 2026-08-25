/**
 * AuthorityStrip — trust badges / testimonial strip section.
 * Shows compliance certifications, authority endorsements,
 * and key differentiators in a horizontal scrolling strip.
 * Standardized to VPP Glass system.
 */
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
    <section className="relative py-20 px-6 overflow-hidden">
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <RevealSection className="text-center mb-10">
          <span className="tech-label tech-label-cyan !text-[10px] tracking-[0.25em]">
            Trusted Technology
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            Built for <span className="text-sunset-gradient">India's Energy Future</span>
          </h2>
        </RevealSection>

        {/* Trust marquee — inline, no boxes */}
        <RevealSection>
          <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-5">
            {authorityItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-white/60 hover:text-amber-200 transition-colors duration-300">
                <span className="text-amber-300/80">{item.icon}</span>
                <span className="text-xs font-semibold text-white/85 whitespace-nowrap">{item.label}</span>
                <span className="hidden xl:block text-[10px] text-white/35 font-light">{item.sub}</span>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Stats — one connected strip */}
        <RevealSection delay={0.15} className="mt-14">
          <div className="vpp-sheet grid grid-cols-2 md:grid-cols-6 gap-px overflow-hidden">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[#0f1613]/80 p-6 text-center group">
                <div className="flex items-center justify-center mb-3 text-white/20 group-hover:text-amber-300 transition-colors duration-300">
                  {stat.icon}
                </div>
                <div className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{stat.value}</div>
                <div className="text-[10px] text-white/30 mt-2 uppercase tracking-widest font-bold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Bottom quote / testimonial */}
        <RevealSection delay={0.3} className="mt-16 text-center">
          <div className="max-w-3xl mx-auto relative">
            <div className="text-6xl text-amber-300/10 absolute -top-10 -left-4 font-serif italic">"</div>
            <p className="text-white/60 text-lg md:text-xl italic leading-relaxed font-light">
              The system predicted a 3-hour solar deficit and pre-charged our battery to 92% before
              the clouds rolled in. Not a single critical load was affected — and we saved INR 2,400
              that afternoon alone.
            </p>
            <p className="text-amber-300/60 text-[11px] mt-6 font-bold uppercase tracking-[0.3em]">
              — Campus Energy Manager, Rajasthan DTE
            </p>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
