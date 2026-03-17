export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  item_count: number;
}
