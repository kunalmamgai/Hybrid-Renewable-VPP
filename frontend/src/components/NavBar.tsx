/**
 * Navigation bar — forest-glass style matching the sunset-to-forest theme.
 */
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, GitBranch, TrendingUp, Settings, Zap, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Mission Control', icon: Home, desc: "Today's overview" },
  { to: '/energy-flow', label: 'Live Energy Flow', icon: GitBranch, desc: 'Real-time routing' },
  { to: '/decisions', label: 'AI Decision Center', icon: TrendingUp, desc: 'Decision history' },
  { to: '/settings', label: 'Facilities Settings', icon: Settings, desc: 'Alerts & tiers' },
];

function navLinkClass(isActive: boolean) {
  return `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
    isActive
      ? 'bg-vpp-accent-gold/15 text-amber-100 border-vpp-accent-gold/30 shadow-[0_0_14px_rgba(217,119,6,0.15)]'
      : 'text-white/60 hover:text-white hover:bg-white/8 border-transparent'
  }`;
}

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="glass-nav relative sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Logo — sunset gradient ring */}
          <div className="flex items-center space-x-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                boxShadow: '0 0 18px rgba(217, 119, 6, 0.35)',
              }}
            >
              <Zap className="text-white" size={17} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-lg tracking-tight drop-shadow-md">
                Hybrid <span className="text-sunset-gradient">VPP</span>
              </span>
              <span className="text-[10px] text-vpp-accent-gold/80 font-medium tracking-wider">v1.0</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-vpp-accent-gold/25 hidden lg:block"></div>

          {/* Nav Links */}
          <div className="hidden lg:flex space-x-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <item.icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="hidden lg:block text-right">
          <div className="text-sm text-white/70 font-medium">Rajasthan DTE VPP Platform</div>
          <div className="text-[11px] text-vpp-accent-gold/70 tracking-wide">Clean & Green Technology</div>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/8 transition-all duration-200"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="glass-nav-panel lg:hidden absolute inset-x-4 top-full mt-2 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${navLinkClass(isActive)} mb-1`}
            >
              <item.icon size={15} />
              <span>{item.label}</span>
              <span className="ml-auto text-[10px] text-white/35 font-normal">{item.desc}</span>
            </NavLink>
          ))}
          <div className="mt-1 pt-3 px-3 pb-2 border-t border-white/10">
            <div className="text-xs text-white/70 font-medium">Rajasthan DTE VPP Platform</div>
            <div className="text-[10px] text-vpp-accent-gold/70 tracking-wide">Clean & Green Technology</div>
          </div>
        </div>
      )}
    </nav>
  );
}
