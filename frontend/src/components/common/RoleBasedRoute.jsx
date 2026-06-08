import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import PermissionDenied from '@/pages/public/PermissionDenied.jsx';

export function RoleBasedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <PermissionDenied homePath={user?.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.CANDIDATE_DASHBOARD} />;
  }

  return <Outlet />;
}
