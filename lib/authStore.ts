import { create } from 'zustand';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isLoading: false,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((res) => setTimeout(res, 1200));
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
    set({ user: { name, email, initials, plan: 'Pro' }, isLoading: false });
  },

  logout: () => set({ user: null }),
}));
