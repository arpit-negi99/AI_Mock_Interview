import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, LogOut, Menu, Moon, Sun } from 'lucide-react';
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

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const dashboardPath = user?.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.CANDIDATE_DASHBOARD;

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--border-primary)' }}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8" aria-label="Primary navigation">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}><BrainCircuit className="h-5 w-5" /></span>
          {APP_CONFIG.name}
        </Link>
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
            <>
              <Link className="inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} to={dashboardPath}>Dashboard</Link>
              <Button variant="ghost" icon={LogOut} onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Link className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }} to={ROUTES.LOGIN}>Login</Link>
              <Link className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }} to={ROUTES.REGISTER}>Register</Link>
            </>
          )}
          <Button className="md:hidden" variant="ghost" icon={Menu} aria-label="Open menu" />
        </div>
      </nav>
    </header>
  );
}
