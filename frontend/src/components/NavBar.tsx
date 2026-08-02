/**
 * Navigation bar — frosted glass style matching the landing page.
 */
import { NavLink } from 'react-router-dom';
import { Home, GitBranch, TrendingUp, Settings, Zap } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Mission Control', icon: Home, desc: "Today's overview" },
  { to: '/energy-flow', label: 'Live Energy Flow', icon: GitBranch, desc: 'Real-time routing' },
  { to: '/decisions', label: 'AI Decision Center', icon: TrendingUp, desc: 'Decision history' },
  { to: '/settings', label: 'Facilities Settings', icon: Settings, desc: 'Alerts & tiers' },
];

export function NavBar() {
  return (
    <nav className="glass-nav sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(5, 150, 105, 0.85)', boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)' }}>
              <Zap className="text-white" size={17} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-lg tracking-tight drop-shadow-md">
                Hybrid VPP
              </span>
              <span className="text-[10px] text-emerald-400/80 font-medium tracking-wider">v1.0</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-white/15 hidden md:block"></div>

          {/* Nav Links */}
          <div className="flex space-x-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white backdrop-blur-sm shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/8'
                  }`
                }
              >
                <item.icon size={15} />
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="text-right hidden md:block">
          <div className="text-sm text-white/70 font-medium">Rajasthan DTE VPP Platform</div>
          <div className="text-[11px] text-emerald-400/60 tracking-wide">Clean & Green Technology</div>
        </div>
      </div>
    </nav>
  );
}
