export type ProductCategory = 'mouse' | 'keyboard' | 'monitor' | 'headset' | 'storage' | 'accessories';

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: ProductCategory;
  description: string;
  specifications: Record<string, string>;
  price: number;
  mrp?: number;
  savings_percent?: number;
  savings_amount?: number;
  tax_label?: string;
  is_dealer?: boolean;
  stock_quantity: number;
  image_url: string | null;
  sku: string;
  hsn_code: string;
}

export interface ProductDraft {
  id: number;
  image_url: string;
  ai_detected_data: Record<string, unknown> | null;
  web_scraped_data: Record<string, unknown> | null;
  final_data: Record<string, unknown> | null;
  status: 'processing' | 'review' | 'published' | 'failed';
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

export interface BrandItem {
  id: number;
  name: string;
  logo_url: string | null;
}
