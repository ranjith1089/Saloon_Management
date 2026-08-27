import { api } from './api';
import { REFRESH_KEY, TOKEN_KEY, storage } from './storage';

export type Profile = { firstName?: string; lastName?: string; phone?: string };
export type Customer = { loyaltyPoints?: number };
export type User = {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN' | 'OWNER' | 'SUPERADMIN';
  profile?: Profile;
  customer?: Customer | null;
  staff?: any;
};

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post('/auth/login', { email, password });
  const { user, accessToken, refreshToken } = data.data;
  await storage.setItem(TOKEN_KEY, accessToken);
  await storage.setItem(REFRESH_KEY, refreshToken);
  return user as User;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return data.data as User;
}

export async function logout(): Promise<void> {
  const rt = await storage.getItem(REFRESH_KEY);
  try {
    await api.post('/auth/logout', { refreshToken: rt });
  } catch {
    // ignore — clear local tokens regardless
  }
  await storage.removeItem(TOKEN_KEY);
  await storage.removeItem(REFRESH_KEY);
}
