export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  billing_name: string;
  gstin: string | null;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  total_amount: number;
  is_igst: boolean;
  pdf_url: string | null;
  created_at: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total: number;
}
