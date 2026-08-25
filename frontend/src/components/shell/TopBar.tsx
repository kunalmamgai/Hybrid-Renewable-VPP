/**
 * TopBar — the single horizontal navigation bar.
 * Brand · 9 section tabs with labels (icon-only + tooltips on narrow
 * screens) · notifications, AI assistant and profile — all in one row.
 * Phones use the bottom nav + drawer instead of the tab strip.
 */
import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu, Bell, Sparkles, LogOut, Radio,
} from 'lucide-react';
import { SuryaMark } from '../common/SuryaMark';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertsContext';
import { NAV_ITEMS } from './nav';

interface TopBarProps {
  onOpenMobileNav: () => void;
  onOpenCopilot: () => void;
}

export function TopBar({ onOpenMobileNav, onOpenCopilot }: TopBarProps) {
  const { user, signOut } = useAuth();
  const { activeCount, counts } = useAlerts();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const initials = (user?.full_name || user?.email || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const alertBadge = counts.critical + counts.warning;

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0 flex items-center gap-2 px-2.5 sm:px-4 bg-ops-bg/95 backdrop-blur-xl border-b border-ops-line">
      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
        className="md:hidden min-w-10 min-h-10 grid place-items-center rounded-md text-white/75 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
      >
        <Menu size={18} />
      </button>

      {/* Brand — exits the console to the public landing page */}
      <NavLink to="/" className="flex items-center gap-2 mr-1 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60 rounded-lg" aria-label="SURYA — back to home">
        <SuryaMark size={30} className="shrink-0" />
        <span className="hidden lg:inline font-display font-bold text-[14px] tracking-wide text-white">SURYA</span>
      </NavLink>

      {/* Section tabs — icon + label, icon-only on narrow screens */}
      <nav
        aria-label="Primary"
        className="hidden md:flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar py-1"
      >
        {NAV_ITEMS.map((item, i) => {
          const tipAlign =
            i === 0 ? 'tip-start' : i === NAV_ITEMS.length - 1 ? 'tip-end' : '';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `ops-tab group/tab ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              title={item.label}
            >
              <item.icon size={16} className="shrink-0" />
              <span className="hidden lg:inline text-[11.5px] font-semibold tracking-wide whitespace-nowrap">
                {item.shortLabel}
              </span>
              {item.to === '/app/alerts' && alertBadge > 0 && (
                <span className="hidden lg:inline-flex items-center justify-center min-w-[1rem] h-[1rem] px-1 rounded-full bg-red-500/25 border border-red-400/40 text-red-300 text-[9px] num">
                  {alertBadge}
                </span>
              )}
              {/* Tooltip only when the label is hidden (below lg) */}
              <span role="tooltip" className={`ops-tab-tip ${tipAlign} lg:hidden`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="flex-1 min-w-2" />

      {/* Notifications */}
      <button
        type="button"
        onClick={() => navigate('/app/alerts')}
        aria-label={`Notifications — ${activeCount} active`}
        className="relative min-w-10 min-h-10 grid place-items-center rounded-md text-white/75 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
      >
        <Bell size={17} />
        {activeCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[0.9rem] h-[0.9rem] px-[3px] rounded-full bg-red-500 border border-red-300/50 text-[9px] font-bold leading-none text-white flex items-center justify-center num">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </button>

      {/* Ask Energy AI */}
      <button type="button" onClick={onOpenCopilot} className="ops-btn ops-btn-primary min-h-10 !py-[6px]">
        <Sparkles size={13} />
        <span className="hidden sm:inline">Ask Energy AI</span>
      </button>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          aria-label="User menu"
          className="w-10 h-10 rounded-full grid place-items-center bg-gradient-to-br from-amber-500/40 to-emerald-500/40 border border-amber-300/30 text-[11px] font-bold text-white hover:border-amber-300/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
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
