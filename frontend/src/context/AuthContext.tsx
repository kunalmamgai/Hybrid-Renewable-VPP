import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AUTH_TOKEN_KEY,
  AUTH_UNAUTHORIZED_EVENT,
  AUTH_USER_KEY,
  getCurrentUser,
  prepareApi,
  signIn as requestSignIn,
  signInWithGoogle as requestGoogleSignIn,
  signUp as requestSignUp,
  type AuthResponse,
  type AuthUser,
} from '../services/apiClient';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readCachedUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cachedUser] = useState(readCachedUser);
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [loading, setLoading] = useState(
    () => Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY) && !cachedUser),
  );

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    setLoading(false);
  }, []);

  const acceptAuth = useCallback((response: AuthResponse) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
  }, [clearSession]);

  useEffect(() => {
    // Start waking Render before the operator submits the sign-in form.
    void prepareApi().catch(() => undefined);
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch((error: unknown) => {
        // A network timeout during a cold start must not destroy a valid cached
        // session. Only a definitive 401 signs the operator out.
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) clearSession();
      })
      .finally(() => setLoading(false));
  }, [clearSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    acceptAuth(await requestSignIn({ email, password }));
  }, [acceptAuth]);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    acceptAuth(await requestSignUp({ full_name: fullName, email, password }));
  }, [acceptAuth]);

  const signInWithGoogle = useCallback(async (credential: string) => {
    acceptAuth(await requestGoogleSignIn(credential));
  }, [acceptAuth]);

  const signOut = useCallback(() => {
    window.google?.accounts.id.disableAutoSelect?.();
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }), [user, loading, signIn, signUp, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hooks intentionally live beside their provider so authentication has one public module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
