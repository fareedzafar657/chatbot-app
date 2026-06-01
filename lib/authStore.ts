import { create } from 'zustand';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  updateUserAttributes,
} from 'aws-amplify/auth';

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
  plan: string;
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
  getIdToken(): Promise<string | null>;
  restoreSession(): Promise<void>;
  updateName(name: string): Promise<void>;
}

function deriveInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function deriveUser(email: string, cognitoName?: string): AuthUser {
  let name: string;
  if (cognitoName?.trim()) {
    name = cognitoName.trim();
  } else {
    const namePart = email.split('@')[0];
    name = namePart
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
  return { name, email, initials: deriveInitials(name), plan: 'free' };
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isLoading: true, // true until restoreSession() completes — prevents premature API calls

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await signIn({ username: email, password });
      const session = await fetchAuthSession();
      if (!session.tokens?.accessToken) throw new Error('Authentication succeeded but no access token was returned.');
      const cognitoName = session.tokens?.idToken?.payload?.name as string | undefined;
      set({ user: deriveUser(email, cognitoName), isLoading: false });
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
      return token;
    } catch {
      set({ user: null });
      throw new Error('Session expired. Please sign in again.');
    }
  },

  getIdToken: async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: false });
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      // non-critical: an absent ID token degrades to no demo-model access (fails closed)
      return null;
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (!token) throw new Error('No token');
      // Without an email we can't build a real user — fail closed (treat as signed out)
      // rather than deriving a blank name/initials from an empty string.
      const email = session.tokens?.idToken?.payload?.email as string | undefined;
      if (!email) throw new Error('No email in session');
      const cognitoName = session.tokens?.idToken?.payload?.name as string | undefined;
      set({ user: deriveUser(email, cognitoName), isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  updateName: async (name: string) => {
    await updateUserAttributes({ userAttributes: { name } });
    const current = get().user;
    if (current) {
      set({ user: { ...current, name, initials: deriveInitials(name) } });
    }
  },
}));
