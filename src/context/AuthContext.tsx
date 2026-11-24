import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AuthSessionState } from '../../shared/types';

const FALLBACK_TOKEN_KEY = 'acv_session_fallback';

interface LoginResponse extends AuthSessionState {
  sessionToken?: string;
  error?: string;
}

interface AuthContextValue {
  session: AuthSessionState;
  loading: boolean;
  refreshSession: () => Promise<AuthSessionState>;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  setupInitialAdmin: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const DEFAULT_SESSION: AuthSessionState = {
  authenticated: false,
  username: null,
  needsInitialSetup: false,
  envConfigured: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredFallbackToken(): string | null {
  try {
    return window.sessionStorage.getItem(FALLBACK_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredFallbackToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(FALLBACK_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(FALLBACK_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts; in-memory ref still holds the token
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSessionState>(DEFAULT_SESSION);
  const [loading, setLoading] = useState(true);
  const fallbackTokenRef = useRef<string | null>(
    typeof window !== 'undefined' ? readStoredFallbackToken() : null
  );

  const setFallbackToken = useCallback((token: string | null) => {
    fallbackTokenRef.current = token;
    if (typeof window !== 'undefined') {
      writeStoredFallbackToken(token);
    }
  }, []);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(init.headers);
      const token = fallbackTokenRef.current;
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const res = await fetch(input, {
        ...init,
        headers,
        credentials: 'include',
      });
      if (res.status === 401) {
        setFallbackToken(null);
        setSession((prev) => ({
          ...prev,
          authenticated: false,
          username: null,
        }));
      }
      return res;
    },
    [setFallbackToken]
  );

  const verifyCookieOrStoreFallback = useCallback(
    async (sessionToken?: string) => {
      try {
        const probe = await fetch('/api/auth/session', { credentials: 'include' });
        if (probe.ok) {
          const probeData = (await probe.json()) as AuthSessionState;
          if (probeData.authenticated) {
            // HttpOnly cookie works natively; do not keep any JS-accessible fallback token
            setFallbackToken(null);
            return;
          }
        }
      } catch {
        // Fall through to fallback token if available
      }
      if (sessionToken) {
        setFallbackToken(sessionToken);
      }
    },
    [setFallbackToken]
  );

  const refreshSession = useCallback(async (): Promise<AuthSessionState> => {
    try {
      const headers = new Headers();
      const token = fallbackTokenRef.current;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const res = await fetch('/api/auth/session', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = (await res.json()) as AuthSessionState;
        if (!data.authenticated) {
          setFallbackToken(null);
        }
        setSession(data);
        return data;
      }
      const unauth: AuthSessionState = { ...DEFAULT_SESSION };
      setFallbackToken(null);
      setSession(unauth);
      return unauth;
    } catch {
      const unauth: AuthSessionState = { ...DEFAULT_SESSION };
      setSession(unauth);
      return unauth;
    } finally {
      setLoading(false);
    }
  }, [setFallbackToken]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        });
        const data = (await res.json()) as LoginResponse;
        if (!res.ok) {
          return { ok: false, error: data.error || 'No se pudo iniciar sesión.' };
        }
        await verifyCookieOrStoreFallback(data.sessionToken);
        setSession({
          authenticated: true,
          username: data.username,
          needsInitialSetup: Boolean(data.needsInitialSetup),
          envConfigured: Boolean(data.envConfigured),
        });
        setLoading(false);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Error de conexión al intentar iniciar sesión.' };
      }
    },
    [verifyCookieOrStoreFallback]
  );

  const setupInitialAdmin = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        });
        const data = (await res.json()) as LoginResponse;
        if (!res.ok) {
          return { ok: false, error: data.error || 'No se pudo registrar el acceso inicial.' };
        }
        await verifyCookieOrStoreFallback(data.sessionToken);
        setSession({
          authenticated: true,
          username: data.username,
          needsInitialSetup: false,
          envConfigured: Boolean(data.envConfigured),
        });
        setLoading(false);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Error de conexión configurando el acceso inicial.' };
      }
    },
    [verifyCookieOrStoreFallback]
  );

  const logout = useCallback(async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setFallbackToken(null);
      setSession((prev) => ({
        ...prev,
        authenticated: false,
        username: null,
      }));
    }
  }, [authFetch, setFallbackToken]);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        refreshSession,
        login,
        setupInitialAdmin,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return ctx;
}
