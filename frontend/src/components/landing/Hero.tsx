import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Play,
  LayoutDashboard,
  Activity,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { SuryaMark } from '../common/SuryaMark';
import { WeatherWidget } from './WeatherWidget';
import { MediaShowcase } from './MediaShowcase';
import { AuthorityStrip } from './AuthorityStrip';
import {
  ScrollIndicator,
  HowItWorksSection,
  LiveStatsSection,
  CTAFooter,
  BackgroundGlow,
} from './LandingSections';

// Landing nav links — map straight to real dashboard routes
const navLinks = [
  { to: '/dashboard', label: 'Platform', icon: LayoutDashboard },
  { to: '/energy-flow', label: 'Live Demo', icon: Activity },
  { to: '/decisions', label: 'Impact', icon: Sparkles },
];

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* One continuous surface — fixed page background spanning every section */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, #0a1014 0%, #0b1c20 16%, #0e0c09 42%, #0b171c 66%, #081014 100%)',
        }}
      />
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
        {/* Full-bleed hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${publicAsset('hero-bg.jpg')})` }}
        />

        {/* Soft overlay for text legibility */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(190,240,250,0.16),_transparent_38%),linear-gradient(180deg,rgba(8,14,17,0.08),rgba(10,16,19,0.12)_58%,rgba(8,13,16,0.22)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#0b1417]/26 to-[#0a1014]" />
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(10, 16, 20, 0) 0%, rgba(23, 74, 88, 0.18) 44%, rgba(9, 15, 18, 0.9) 100%)',
            clipPath: 'polygon(0 38%, 12% 28%, 24% 40%, 37% 22%, 50% 36%, 63% 18%, 78% 34%, 89% 26%, 100% 36%, 100% 100%, 0 100%)',
          }}
        />

        {/* Parallax Accents: Cyan & Sky mix */}
        <BackgroundGlow color="cyan" size="620px" top="-10%" left="50%" opacity={0.14} blur="120px" />
        <BackgroundGlow color="sky" size="380px" top="10%" left="-5%" opacity={0.1} blur="100px" />
        <BackgroundGlow color="sunlight" size="520px" top="40%" left="70%" opacity={0.08} blur="110px" />

        {/* Nav Bar — floating forest-glass pill */}
        <nav className="relative z-30 mt-4 px-4 sm:px-6">
          <div className="relative max-w-7xl mx-auto">
            <div className="glass-nav-hero flex items-center justify-between gap-3 px-4 sm:px-5 py-3 animate-[fadeSlideUp_0.6s_ease-out_both]">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 shrink-0">
                <SuryaMark size={38} className="shrink-0 drop-shadow-[0_0_10px_rgba(217,119,6,0.35)]" />
                <span className="font-bold text-white text-lg tracking-tight drop-shadow-md whitespace-nowrap">
                  SURYA
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
                    <Icon size={15} className="text-amber-300/90" />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to="/login"
                  className="hidden lg:inline-flex px-4 py-2.5 rounded-full text-sm font-semibold text-white/75 hover:text-white hover:bg-white/10 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #b45309, #f59e0b)',
                    boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  Get started
                  <ChevronRight size={16} />
                </Link>

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
                    <Icon size={16} className="text-amber-300/90" />
                    {label}
                  </Link>
                ))}
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white/80 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #b45309, #f59e0b)',
                    boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  Create account
                  <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Main Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-4 md:px-12 md:py-8 text-center -mt-4 md:-mt-8">
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
            className="mt-8 md:mt-12 flex w-full max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:items-center sm:gap-4"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.9s both' }}
          >
            <Link
              to="/signup"
              className="min-h-12 justify-center text-white px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #1f120b, #0d1012)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.28)',
              }}
            >
              Get started
              <ChevronRight size={16} />
            </Link>
            <Link
              to="/energy-flow"
              className="min-h-12 justify-center text-white/90 px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:border-white/60 hover:bg-white/[0.06] hover:text-white"
              style={{
                border: '1.5px solid rgba(190, 235, 245, 0.28)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <Play size={14} />
              Watch Live Dispatch
            </Link>
          </div>
        </div>

        {/* Live Weather — bottom-right */}
        <div className="relative z-20 self-center mt-6 mb-16 md:absolute md:bottom-10 md:right-10 md:mt-0 md:mb-0">
          <WeatherWidget />
        </div>

        {/* Scroll indicator */}
        <ScrollIndicator />
      </section>

      {/* ===== IN THE FIELD (PROBLEM IN CONTEXT) ===== */}
      <MediaShowcase />

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorksSection />

      {/* ===== LIVE STATS ===== */}
      <LiveStatsSection />

      {/* ===== AUTHORITY / TRUST STRIP ===== */}
      <AuthorityStrip />

      {/* ===== CTA FOOTER ===== */}
      <CTAFooter />
    </div>
  );
}
