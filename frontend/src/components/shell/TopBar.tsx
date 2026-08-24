/**
 * TopBar — global status strip: system health, live/simulation indicator,
 * site selector, clock, notifications, AI assistant and profile.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu, MapPin, Bell, Sparkles, ChevronDown, LogOut, Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertsContext';
import { useVppData } from '../../context/VppDataContext';
import { WifiOff } from 'lucide-react';
import { CAMPUS_OPTIONS } from '../../data/campusCatalog';
import { NAV_ITEMS } from './nav';

interface TopBarProps {
  onOpenMobileNav: () => void;
  onOpenCopilot: () => void;
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now.toLocaleString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function TopBar({ onOpenMobileNav, onOpenCopilot }: TopBarProps) {
  const { user, signOut } = useAuth();
  const { activeCount } = useAlerts();
  const navigate = useNavigate();
  const location = useLocation();
  const clock = useClock();

  const [siteOpen, setSiteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const siteRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) setSiteOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSiteOpen(false); setProfileOpen(false); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const current = NAV_ITEMS.find(n =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  );
  const pageTitle = current?.label ?? 'Overview';

  const initials = (user?.full_name || user?.email || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-20 h-14 shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 bg-ops-bg/85 backdrop-blur-xl border-b border-ops-line">
      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
        className="md:hidden p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
      >
        <Menu size={18} />
      </button>

      {/* Page title + system status */}
      <div className="min-w-0 flex items-center gap-3">
        <h1 className="hidden lg:block font-display text-[13px] font-bold tracking-wide text-white truncate">
          {pageTitle}
        </h1>
        <div className="hidden sm:flex items-center gap-2 ops-chip ops-chip-green !py-[3px]">
          <span className="status-dot-green" aria-hidden="true" />
          SYSTEM OPERATIONAL
        </div>
      </div>

      {/* Live indicator */}
      <LiveBadge />

      <div className="flex-1" />

      {/* Site selector */}
      <div className="relative hidden md:block" ref={siteRef}>
        <button
          type="button"
          onClick={() => { setSiteOpen(v => !v); setProfileOpen(false); }}
          aria-haspopup="listbox"
          aria-expanded={siteOpen}
          className="ops-btn !py-[6px]"
        >
          <MapPin size={13} className="text-amber-300/80" />
          VIT Bhopal
          <ChevronDown size={13} className={`text-white/40 transition-transform ${siteOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {siteOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              role="listbox"
              className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto ops-scroll rounded-lg border border-ops-line-strong bg-ops-panel shadow-ops-lg p-1 z-30"
            >
              {CAMPUS_OPTIONS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={c.id === 'vit-bhopal'}
                  onClick={() => setSiteOpen(false)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${c.id === 'vit-bhopal' ? 'bg-amber-400/10 text-amber-100' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="text-[12px] font-semibold">{c.shortName}</div>
                  <div className="text-[10px] text-white/40">{c.city}</div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clock */}
      <div className="hidden xl:block num text-[11px] text-white/50 whitespace-nowrap">{clock}</div>

      {/* Notifications */}
      <button
        type="button"
        onClick={() => navigate('/app/alerts')}
        aria-label={`Notifications — ${activeCount} active`}
        className="relative p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
      >
        <Bell size={17} />
        {activeCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[0.9rem] h-[0.9rem] px-[3px] rounded-full bg-red-500 border border-red-300/50 text-[9px] font-bold leading-none text-white flex items-center justify-center num">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </button>

      {/* Ask Energy AI */}
      <button type="button" onClick={onOpenCopilot} className="ops-btn ops-btn-primary !py-[6px]">
        <Sparkles size={13} />
        <span className="hidden sm:inline">Ask Energy AI</span>
      </button>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => { setProfileOpen(v => !v); setSiteOpen(false); }}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          aria-label="User menu"
          className="w-8 h-8 rounded-full grid place-items-center bg-gradient-to-br from-amber-600/40 to-emerald-500/40 border border-amber-300/30 text-[11px] font-bold text-white hover:border-amber-300/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
        >
          {initials}
        </button>
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-lg border border-ops-line-strong bg-ops-panel shadow-ops-lg p-1 z-30"
            >
              <div className="px-3 py-2 border-b border-ops-line">
                <div className="text-[12px] font-semibold text-white truncate">{user?.full_name || 'Operator'}</div>
                <div className="text-[10px] text-white/45 truncate">{user?.email}</div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => navigate('/app/settings')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Radio size={13} /> Configuration
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-red-300/90 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={13} /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

/** LIVE / OFFLINE telemetry badge driven by the WebSocket state. */
function LiveBadge() {
  const { connected } = useVppData();
  return (
    <div
      className={`flex items-center gap-1.5 ops-chip !py-[3px] ${connected ? 'ops-chip-cyan' : 'ops-chip-red'}`}
      role="status"
      aria-label={connected ? 'Live telemetry connected' : 'Telemetry offline'}
    >
      {connected ? <Radio size={11} /> : <WifiOff size={11} />}
      {connected ? 'LIVE' : 'OFFLINE'}
    </div>
  );
}
