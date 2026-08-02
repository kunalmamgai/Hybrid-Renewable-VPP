/**
 * App — root routing configuration for the VPP Platform.
 * Routes: Hero → Mission Control → Live Energy Flow → AI Decision Center → Settings
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Hero } from './components/landing/Hero';
import { MissionControl } from './components/dashboard/MissionControl';
import { LiveEnergyFlow } from './components/dashboard/LiveEnergyFlow';
import { AIDecisionCenter } from './components/dashboard/AIDecisionCenter';
import { FacilitiesSettings } from './components/dashboard/FacilitiesSettings';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/dashboard" element={<>
            <NavBar />
            <MissionControl />
          </>} />
          <Route path="/energy-flow" element={<>
            <NavBar />
            <LiveEnergyFlow />
          </>} />
          <Route path="/decisions" element={<>
            <NavBar />
            <AIDecisionCenter />
          </>} />
          <Route path="/settings" element={<>
            <NavBar />
            <FacilitiesSettings />
          </>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
