import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export const authService = {
  login: async (data: LoginPayload) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  register: async (data: RegisterPayload) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const res = await api.post('/auth/logout', { refreshToken });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};
