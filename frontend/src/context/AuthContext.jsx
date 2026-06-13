import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { APP_CONFIG } from '@/constants/appConfig';
import { authService, createMockSession, unwrapAuthSession } from '@/services/authService';
import { clearStoredAuthSession, getStoredAccessToken, persistAuthSession } from '@/services/apiClient';
import { AuthContext } from './authContext';

function readStoredSession() {
  const storedToken = getStoredAccessToken();
  const storedUser = localStorage.getItem(APP_CONFIG.storageKeys.user)
    || sessionStorage.getItem(APP_CONFIG.storageKeys.user);
  if (!storedToken || !storedUser) {
    return { token: null, user: null };
  }

  try {
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch {
    clearStoredAuthSession();
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const [isBootstrapping, setIsBootstrapping] = useState(!APP_CONFIG.enableMocks);
  const { user, token } = session;

  const persistSession = useCallback((nextSession, rememberMe = true) => {
    persistAuthSession(nextSession, rememberMe);
    setSession({ token: nextSession.token, user: nextSession.user });
  }, []);

  const login = useCallback(async (credentials) => {
    const nextSession = APP_CONFIG.enableMocks
      ? createMockSession(credentials.email)
      : unwrapAuthSession(await authService.login(credentials));
    persistSession(nextSession, credentials.rememberMe !== false);
    toast.success('Welcome back');
    return nextSession.user;
  }, [persistSession]);

  const register = useCallback(async (payload) => {
    const response = APP_CONFIG.enableMocks ? { data: { expiresInMinutes: 10 } } : await authService.register(payload);
    toast.success('Verification OTP sent to email');
    return response;
  }, []);

  const verifyRegistration = useCallback(async (payload) => {
    const nextSession = APP_CONFIG.enableMocks
      ? createMockSession(payload.email)
      : unwrapAuthSession(await authService.verifyRegistration(payload));
    persistSession(nextSession, true);
    toast.success('Account verified');
    return nextSession.user;
  }, [persistSession]);

  const logout = useCallback(async ({ skipApi = false } = {}) => {
    if (!APP_CONFIG.enableMocks && !skipApi) {
      await authService.logout().catch(() => null);
    }
    clearStoredAuthSession();
    setSession({ token: null, user: null });
    toast.success('Signed out');
  }, []);

  useEffect(() => {
    if (APP_CONFIG.enableMocks) return undefined;

    let isMounted = true;
    async function bootstrap() {
      try {
        if (getStoredAccessToken()) {
          const response = await authService.me();
          const currentUser = response?.data?.user || response?.user;
          if (currentUser && isMounted) {
            setSession((current) => ({ ...current, user: currentUser }));
            return;
          }
        }

        const refreshed = unwrapAuthSession(await authService.refresh());
        if (isMounted) persistSession(refreshed, localStorage.getItem(APP_CONFIG.storageKeys.rememberMe) !== null);
      } catch {
        clearStoredAuthSession();
        if (isMounted) setSession({ token: null, user: null });
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [persistSession]);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    login,
    register,
    verifyRegistration,
    logout,
  }), [isBootstrapping, login, logout, register, token, user, verifyRegistration]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
