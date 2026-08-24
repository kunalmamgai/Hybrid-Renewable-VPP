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

const AppShell = lazy(() => import('./components/shell/AppShell').then(m => ({ default: m.AppShell })));

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage'));
const ForecastPage = lazy(() => import('./pages/ForecastPage'));
const OptimizerPage = lazy(() => import('./pages/OptimizerPage'));
const RenewablesPage = lazy(() => import('./pages/RenewablesPage'));
const BatteryPage = lazy(() => import('./pages/BatteryPage'));
const GridPage = lazy(() => import('./pages/GridPage'));
const SchedulerPage = lazy(() => import('./pages/SchedulerPage'));
const CarbonPage = lazy(() => import('./pages/CarbonPage'));
const GanttPage = lazy(() => import('./pages/GanttPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
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

  if (loading) return <PageFallback />;

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
          <Suspense fallback={<div className="min-h-screen ops-app-bg" />}>
            <AppShell />
          </Suspense>
        ) : (
          <Navigate to="/login" replace state={{ from: '/app' }} />
        )}
      >
        <Route index element={<SectionBoundary><Suspense fallback={<PageFallback />}><OverviewPage /></Suspense></SectionBoundary>} />
        <Route path="twin" element={<SectionBoundary><Suspense fallback={<PageFallback />}><DigitalTwinPage /></Suspense></SectionBoundary>} />
        <Route path="forecast" element={<SectionBoundary><Suspense fallback={<PageFallback />}><ForecastPage /></Suspense></SectionBoundary>} />
        <Route path="optimizer" element={<SectionBoundary><Suspense fallback={<PageFallback />}><OptimizerPage /></Suspense></SectionBoundary>} />
        <Route path="renewables" element={<SectionBoundary><Suspense fallback={<PageFallback />}><RenewablesPage /></Suspense></SectionBoundary>} />
        <Route path="battery" element={<SectionBoundary><Suspense fallback={<PageFallback />}><BatteryPage /></Suspense></SectionBoundary>} />
        <Route path="grid" element={<SectionBoundary><Suspense fallback={<PageFallback />}><GridPage /></Suspense></SectionBoundary>} />
        <Route path="scheduler" element={<SectionBoundary><Suspense fallback={<PageFallback />}><SchedulerPage /></Suspense></SectionBoundary>} />
        <Route path="carbon" element={<SectionBoundary><Suspense fallback={<PageFallback />}><CarbonPage /></Suspense></SectionBoundary>} />
        <Route path="gantt" element={<SectionBoundary><Suspense fallback={<PageFallback />}><GanttPage /></Suspense></SectionBoundary>} />
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
        <VppDataProvider>
          <MetricsProvider>
            <AlertsProvider>
              <div className="min-h-screen" style={appStyle}>
                <AppRoutes />
              </div>
            </AlertsProvider>
          </MetricsProvider>
        </VppDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
