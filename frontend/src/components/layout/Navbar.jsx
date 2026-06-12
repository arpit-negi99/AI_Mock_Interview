import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, LogOut, Menu, Moon, Sun, UserRound } from 'lucide-react';
import { APP_CONFIG } from '@/constants/appConfig';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';

const publicLinks = [
  { label: 'Home', to: ROUTES.HOME },
  { label: 'Features', to: ROUTES.FEATURES },
  { label: 'About', to: ROUTES.ABOUT },
];

export function Navbar({ showSidebarToggle = false, isSidebarOpen = false, onToggleSidebar }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const profilePath = user?.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.PROFILE_SETUP;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) setIsProfileOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--border-primary)' }}>
      {showSidebarToggle && isAuthenticated && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="absolute left-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border transition-colors duration-200"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          aria-label={isSidebarOpen ? 'Hide navigation' : 'Show navigation'}
          title={isSidebarOpen ? 'Hide navigation' : 'Show navigation'}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8"
        style={showSidebarToggle && isAuthenticated ? { paddingLeft: '4.25rem' } : undefined}
        aria-label="Primary navigation"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link to={ROUTES.HOME} className="flex min-w-0 items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}><BrainCircuit className="h-5 w-5" /></span>
            <span className="truncate">{APP_CONFIG.name}</span>
          </Link>
        </div>
        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200', isActive ? 'font-semibold' : '')}
              style={({ isActive }) => ({ color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)', backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent' })}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9, rotate: 15 }}
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-200"
            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Sun className="h-4 w-4" /></motion.span>
              ) : (
                <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Moon className="h-4 w-4" /></motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                onClick={() => setIsProfileOpen((value) => !value)}
                aria-label="Open profile menu"
                aria-expanded={isProfileOpen}
              >
                <UserRound className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border shadow-xl"
                    style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                  >
                    <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-primary)' }}>
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</p>
                      <p className="truncate text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{user?.role || ROLES.CANDIDATE}</p>
                    </div>
                    <Link
                      to={profilePath}
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors"
                      style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-soft)' }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }} to={ROUTES.LOGIN}>Login</Link>
              <Link className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }} to={ROUTES.REGISTER}>Register</Link>
            </>
          )}
          {!showSidebarToggle && <Button className="md:hidden" variant="ghost" icon={Menu} aria-label="Open menu" />}
        </div>
      </nav>
    </header>
  );
}
