/**
 * App — root routing configuration for the VPP Platform.
 * Routes: Hero → Mission Control → Live Energy Flow → AI Decision Center → Settings
 * Uses Framer Motion for smooth page transitions (fade + slide).
 */
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { NavBar } from './components/NavBar';
import { Hero } from './components/landing/Hero';
import { MissionControl } from './components/dashboard/MissionControl';
import { LiveEnergyFlow } from './components/dashboard/LiveEnergyFlow';
import { AIDecisionCenter } from './components/dashboard/AIDecisionCenter';
import { FacilitiesSettings } from './components/dashboard/FacilitiesSettings';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuart
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Route-to-layout mapping
const routeConfigs: Record<string, { needsNav: boolean }> = {
  '/': { needsNav: false },
  '/dashboard': { needsNav: true },
  '/energy-flow': { needsNav: true },
  '/decisions': { needsNav: true },
  '/settings': { needsNav: true },
};

function AnimatedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const location = useLocation();
  const config = routeConfigs[location.pathname] || { needsNav: false };

  return (
    <AnimatedRoute>
      {config.needsNav ? (
        <>
          <NavBar />
          {location.pathname === '/dashboard' && <MissionControl />}
          {location.pathname === '/energy-flow' && <LiveEnergyFlow />}
          {location.pathname === '/decisions' && <AIDecisionCenter />}
          {location.pathname === '/settings' && <FacilitiesSettings />}
        </>
      ) : (
        <Hero />
      )}
    </AnimatedRoute>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
