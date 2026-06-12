import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { APP_CONFIG } from '@/constants/appConfig';
import { authService, createMockSession, unwrapAuthSession } from '@/services/authService';
import { AuthContext } from './authContext';

function readStoredSession() {
  const storedToken = localStorage.getItem(APP_CONFIG.storageKeys.token);
  const storedUser = localStorage.getItem(APP_CONFIG.storageKeys.user);
  if (!storedToken || !storedUser) {
    return { token: null, user: null };
  }

  try {
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch {
    localStorage.removeItem(APP_CONFIG.storageKeys.token);
    localStorage.removeItem(APP_CONFIG.storageKeys.user);
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const { user, token } = session;

  const persistSession = useCallback((session) => {
    localStorage.setItem(APP_CONFIG.storageKeys.token, session.token);
    localStorage.setItem(APP_CONFIG.storageKeys.user, JSON.stringify(session.user));
    setSession(session);
  }, []);

  const login = useCallback(async (credentials) => {
    const session = APP_CONFIG.enableMocks
      ? createMockSession(credentials.email)
      : unwrapAuthSession(await authService.login(credentials));
    persistSession(session);
    toast.success('Welcome back');
    return session.user;
  }, [persistSession]);

  const register = useCallback(async (payload) => {
    const response = APP_CONFIG.enableMocks ? { data: { expiresInMinutes: 10 } } : await authService.register(payload);
    toast.success('Verification OTP sent to email');
    return response;
  }, []);

  const verifyRegistration = useCallback(async (payload) => {
    const session = APP_CONFIG.enableMocks
      ? createMockSession(payload.email)
      : unwrapAuthSession(await authService.verifyRegistration(payload));
    persistSession(session);
    toast.success('Account verified');
    return session.user;
  }, [persistSession]);

  const logout = useCallback(async ({ skipApi = false } = {}) => {
    if (!APP_CONFIG.enableMocks && !skipApi) {
      await authService.logout().catch(() => null);
    }
    localStorage.removeItem(APP_CONFIG.storageKeys.token);
    localStorage.removeItem(APP_CONFIG.storageKeys.user);
    setSession({ token: null, user: null });
    toast.success('Signed out');
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isBootstrapping: false,
    login,
    register,
    verifyRegistration,
    logout,
  }), [login, logout, register, token, user, verifyRegistration]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
