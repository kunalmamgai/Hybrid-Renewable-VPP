/**
 * AppShell — the operations-console layout: single horizontal navigation bar,
 * animated page outlet, mobile bottom navigation + drawer and the AI copilot.
 */
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, BrainCircuit, LayoutDashboard, BellRing } from 'lucide-react';
import { TopBar } from './TopBar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { CopilotDock } from './CopilotDock';

const BOTTOM_NAV = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/twin', label: 'Twin', icon: Boxes },
  { to: '/app/optimizer', label: 'AI', icon: BrainCircuit },
  { to: '/app/alerts', label: 'Alerts', icon: BellRing },
];

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const location = useLocation();

  // Close transient layers on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen ops-app-bg text-ops-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-amber-500 focus:text-black focus:px-3 focus:py-1.5 focus:rounded-md focus:text-xs focus:font-bold"
      >
        Skip to content
      </a>

      <div>
        <TopBar onOpenMobileNav={() => setDrawerOpen(true)} onOpenCopilot={() => setCopilotOpen(true)} />

        <main id="main-content" className="px-3 sm:px-5 py-5 pb-24 md:pb-8 max-w-[1600px] mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch bg-ops-surface/95 backdrop-blur-xl border-t border-ops-line pb-[env(safe-area-inset-bottom)]"
      >
        {BOTTOM_NAV.map(item => (
          <button
            key={item.to}
            type="button"
            onClick={() => window.location.hash = item.to}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
              (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))
                ? 'text-amber-300' : 'text-white/40'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="More sections"
          className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-white/40"
        >
          <span className="flex gap-[3px] items-end h-[18px]" aria-hidden="true">
            <i className="w-[3px] h-[6px] rounded-sm bg-current" />
            <i className="w-[3px] h-[12px] rounded-sm bg-current" />
            <i className="w-[3px] h-[16px] rounded-sm bg-current" />
          </span>
          More
        </button>
      </nav>

      {/* Mobile drawer (hamburger / More) */}
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <CopilotDock open={copilotOpen} onOpenChange={setCopilotOpen} />
    </div>
  );
}
