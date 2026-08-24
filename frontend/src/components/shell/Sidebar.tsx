/**
 * Sidebar — persistent collapsible operations navigation.
 * Desktop: fixed rail (expanded ⇄ icon rail). Tablet: icon rail.
 * Mobile: hidden (TopBar hamburger opens the drawer; bottom nav bar shown).
 */
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Settings, X } from 'lucide-react';
import { NAV_ITEMS } from './nav';
import { SuryaMark } from '../common/SuryaMark';
import { useAlerts } from '../../context/AlertsContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { counts } = useAlerts();
  const alertBadge = counts.critical + counts.warning;

  const content = (
    <>
      {/* Brand */}
      <div className={`flex items-center gap-2.5 px-3 h-14 border-b border-ops-line shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
        <SuryaMark className="w-7 h-7 shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display font-bold text-[13px] tracking-wide text-white leading-tight">SURYA</div>
            <div className="tech-label" style={{ fontSize: '0.52rem' }}>VPP Control</div>
          </div>
        )}
        {/* Mobile close */}
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="ml-auto md:hidden p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10"
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
            onClick={onCloseMobile}
            className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={16} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.to === '/app/alerts' && alertBadge > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-[10px] font-bold num">
                {alertBadge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-ops-line px-2 py-2.5 shrink-0 space-y-1">
        <NavLink
          to="/app/settings"
          onClick={onCloseMobile}
          className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
          title="Configuration"
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span>Configuration</span>}
        </NavLink>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden md:flex w-full items-center gap-2.5 px-2.5 py-2 rounded-md text-[11px] font-semibold text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={15} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 224 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-ops-surface/90 backdrop-blur-xl border-r border-ops-line"
      >
        {content}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={onCloseMobile}
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
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
