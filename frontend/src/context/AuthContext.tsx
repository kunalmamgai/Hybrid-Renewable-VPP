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
  getCurrentUser,
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

const STATIC_DEMO_MODE = import.meta.env.PROD
  && (import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_API_URL);
const STATIC_DEMO_USER: AuthUser = {
  id: 'static-demo',
  email: 'demo@surya.vpp',
  full_name: 'Demo Visitor',
  avatar_url: null,
  auth_provider: 'demo',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(STATIC_DEMO_MODE ? STATIC_DEMO_USER : null);
  const [loading, setLoading] = useState(!STATIC_DEMO_MODE);

  const acceptAuth = useCallback((response: AuthResponse) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
    setUser(response.user);
  }, []);

  useEffect(() => {
    if (STATIC_DEMO_MODE) return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => window.localStorage.removeItem(AUTH_TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

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
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(STATIC_DEMO_MODE ? STATIC_DEMO_USER : null);
  }, []);

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
