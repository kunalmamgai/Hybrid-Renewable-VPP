import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Play,
  Zap,
  LayoutDashboard,
  Activity,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { AnimatedEnergyFlow } from './EnergyFlowIllustration';
import { WeatherWidget } from './WeatherWidget';
import { MediaShowcase } from './MediaShowcase';
import { AuthorityStrip } from './AuthorityStrip';
import {
  ScrollIndicator,
  DesertTransitionBand,
  RevealSection,
  HowItWorksSection,
  LiveStatsSection,
  ComplianceBadgesSection,
  CTAFooter,
  BackgroundGlow,
} from './LandingSections';

// Landing nav links — map straight to real dashboard routes
const navLinks = [
  { to: '/dashboard', label: 'Platform', icon: LayoutDashboard },
  { to: '/energy-flow', label: 'Live Demo', icon: Activity },
  { to: '/decisions', label: 'Impact', icon: Sparkles },
];

export function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Full-bleed hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        />

        {/* Soft overlay for text legibility */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,240,210,0.22),_transparent_36%),linear-gradient(180deg,rgba(18,12,8,0.1),rgba(16,15,14,0.16)_58%,rgba(14,12,10,0.28)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#20160f]/32 to-[#0f1012]" />
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 16, 18, 0) 0%, rgba(112, 72, 28, 0.18) 44%, rgba(16, 16, 18, 0.88) 100%)',
            clipPath: 'polygon(0 38%, 12% 28%, 24% 40%, 37% 22%, 50% 36%, 63% 18%, 78% 34%, 89% 26%, 100% 36%, 100% 100%, 0 100%)',
          }}
        />

        {/* Parallax Accents: Sunset & Sky mix */}
        <BackgroundGlow color="orange" size="600px" top="-10%" left="50%" opacity={0.16} blur="120px" />
        <BackgroundGlow color="sky" size="380px" top="10%" left="-5%" opacity={0.09} blur="100px" />
        <BackgroundGlow color="sunlight" size="500px" top="40%" left="70%" opacity={0.08} blur="110px" />

        {/* Nav Bar — floating forest-glass pill */}
        <nav className="relative z-30 mt-4 px-4 sm:px-6">
          <div className="relative max-w-7xl mx-auto">
            <div className="glass-nav-hero flex items-center justify-between gap-3 px-4 sm:px-5 py-3 animate-[fadeSlideUp_0.6s_ease-out_both]">
              {/* Logo */}
              <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    boxShadow: '0 0 18px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  <Zap className="text-white" size={17} />
                </div>
                <span className="font-bold text-white text-lg tracking-tight drop-shadow-md whitespace-nowrap">
                  Hybrid <span className="text-sunset-gradient">VPP</span>
                </span>
              </Link>

              {/* Nav links */}
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-[0.1em] text-white/85 hover:text-amber-200 hover:bg-white/10 transition-all duration-300"
                  >
                    <Icon size={15} className="text-vpp-accent-gold/90" />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  Book a Demo
                  <ChevronRight size={16} />
                </button>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={menuOpen}
                  className="lg:hidden p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
              <div className="glass-nav-panel absolute left-0 right-0 top-full z-40 mt-2 p-2">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-[0.1em] text-white/85 hover:text-amber-200 hover:bg-white/10 transition-all duration-200"
                  >
                    <Icon size={16} className="text-vpp-accent-gold/90" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  Book a Demo
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 text-center"
             style={{ marginTop: '-2rem' }}>
          {/* Headline — 3 lines, bold, white, large */}
          <h1
            className="text-white font-extrabold leading-[1.08] tracking-tight drop-shadow-xl"
            style={{
              fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)',
              fontFamily: "'Inter', system-ui, sans-serif",
              animation: 'fadeSlideUp 0.8s ease-out 0.3s both',
            }}
          >
            <span className="block">Charged before</span>
            <span className="block">the clouds</span>
            <span className="block">rolled in</span>
          </h1>

          {/* Subheadline */}
          <p
            className="mt-6 md:mt-8 text-white/60 font-light text-sm md:text-base max-w-xl leading-relaxed"
            style={{
              animation: 'fadeSlideUp 0.8s ease-out 0.6s both',
            }}
          >
            An AI reads the weather and balances your campus's solar, wind, and
            battery — before the grid ever has to.
          </p>

          {/* CTA buttons */}
          <div
            className="mt-10 md:mt-12 flex flex-wrap items-center justify-center gap-4"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.9s both' }}
          >
            <button
              className="text-white px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #1f120b, #0d1012)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.28)',
              }}
            >
              Book a Demo
              <ChevronRight size={16} />
            </button>
            <button
              className="text-white/90 px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:border-white/60 hover:bg-white/[0.06] hover:text-white"
              style={{
                border: '1.5px solid rgba(255, 237, 208, 0.28)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <Play size={14} />
              Watch Live Dispatch
            </button>
          </div>
        </div>

        {/* Live Weather — bottom-right */}
        <div className="absolute bottom-8 right-6 md:bottom-10 md:right-10 z-20">
          <WeatherWidget />
        </div>

        {/* Scroll indicator */}
        <ScrollIndicator />
      </section>

      {/* ===== DESERT TRANSITION BAND ===== */}
      <DesertTransitionBand />

      {/* ===== SYSTEM OVERVIEW (HOW ENERGY FLOWS) ===== */}
      <section className="relative py-32 px-6 overflow-hidden bg-vpp-deep-forest">
        {/* Blended Transition from Desert */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#7a5d3a]/20 to-transparent" />

        {/* Background Accents */}
        <BackgroundGlow color="orange" size="450px" top="-10%" left="60%" opacity={0.1} blur="110px" />
        <BackgroundGlow color="sunlight" size="500px" top="40%" left="-10%" opacity={0.05} blur="120px" />

        <div className="max-w-6xl mx-auto">
          <RevealSection className="text-center mb-16">
            <span className="text-[10px] font-bold text-vpp-accent-gold uppercase tracking-[0.25em]">System Overview</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
              How Energy <span className="text-sunset-gradient">Flows</span>
            </h2>
            <p className="text-white/50 mt-6 text-base font-light max-w-xl mx-auto leading-relaxed">
              Solar and wind feed the AI core, which optimizes battery dispatch and protects critical buildings in real-time.
            </p>
          </RevealSection>

          <div className="relative z-10">
            <AnimatedEnergyFlow />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorksSection />

      {/* ===== IN THE FIELD (PROBLEM IN CONTEXT) ===== */}
      <MediaShowcase />

      {/* ===== LIVE STATS ===== */}
      <LiveStatsSection />

      {/* ===== AUTHORITY / TRUST STRIP ===== */}
      <AuthorityStrip />

      {/* ===== COMPLIANCE BADGES ===== */}
      <ComplianceBadgesSection />

      {/* ===== CTA FOOTER ===== */}
      <CTAFooter />
    </div>
  );
}