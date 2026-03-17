import api from './api';
import type { Order, PaymentMethod } from '@/types';

interface PaymentInit {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export const orderService = {
  async create(
    shippingAddress: Record<string, string>,
    billingAddress: Record<string, string>,
    paymentMethod: PaymentMethod = 'razorpay',
  ): Promise<Order> {
    const { data } = await api.post('/orders', {
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      payment_method: paymentMethod,
    });
    return data;
  },

  async list(page: number = 1): Promise<Order[]> {
    const { data } = await api.get('/orders', { params: { page } });
    return data;
  },

  async getById(orderId: number): Promise<Order> {
    const { data } = await api.get(`/orders/${orderId}`);
    return data;
  },

  async initiatePayment(orderId: number): Promise<PaymentInit> {
    const { data } = await api.post(`/orders/${orderId}/pay`);
    return data;
  },
};
