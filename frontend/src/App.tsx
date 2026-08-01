/**
 * App — root routing configuration for the VPP Platform.
 * Routes: Hero → Mission Control → Live Energy Flow → AI Decision Center → Settings
 */
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { Hero } from './components/landing/Hero';
import { MissionControl } from './components/dashboard/MissionControl';
import { LiveEnergyFlow } from './components/dashboard/LiveEnergyFlow';
import { AIDecisionCenter } from './components/dashboard/AIDecisionCenter';
import { FacilitiesSettings } from './components/dashboard/FacilitiesSettings';

function BodyClassManager() {
  const location = useLocation();
  useEffect(() => {
    // Use landing hero background as the site theme for all routes.
    document.body.style.backgroundImage = "linear-gradient(to bottom, rgba(15,40,30,0.25), rgba(0,0,0,0.18)), url('/hero-bg.png')";
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.color = '#0f2a24';
    return () => {
      // Clean up styles if component unmounts
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.color = '';
    };
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <BodyClassManager />
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/dashboard" element={<>
            <NavBar transparent />
            <MissionControl />
          </>} />
          <Route path="/energy-flow" element={<>
            <NavBar transparent />
            <LiveEnergyFlow />
          </>} />
          <Route path="/decisions" element={<>
            <NavBar transparent />
            <AIDecisionCenter />
          </>} />
          <Route path="/settings" element={<>
            <NavBar transparent />
            <FacilitiesSettings />
          </>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
