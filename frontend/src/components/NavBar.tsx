/**
 * Navigation bar — workspace switcher for the three MVP views.
 */
import { NavLink } from 'react-router-dom';
import { Home, GitBranch, TrendingUp, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Mission Control', icon: Home, desc: 'Today\'s overview' },
  { to: '/energy-flow', label: 'Live Energy Flow', icon: GitBranch, desc: 'Real-time routing' },
  { to: '/decisions', label: 'AI Decision Center', icon: TrendingUp, desc: 'Decision history' },
  { to: '/settings', label: 'Facilities Settings', icon: Settings, desc: 'Alerts & tiers' },
];

interface NavBarProps {
  transparent?: boolean;
}

export function NavBar({ transparent = false }: NavBarProps) {
  return (
    <nav className={`${transparent ? 'bg-transparent border-transparent' : 'bg-white border-b border-grid-200'} px-4 py-3 shadow-sm`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${transparent ? 'bg-white' : 'bg-vpp-green'} animate-pulse-slow`}></div>
            <span className={`font-bold text-lg ${transparent ? 'text-white' : 'text-vpp-blue'}`}>Hybrid Renewable VPP</span>
            <span className={`text-xs ${transparent ? 'text-white/60' : 'text-gray-500'}`}>v1.0</span>
          </div>
          <div className={`h-5 w-px ${transparent ? 'bg-white/20' : 'bg-grid-200'}`}></div>
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-vpp-blue text-white shadow'
                      : transparent
                        ? 'text-white/80 hover:text-white hover:bg-white/10'
                        : 'text-gray-600 hover:bg-grid-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-sm ${transparent ? 'text-white/60' : 'text-gray-500'}`}>Rajasthan DTE VPP Platform</div>
          <div className={`text-xs ${transparent ? 'text-white/40' : 'text-gray-400'}`}>Clean & Green Technology</div>
        </div>
      </div>
    </nav>
  );
}
