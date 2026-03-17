import api from './api';
import type { Cart } from '@/types';

export const cartService = {
  async getCart(): Promise<Cart> {
    const { data } = await api.get('/cart');
    return data;
  },

  async addItem(productId: number, quantity: number = 1): Promise<Cart> {
    const { data } = await api.post('/cart/items', { product_id: productId, quantity });
    return data;
  },

  async updateItem(itemId: number, quantity: number): Promise<Cart> {
    const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
    return data;
  },

  async removeItem(itemId: number): Promise<Cart> {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    return data;
  },
};
