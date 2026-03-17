import api from './api';
import type { Invoice } from '@/types';

export const invoiceService = {
  async list(page: number = 1): Promise<Invoice[]> {
    const { data } = await api.get('/invoices', { params: { page } });
    return data;
  },

  async getById(invoiceId: number): Promise<Invoice> {
    const { data } = await api.get(`/invoices/${invoiceId}`);
    return data;
  },

  async downloadPdf(invoiceId: number): Promise<string> {
    const { data } = await api.get(`/invoices/${invoiceId}/pdf`);
    return data;
  },
};
