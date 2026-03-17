import api from './api';
import type { Product, ProductDraft, CategoryItem, BrandItem } from '@/types';

interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export const productService = {
  async list(params?: { category?: string; brand?: string; page?: number; per_page?: number }): Promise<PaginatedProducts> {
    const { data } = await api.get('/products', { params });
    return data;
  },

  async getBySlug(slug: string): Promise<Product> {
    const { data } = await api.get(`/products/${slug}`);
    return data;
  },

  async search(q: string, category?: string): Promise<PaginatedProducts> {
    const { data } = await api.get('/products/search', { params: { q, category } });
    return data;
  },

  async getCategories(): Promise<CategoryItem[]> {
    const { data } = await api.get('/products/categories');
    return data;
  },

  async getBrands(): Promise<BrandItem[]> {
    const { data } = await api.get('/products/brands');
    return data;
  },

  async uploadImage(file: File): Promise<ProductDraft> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/products/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getDraft(draftId: number): Promise<ProductDraft> {
    const { data } = await api.get(`/products/draft/${draftId}`);
    return data;
  },

  async updateDraft(draftId: number, finalData: Record<string, unknown>): Promise<ProductDraft> {
    const { data } = await api.put(`/products/draft/${draftId}`, { final_data: finalData });
    return data;
  },

  async publishDraft(draftId: number, pricing: { customer_price: number; dealer_price: number; sku: string; hsn_code: string }): Promise<Product> {
    const { data } = await api.post(`/products/draft/${draftId}/publish`, pricing);
    return data;
  },
};
