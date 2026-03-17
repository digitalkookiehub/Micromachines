export type UserRole = 'customer' | 'dealer' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  company_name: string | null;
  logo_url: string | null;
  dealer_profile?: DealerProfile;
}

export interface DealerProfile {
  id: number;
  company_name: string;
  dealer_id: string;
  gst_number: string | null;
  tier: 'silver' | 'gold' | 'platinum';
  credit_limit: number;
  is_approved: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  company_name?: string;
  gst_number?: string;
}
