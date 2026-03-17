import api from './api';
import type { CreditSummary, CreditTransaction } from '@/types';

export const creditService = {
  async getSummary(): Promise<CreditSummary> {
    const { data } = await api.get('/credit/summary');
    return data;
  },

  async getTransactions(page: number = 1): Promise<CreditTransaction[]> {
    const { data } = await api.get('/credit/transactions', { params: { page } });
    return data;
  },
};
