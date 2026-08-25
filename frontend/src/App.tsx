/**
 * App — root routing configuration for the SURYA operations console.
 * Landing hero (/) is unchanged; authenticated users enter the VPP control
 * platform under /app with 12 operational sections.
 */
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Component, lazy, Suspense, type CSSProperties, type ReactNode } from 'react';
import { Hero } from './components/landing/Hero';
import { VppDataProvider } from './context/VppDataContext';
import { MetricsProvider } from './context/MetricsContext';
import { AlertsProvider } from './context/AlertsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { SuryaMark } from './components/common/SuryaMark';

const AppShell = lazy(() => import('./components/shell/AppShell').then(m => ({ default: m.AppShell })));

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage'));
const OptimizerPage = lazy(() => import('./pages/OptimizerPage'));
const RenewablesPage = lazy(() => import('./pages/RenewablesPage'));
const BatteryPage = lazy(() => import('./pages/BatteryPage'));
const GridPage = lazy(() => import('./pages/GridPage'));
const SchedulerPage = lazy(() => import('./pages/SchedulerPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const FacilitiesSettings = lazy(() =>
  import('./components/dashboard/FacilitiesSettings').then(m => ({ default: m.FacilitiesSettings }))
);

function PageFallback({ fullPage = false, message = 'Loading workspace…' }: { fullPage?: boolean; message?: string }) {
  return (
    <div
      className={`ops-app-bg flex items-center justify-center px-6 ${fullPage ? 'min-h-screen' : 'min-h-[50vh]'}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <SuryaMark size={46} className="drop-shadow-[0_0_18px_rgba(245,158,11,0.35)]" />
        <div className="mt-4 font-display text-sm font-bold tracking-[0.18em] text-white">SURYA</div>
        <div className="mt-2 text-xs text-white/60">{message}</div>
        <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-amber-600 to-amber-300" />
        </div>
      </div>
    </div>
  );
}

function ProtectedConsole() {
  return (
    <VppDataProvider>
      <MetricsProvider>
        <AlertsProvider>
          <Suspense fallback={<PageFallback message="Opening the command center…" />}>
            <AppShell />
          </Suspense>
        </AlertsProvider>
      </MetricsProvider>
    </VppDataProvider>
  );
}

/** Per-page error boundary keeps one broken section from taking down the console. */
class SectionBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="ops-panel p-6 text-center">
          <p className="text-[13px] font-semibold text-red-300 mb-1">Section failed to load</p>
          <p className="text-[11px] text-white/45">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <PageFallback fullPage message="Restoring your secure session…" />;

  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />

      {/* Legacy deep-link redirects */}
      <Route path="/dashboard" element={user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace state={{ from: '/app' }} />} />
      <Route path="/energy-flow" element={user ? <Navigate to="/app/twin" replace /> : <Navigate to="/login" replace state={{ from: '/app/twin' }} />} />
      <Route path="/decisions" element={user ? <Navigate to="/app/optimizer" replace /> : <Navigate to="/login" replace state={{ from: '/app/optimizer' }} />} />

      <Route
        path="/app"
        element={user ? (
          <ProtectedConsole />
        ) : (
          <Navigate to="/login" replace state={{ from: '/app' }} />
        )}
      >
        <Route index element={<SectionBoundary><Suspense fallback={<PageFallback />}><OverviewPage /></Suspense></SectionBoundary>} />
        <Route path="twin" element={<SectionBoundary><Suspense fallback={<PageFallback />}><DigitalTwinPage /></Suspense></SectionBoundary>} />
        {/* Removed sections redirect back to Overview */}
        <Route path="forecast" element={<Navigate to="/app" replace />} />
        <Route path="carbon" element={<Navigate to="/app" replace />} />
        <Route path="gantt" element={<Navigate to="/app" replace />} />
        <Route path="optimizer" element={<SectionBoundary><Suspense fallback={<PageFallback />}><OptimizerPage /></Suspense></SectionBoundary>} />
        <Route path="renewables" element={<SectionBoundary><Suspense fallback={<PageFallback />}><RenewablesPage /></Suspense></SectionBoundary>} />
        <Route path="battery" element={<SectionBoundary><Suspense fallback={<PageFallback />}><BatteryPage /></Suspense></SectionBoundary>} />
        <Route path="grid" element={<SectionBoundary><Suspense fallback={<PageFallback />}><GridPage /></Suspense></SectionBoundary>} />
        <Route path="scheduler" element={<SectionBoundary><Suspense fallback={<PageFallback />}><SchedulerPage /></Suspense></SectionBoundary>} />
        <Route path="alerts" element={<SectionBoundary><Suspense fallback={<PageFallback />}><AlertsPage /></Suspense></SectionBoundary>} />
        <Route path="reports" element={<SectionBoundary><Suspense fallback={<PageFallback />}><ReportsPage /></Suspense></SectionBoundary>} />
        <Route path="settings" element={<SectionBoundary><Suspense fallback={<PageFallback />}><div className="settings-host"><FacilitiesSettings /></div></Suspense></SectionBoundary>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const appStyle = {
    '--vpp-hero-image': `url("${import.meta.env.BASE_URL}hero-bg.jpg")`,
  } as CSSProperties;

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen" style={appStyle}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
