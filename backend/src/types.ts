
export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ADMIN_WALLETS: string;
  SUBSCRIPTION_DAYS: string;
  PRICE_SOL: string;
  SOLANA_RPC: string;
  TREASURY_WALLET?: string;
  R2_PUBLIC_URL: string;
  ENVIRONMENT?: string;
}

export interface RequestContext {
  request: Request;
  env: Env;
  ctx?: ExecutionContext;
  url: URL;
  wallet?: string;
  isAdmin?: boolean;
}

export interface User {
  wallet: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  wallet: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  images: string;
  month: string;
  is_premium: number;
  trade_result: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  reference: string;
  wallet: string;
  amount: number;
  tx_signature: string | null;
  status: 'pending' | 'completed' | 'failed';
  expires_at: string;
  created_at: string;
  completed_at: string | null;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface Session {
  token: string;
  wallet: string;
  expires_at: string;
  last_activity: string | null;
  created_at: string;
}

export interface PostPreview {
  id: number;
  title: string;
  preview: string;
  month: string;
  is_premium: boolean;
  trade_result: string | null;
  created_at: string;
  image_count: number;
}

export interface MonthGroup {
  month: string;
  label: string;
  postCount: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
}

export interface SiteSettings {
  is_paused: boolean;
  pause_message: string;
  price_sol: number;
  subscription_days: number;
}

export interface AdminStats {
  totalPosts: number;
  activeSubscribers: number;
  totalWins: number;
  totalLosses: number;
}
