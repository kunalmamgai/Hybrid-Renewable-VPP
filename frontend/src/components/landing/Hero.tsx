import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Play, Zap } from 'lucide-react';
import { AnimatedEnergyFlow } from './EnergyFlowIllustration';
import { WeatherWidget } from './WeatherWidget';
import { AuthorityStrip } from './AuthorityStrip';
import {
  ScrollIndicator,
  HowItWorksSection,
  LiveStatsSection,
  ComplianceBadgesSection,
  CTAFooter,
  BackgroundGlow,
} from './LandingSections';

// --- Live feed message sequence ---
const FEED_MESSAGES = [
  { type: 'system', text: 'Cloudy conditions forecast for 3 PM' },
  { type: 'system', text: 'Wind speed rising to 7 m/s' },
  { type: 'ai', text: 'Pre-charging battery to 92% now — confidence 96%' },
  { type: 'system', text: 'Solar generation dropping, battery discharging' },
  { type: 'ai', text: 'Grid import minimized — 84% renewable self-consumption' },
  { type: 'system', text: 'Demand peak expected at 6:15 PM' },
  { type: 'ai', text: 'Reserve mode activated for critical loads' },
] as const;

// Display window: how many messages visible at once (max 3)
const MAX_VISIBLE = 3;

type MessageType = (typeof FEED_MESSAGES)[number];

