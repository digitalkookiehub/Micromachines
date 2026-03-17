export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'credit_pending';
export type PaymentMethod = 'razorpay' | 'credit';

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  credit_due_date: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  hsn_code: string;
}

export interface CreditSummary {
  credit_limit: number;
  used: number;
  available: number;
  tier: string;
  terms_days: number;
}

export interface CreditTransaction {
  id: number;
  order_id: number | null;
  order_number: string | null;
  transaction_type: 'usage' | 'settlement';
  amount: number;
  due_date: string | null;
  settled_at: string | null;
  settled_by_name: string | null;
  notes: string | null;
  created_at: string;
}
