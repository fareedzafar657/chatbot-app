import { create } from 'zustand';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
  plan: string;
  accessToken: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}

interface AuthActions {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  signup(email: string, password: string): Promise<void>;
  confirmSignUp(email: string, code: string): Promise<void>;
  getAccessToken(): Promise<string>;
  restoreSession(): Promise<void>;
}

function deriveUser(email: string, token: string): AuthUser {
  const namePart = email.split('@')[0];
  const name = namePart
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return { name, email, initials, plan: 'free', accessToken: token };
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isLoading: true, // true until restoreSession() completes — prevents premature API calls

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await signIn({ username: email, password });
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (!token) throw new Error('Authentication succeeded but no access token was returned.');
      set({ user: deriveUser(email, token), isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await signOut();
    } catch {
      // ignore sign-out errors — clear local state regardless
    }
    set({ user: null });
  },

  signup: async (email, password) => {
    await signUp({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
  },

  confirmSignUp: async (email, code) => {
    await amplifyConfirmSignUp({ username: email, confirmationCode: code });
  },

  getAccessToken: async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: false });
      const token = session.tokens?.accessToken?.toString();
      if (!token) throw new Error('No active session.');
      // Keep cached token current
      const current = get().user;
      if (current && current.accessToken !== token) {
        set({ user: { ...current, accessToken: token } });
      }
      return token;
    } catch {
      set({ user: null });
      throw new Error('Session expired. Please sign in again.');
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      await getCurrentUser();
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (!token) throw new Error('No token');
      const email =
        (session.tokens?.idToken?.payload?.email as string | undefined) ?? '';
      set({ user: deriveUser(email, token), isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