export function Hero() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Add a new message from the queue with staggered timing
  useEffect(() => {
    if (isPaused) return;

    const delay = messages.length === 0 ? 800 : 1400;
    const timer = setTimeout(() => {
      const nextIdx = queueIndex % FEED_MESSAGES.length;
      setMessages((prev) => {
        const next = [...prev, FEED_MESSAGES[nextIdx]];
        return next;
      });
      setQueueIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [queueIndex, isPaused, messages.length]);

  // When we have enough messages, pause then cycle
  useEffect(() => {
    if (messages.length >= FEED_MESSAGES.length) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(true);
        const fadeTimer = setTimeout(() => {
          setMessages([]);
          setQueueIndex(0);
          setIsPaused(false);
        }, 600);
        return () => clearTimeout(fadeTimer);
      }, 5000);
      return () => clearTimeout(pauseTimer);
    }
  }, [messages.length]);

  // Keep only the last MAX_VISIBLE messages for the card
  const visibleMessages = messages.slice(-MAX_VISIBLE);

  // Track whether we should show fade-out class
  const isFading = messages.length >= FEED_MESSAGES.length && isPaused;

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
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(15,40,30,0.25)] via-transparent to-[rgba(0,0,0,0.18)]" />
        
        {/* Parallax Accents: Sunset & Sky mix */}
        <BackgroundGlow color="orange" size="600px" top="-10%" left="50%" opacity={0.15} blur="120px" />
        <BackgroundGlow color="sky" size="400px" top="10%" left="-5%" opacity={0.1} blur="100px" />
        <BackgroundGlow color="sunlight" size="500px" top="40%" left="70%" opacity={0.08} blur="110px" />

        {/* Nav Bar */}
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 lg:px-14 py-5 animate-[fadeSlideUp_0.6s_ease-out_both]">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                 style={{ background: 'rgba(5, 150, 105, 0.85)' }}>
              <Zap className="text-white" size={17} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight drop-shadow-md">
              Hybrid VPP
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-[11px] text-white/75 font-semibold uppercase tracking-[0.18em]">
            <Link to="/dashboard" className="hover:text-white transition-colors duration-300">Platform</Link>
            <Link to="/energy-flow" className="hover:text-white transition-colors duration-300">Live Demo</Link>
            <Link to="/decisions" className="hover:text-white transition-colors duration-300">Impact</Link>
            <a href="#company" className="hover:text-white transition-colors duration-300">Company</a>
          </div>

          {/* Weather Widget — top-right */}
          <div className="hidden lg:block">
            <WeatherWidget />
          </div>

          {/* Book a Demo pill */}
          <button
            className="text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] lg:hidden"
            style={{
              background: 'rgba(17, 24, 39, 0.88)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            Book a Demo
          </button>
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
                background: '#0f172a', // Deep navy/black from image
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              }}
            >
              Book a Demo
              <ChevronRight size={16} />
            </button>
            <button
              className="text-white/90 px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:border-white/60 hover:bg-white/[0.06] hover:text-white"
              style={{
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <Play size={14} />
              Watch Live Dispatch
            </button>
          </div>
        </div>

        {/* Floating Live Feed Card */}
        <div
          className="absolute bottom-8 right-6 md:bottom-10 md:right-10 z-20 w-72 md:w-80 rounded-[20px] border transition-all duration-600 pointer-events-none"
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.5)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)',
            opacity: isFading ? 0 : 1,
            transform: isFading ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          }}
        >
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">
              Live
            </span>
            <span className="text-[10px] text-gray-400 ml-auto tracking-wide">
              VPP Dispatch
            </span>
          </div>

          {/* Reasoning bubbles */}
          <div className="px-4 pb-3 space-y-2 min-h-[105px]">
            {visibleMessages.map((msg, i) => {
              const isAi = msg.type === 'ai';
              return (
                <div
                  key={`${queueIndex}-${i}`}
                  className="rounded-xl px-3.5 py-2.5 text-[11.5px] leading-relaxed"
                  style={{
                    background: isAi
                      ? 'rgba(236, 253, 245, 0.9)'
                      : 'rgba(249, 250, 251, 0.8)',
                    border: isAi
                      ? '1px solid rgba(167, 243, 208, 0.6)'
                      : '1px solid rgba(229, 231, 235, 0.6)',
                    color: isAi ? '#065f46' : '#4b5563',
                    boxShadow: isAi
                      ? '0 1px 4px rgba(16, 185, 129, 0.08)'
                      : 'none',
                    animation: 'bubbleIn 0.45s ease-out both',
                    animationDelay: `${i * 0.12}s`,
                  }}
                >
                  {isAi && (
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mr-1.5">
                      AI
                    </span>
                  )}
                  {msg.text}
                </div>
              );
            })}
          </div>

          {/* Card footer */}
          <div className="px-4 pb-4">
            <button
              className="w-full text-white py-2 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-300 hover:shadow-md active:scale-[0.98] pointer-events-auto"
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              }}
            >
              View Full Reasoning
            </button>
          </div>
        </div>

        {/* Floating Logo Badge */}
        <div
          className="absolute bottom-8 right-[21rem] md:right-[23rem] z-20 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg pointer-events-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <Zap className="text-emerald-600" size={18} />
        </div>

        {/* Scroll indicator */}
        <ScrollIndicator />

        {/* Hero CSS Animations */}
        <style>{`
          @keyframes bubbleIn {
            0% { opacity: 0; transform: translateY(12px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(24px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* ===== ANIMATED ENERGY FLOW ILLUSTRATION ===== */}
      <section className="relative py-20 px-6 overflow-hidden"
               style={{ background: 'linear-gradient(180deg, #1b4332 0%, #0f281e 100%)' }}>
        
        {/* Background Accents: Transitioning from Hero bottom */}
        <BackgroundGlow color="orange" size="450px" top="-10%" left="60%" opacity={0.1} blur="110px" />
        <BackgroundGlow color="emerald" size="500px" top="40%" left="-10%" opacity={0.07} blur="120px" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-[fadeSlideUp_0.8s_ease-out_0.3s_both]">
            <span className="text-[10px] font-bold text-vpp-emerald uppercase tracking-[0.25em]">System Overview</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
              How Energy <span className="text-sunset-gradient">Flows</span>
            </h2>
            <p className="text-white/40 mt-3 text-sm max-w-md mx-auto">
              Solar and wind feed the AI core, which optimizes battery dispatch and protects critical buildings in real-time.
            </p>
          </div>

          <AnimatedEnergyFlow />
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorksSection />

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
