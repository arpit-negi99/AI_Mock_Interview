import { Link, NavLink } from 'react-router-dom';
import { BrainCircuit, LogOut, Menu } from 'lucide-react';
import { APP_CONFIG } from '@/constants/appConfig';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';

const publicLinks = [
  { label: 'Home', to: ROUTES.HOME },
  { label: 'Features', to: ROUTES.FEATURES },
  { label: 'About', to: ROUTES.ABOUT },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const dashboardPath = user?.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.CANDIDATE_DASHBOARD;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8" aria-label="Primary navigation">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-600 text-white"><BrainCircuit className="h-5 w-5" /></span>
          {APP_CONFIG.name}
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => cn('rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100', isActive && 'bg-slate-100 text-slate-950')}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" to={dashboardPath}>Dashboard</Link>
              <Button variant="ghost" icon={LogOut} onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Link className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" to={ROUTES.LOGIN}>Login</Link>
              <Link className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700" to={ROUTES.REGISTER}>Register</Link>
            </>
          )}
          <Button className="md:hidden" variant="ghost" icon={Menu} aria-label="Open menu" />
        </div>
      </nav>
    </header>
  );
}
