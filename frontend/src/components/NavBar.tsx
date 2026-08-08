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
  return `flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200 ${
    isActive
      ? 'bg-gradient-to-b from-saffron-400 to-amber-600 border-saffron-400/60 text-white shadow-saffron-glow-sm'
      : 'border-transparent text-amber-950/70 hover:text-amber-950 hover:bg-saffron-400/15 hover:border-saffron-400/30'
  }`;
}

function NavLinkContent({ item, isActive }: { item: (typeof navItems)[number]; isActive: boolean }) {
  return (
    <>
      <item.icon size={16} className={isActive ? 'text-white' : 'text-amber-700'} />
      <span className="leading-tight">
        <span
          className={`block font-display text-[13px] font-bold tracking-wide ${
            isActive ? 'text-white' : 'text-amber-950/80'
          }`}
        >
          {item.label}
        </span>
        <span className={`block text-[10px] font-normal ${isActive ? 'text-white/70' : 'text-amber-950/45'}`}>
          {item.desc}
        </span>
      </span>
    </>
  );
}

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="glass-nav relative sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
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
              <span className="font-display font-bold text-white text-lg tracking-tight drop-shadow-md">SURYA</span>
              <span className="text-[10px] text-vpp-accent-gold/80 font-medium tracking-wider">
                Smart Unified Renewable Yield Automation
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-vpp-accent-gold/25 hidden lg:block"></div>

          <div className="hidden lg:flex items-center gap-1 rounded-2xl bg-vpp-cream/90 border border-amber-600/20 px-1.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_6px_20px_rgba(0,0,0,0.28)]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {({ isActive }) => <NavLinkContent item={item} isActive={isActive} />}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden lg:block text-right">
          <div className="text-sm text-white/70 font-medium font-display">SURYA Platform</div>
          <div className="text-[11px] text-vpp-accent-gold/70 tracking-wide">
            Smart Unified Renewable Yield Automation
          </div>
        </div>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/8 transition-all duration-200"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="glass-nav-panel lg:hidden absolute inset-x-4 top-full mt-2 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${navLinkClass(isActive)} mb-1`}
            >
              {({ isActive }) => <NavLinkContent item={item} isActive={isActive} />}
            </NavLink>
          ))}
          <div className="mt-1 pt-3 px-3 pb-2 border-t border-amber-950/10">
            <div className="text-xs text-amber-950/80 font-medium font-display">SURYA Platform</div>
            <div className="text-[10px] text-amber-800/70 tracking-wide">
              Smart Unified Renewable Yield Automation
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
