/**
 * App — root routing configuration for the VPP Platform.
 * Routes: Hero → Mission Control → Live Energy Flow → AI Decision Center → Settings
 * Uses Framer Motion for smooth page transitions (fade + slide).
 */
import { HashRouter as Router, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, type CSSProperties, type ReactNode } from 'react';
import { NavBar } from './components/NavBar';
import { Hero } from './components/landing/Hero';
import { VppDataProvider } from './context/VppDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';

const MissionControl = lazy(() =>
  import('./components/dashboard/MissionControl').then(m => ({ default: m.MissionControl }))
);
const LiveEnergyFlow = lazy(() =>
  import('./components/dashboard/LiveEnergyFlow').then(m => ({ default: m.LiveEnergyFlow }))
);
const AIDecisionCenter = lazy(() =>
  import('./components/dashboard/AIDecisionCenter').then(m => ({ default: m.AIDecisionCenter }))
);
const FacilitiesSettings = lazy(() =>
  import('./components/dashboard/FacilitiesSettings').then(m => ({ default: m.FacilitiesSettings }))
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-sm text-white/50">Loading…</div>
    </div>
  );
}

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

function AnimatedRoute({ children }: { children: ReactNode }) {
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
  const { user, loading } = useAuth();
  const config = routeConfigs[location.pathname] || { needsNav: false };
  const isProtected = Boolean(routeConfigs[location.pathname]?.needsNav);
  const isKnownRoute = location.pathname === '/'
    || location.pathname === '/login'
    || location.pathname === '/signup'
    || isProtected;

  if (loading) {
    return <PageFallback />;
  }

  if (!isKnownRoute) return <Navigate to="/" replace />;
  if (location.pathname === '/login') return <AuthPage mode="login" />;
  if (location.pathname === '/signup') return <AuthPage mode="signup" />;
  if (isProtected && !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      {/* NavBar stays outside AnimatedRoute so sticky positioning works
          (a transformed ancestor breaks position: sticky) and it does not
          re-animate on every route change. */}
      {config.needsNav && <NavBar />}
      <AnimatedRoute>
        {config.needsNav ? (
          <Suspense fallback={<PageFallback />}>
            {location.pathname === '/dashboard' && <MissionControl />}
            {location.pathname === '/energy-flow' && <LiveEnergyFlow />}
            {location.pathname === '/decisions' && <AIDecisionCenter />}
            {location.pathname === '/settings' && <FacilitiesSettings />}
          </Suspense>
        ) : (
          <Hero />
        )}
      </AnimatedRoute>
    </>
  );
}

function App() {
  const appStyle = {
    '--vpp-hero-image': `url("${import.meta.env.BASE_URL}hero-bg.jpg")`,
  } as CSSProperties;

  return (
    <Router>
      <AuthProvider>
        <VppDataProvider>
          <div className="min-h-screen" style={appStyle}>
            <AppRoutes />
          </div>
        </VppDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
