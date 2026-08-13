/**
 * Navigation bar — forest-glass style matching the sunset-to-forest theme.
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, GitBranch, TrendingUp, Settings, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SuryaMark } from './common/SuryaMark';

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
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  function handleSignOut() {
    // Leave the protected route before clearing the session so the route guard
    // cannot redirect a deliberate sign-out to the login page.
    navigate('/', { replace: true });
    window.setTimeout(signOut, 0);
  }

  return (
    <nav className="glass-nav relative sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            aria-label="Go to SURYA home page"
            className="flex items-center space-x-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          >
            <SuryaMark size={38} className="shrink-0 drop-shadow-[0_0_10px_rgba(217,119,6,0.35)]" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-lg tracking-tight drop-shadow-md">SURYA</span>
              <span className="hidden sm:block text-[10px] text-vpp-accent-gold/80 font-medium tracking-wider">
                Smart Unified Renewable Yield Automation
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-vpp-accent-gold/25 hidden lg:block"></div>

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

        <div className="hidden lg:block relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.055] py-1.5 pl-1.5 pr-3 text-left hover:bg-white/[0.09] transition-colors"
            aria-expanded={profileOpen}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="h-8 w-8 rounded-full bg-amber-500/20 border border-amber-400/25 flex items-center justify-center text-xs font-bold text-amber-200">
                {user?.full_name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span>
              <span className="block max-w-32 truncate text-xs font-semibold text-white/85">{user?.full_name}</span>
              <span className="block max-w-32 truncate text-[10px] text-white/40">{user?.email}</span>
            </span>
            <ChevronDown size={14} className={`text-white/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="glass-nav-panel absolute right-0 top-full mt-2 w-56 p-2">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <div className="text-[10px] uppercase tracking-widest text-emerald-300/60">Signed in</div>
                <div className="mt-1 text-xs text-white/55 truncate">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/8 hover:text-white transition-colors"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
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
              <item.icon size={15} />
              <span>{item.label}</span>
              <span className="ml-auto text-[10px] text-white/35 font-normal">{item.desc}</span>
            </NavLink>
          ))}
          <div className="mt-1 pt-3 px-3 pb-2 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-200">
                  {user?.full_name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white/75">{user?.full_name}</div>
                <div className="truncate text-[10px] text-white/40">{user?.email}</div>
              </div>
              <button type="button" onClick={handleSignOut} className="p-2 text-white/45 hover:text-white" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
