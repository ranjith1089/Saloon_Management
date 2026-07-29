import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.clear();
        set({ user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    { name: 'auth-storage' }
  )
);
