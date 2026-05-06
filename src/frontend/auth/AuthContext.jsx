import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { API_BASE_URL, apiRequest } from '../api/client';

const STORAGE_KEY = 'historymap.auth';

const AuthContext = createContext(null);
let activeRefresh = null;
let lastRefresh = null;

function readStoredTokens() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.refreshToken) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens) {
  try {
    if (!tokens) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {}
}

function getAuthHashPayload() {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!hash) return null;

  const params = new URLSearchParams(hash);

  if (params.has('auth_error')) {
    return {
      type: 'error',
      reason: params.get('auth_error') || 'unknown_error',
    };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const userId = params.get('user_id');

  if (!accessToken || !refreshToken) return null;

  return {
    type: 'tokens',
    tokens: {
      accessToken,
      refreshToken,
      userId,
    },
  };
}

function clearAuthHash() {
  window.history.replaceState(
    null,
    document.title,
    `${window.location.pathname}${window.location.search}`
  );
}

function normalizeUser(user) {
  if (!user) return null;

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    ...user,
    name: fullName || `VK ID ${user.vk_id}`,
    avatar: user.avatar || '',
  };
}

export function AuthProvider({ children }) {
  const [tokens, setTokensState] = useState(readStoredTokens);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(tokens?.accessToken));
  const [error, setError] = useState(null);

  const setTokens = useCallback((nextTokens) => {
    setTokensState(nextTokens);
    writeStoredTokens(nextTokens);
  }, []);

  const resetAuth = useCallback(() => {
    setTokens(null);
    setUser(null);
    setIsLoading(false);
  }, [setTokens]);

  const refreshTokens = useCallback(async (refreshToken) => {
    if (lastRefresh?.refreshToken === refreshToken) {
      return lastRefresh.tokens;
    }

    if (!activeRefresh || activeRefresh.refreshToken !== refreshToken) {
      const promise = apiRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
        .then((refreshed) => {
          const nextTokens = {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
          };

          lastRefresh = {
            refreshToken,
            tokens: nextTokens,
          };
          writeStoredTokens(nextTokens);

          return nextTokens;
        })
        .finally(() => {
          if (activeRefresh?.promise === promise) {
            activeRefresh = null;
          }
        });

      activeRefresh = {
        refreshToken,
        promise,
      };
    }

    return activeRefresh.promise;
  }, []);

  const loadCurrentUser = useCallback(
    async (authTokens, canRefresh = true) => {
      try {
        const data = await apiRequest('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${authTokens.accessToken}`,
          },
        });

        return {
          user: normalizeUser(data.user),
          tokens: authTokens,
        };
      } catch (requestError) {
        if (
          canRefresh &&
          authTokens.refreshToken &&
          (requestError.status === 401 || requestError.code === -5)
        ) {
          const refreshedTokens = await refreshTokens(authTokens.refreshToken);
          return loadCurrentUser(refreshedTokens, false);
        }

        throw requestError;
      }
    },
    [refreshTokens]
  );

  const authRequest = useCallback(
    async (path, options = {}) => {
      if (!tokens?.accessToken || !tokens?.refreshToken) {
        const authError = new Error('Authorization required');
        authError.status = 401;
        authError.code = -4;
        throw authError;
      }

      const requestWithToken = (accessToken) =>
        apiRequest(path, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });

      try {
        return await requestWithToken(tokens.accessToken);
      } catch (requestError) {
        if (requestError.status !== 401 && requestError.code !== -5) {
          throw requestError;
        }

        try {
          const refreshedTokens = await refreshTokens(tokens.refreshToken);
          setTokens(refreshedTokens);
          return await requestWithToken(refreshedTokens.accessToken);
        } catch (refreshError) {
          resetAuth();
          throw refreshError;
        }
      }
    },
    [refreshTokens, resetAuth, setTokens, tokens]
  );

  useEffect(() => {
    const payload = getAuthHashPayload();
    if (!payload) return;

    clearAuthHash();

    if (payload.type === 'error') {
      setError(payload.reason);
      resetAuth();
      return;
    }

    setError(null);
    setTokens(payload.tokens);
    setIsLoading(true);
  }, [resetAuth, setTokens]);

  useEffect(() => {
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      setUser(null);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    setIsLoading(true);

    loadCurrentUser(tokens)
      .then((result) => {
        if (cancelled) return;

        setTokens(result.tokens);
        setUser(result.user);
        setError(null);
      })
      .catch((requestError) => {
        if (cancelled) return;

        setError(requestError.message);
        resetAuth();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadCurrentUser, resetAuth, setTokens, tokens]);

  const loginWithVk = useCallback(() => {
    window.location.href = `${API_BASE_URL}/api/auth/vk`;
  }, []);

  const value = useMemo(
    () => ({
      user,
      tokens,
      error,
      isLoading,
      isAuthenticated: Boolean(user),
      authRequest,
      loginWithVk,
      resetAuth,
    }),
    [authRequest, error, isLoading, loginWithVk, resetAuth, tokens, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
