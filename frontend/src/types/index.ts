
export interface User {
  wallet: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  wallet: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  images: string[];
  month: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostPreview {
  id: number;
  title: string;
  preview: string;
  month: string;
  is_premium: boolean;
  created_at: string;
  image_count: number;
}

export interface PaymentReference {
  reference: string;
  amount: number;
  wallet: string;
  created_at: string;
  expires_at: string;
}

export interface PaymentVerification {
  success: boolean;
  txSignature?: string;
  newExpiry?: string;
  error?: string;
}

export interface SiteSettings {
  is_paused: boolean;
  pause_message: string;
  price_sol: number;
  subscription_days: number;
}

export interface MonthGroup {
  month: string;
  label: string;
  postCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  totalPosts: number;
  totalPayments: number;
  revenue: number;
}

export interface UploadUrl {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export type WalletType = 'phantom' | 'solflare';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  wallet: WalletType | null;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
