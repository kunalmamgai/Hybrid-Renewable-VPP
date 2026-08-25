/**
 * MobileNavDrawer — slide-in navigation for phones/tablets.
 * Opened by the TopBar hamburger or the bottom-nav "More" button.
 */
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { NAV_ITEMS } from './nav';
import { SuryaMark } from '../common/SuryaMark';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-ops-surface border-r border-ops-line md:hidden"
            aria-label="Navigation"
          >
            {/* Brand — exits the console to the public landing page */}
            <div className="flex items-center gap-2.5 px-3 h-14 border-b border-ops-line shrink-0">
              <Link
                to="/"
                className="flex items-center gap-2.5 min-w-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
                aria-label="SURYA — back to home"
              >
                <SuryaMark className="w-7 h-7 shrink-0" />
                <div className="min-w-0">
                  <div className="font-display font-bold text-[13px] tracking-wide text-white leading-tight">SURYA</div>
                  <div className="tech-label" style={{ fontSize: '0.52rem' }}>VPP Control</div>
                </div>
              </Link>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={onClose}
                className="ml-auto p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden ops-scroll px-2 py-3" aria-label="Primary">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-ops-line px-2 py-2.5 shrink-0">
              <NavLink
                to="/app/settings"
                onClick={onClose}
                className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}
              >
                <Settings size={16} className="shrink-0" />
                <span>Configuration</span>
              </NavLink>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
