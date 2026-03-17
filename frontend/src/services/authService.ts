import api from './api';
import type { RegisterRequest, User } from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<User> {
    const { data: user } = await api.post('/auth/register', data);
    return user;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async updateProfile(data: { full_name?: string; phone?: string; company_name?: string; logo_url?: string }): Promise<User> {
    const { data: user } = await api.put('/auth/me', data);
    return user;
  },
};
