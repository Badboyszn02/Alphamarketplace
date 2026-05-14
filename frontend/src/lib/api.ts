import type {
  ApiResponse,
  Post,
  PostPreview,
  SubscriptionStatus,
  SiteSettings,
  PaymentReference,
  PaymentVerification,
  MonthGroup,
  AdminStats,
  UploadUrl,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function verifyWallet(
  wallet: string,
  signature: string,
  message: string
): Promise<ApiResponse<{ token: string }>> {
  return fetchApi('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ wallet, signature, message }),
  });
}

export async function getSession(): Promise<ApiResponse<{ wallet: string; isAdmin: boolean }>> {
  return fetchApi('/api/auth/session');
}

export async function logout(): Promise<ApiResponse<void>> {
  return fetchApi('/api/auth/logout', { method: 'POST' });
}

export async function getSubscriptionStatus(
  wallet: string
): Promise<ApiResponse<SubscriptionStatus>> {
  return fetchApi(`/api/subscription?wallet=${wallet}`);
}

export async function createPaymentReference(
  wallet: string
): Promise<ApiResponse<PaymentReference>> {
  return fetchApi('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ wallet }),
  });
}

export async function verifyPayment(
  reference: string,
  signature: string
): Promise<ApiResponse<PaymentVerification>> {
  return fetchApi('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference, signature }),
  });
}

export async function checkPaymentStatus(
  reference?: string
): Promise<ApiResponse<{
  found: boolean;
  reference?: string;
  status?: 'pending' | 'completed' | 'expired';
  amount?: number;
  expiresAt?: string;
  completedAt?: string;
}>> {
  const params = reference ? `?reference=${reference}` : '';
  return fetchApi(`/api/payments/check-status${params}`);
}

export async function retryVerifyPayment(
  reference: string
): Promise<ApiResponse<{ success: boolean; error?: string; message?: string }>> {
  return fetchApi('/api/payments/retry-verify', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });
}

export async function getSettings(): Promise<ApiResponse<SiteSettings>> {
  return fetchApi('/api/settings');
}

export async function getPosts(
  month?: string
): Promise<ApiResponse<{ posts: PostPreview[]; months: MonthGroup[] }>> {
  const params = month ? `?month=${month}` : '';
  return fetchApi(`/api/posts${params}`);
}

export async function getPost(id: number, wallet?: string): Promise<ApiResponse<Post>> {
  const params = wallet ? `?wallet=${wallet}` : '';
  return fetchApi(`/api/posts/${id}${params}`);
}

export async function adminGetStats(): Promise<ApiResponse<AdminStats>> {
  return fetchApi('/api/admin/stats');
}

export async function adminGetPosts(): Promise<ApiResponse<Post[]>> {
  return fetchApi('/api/admin/posts');
}

export async function adminCreatePost(post: {
  title: string;
  content: string;
  images: string[];
  month: string;
  is_premium: boolean;
  contract_address?: string;
}): Promise<ApiResponse<Post>> {
  return fetchApi('/api/admin/posts', {
    method: 'POST',
    body: JSON.stringify(post),
  });
}

export async function adminUpdatePost(
  id: number,
  post: Partial<{
    title: string;
    content: string;
    images: string[];
    month: string;
    is_premium: boolean;
    contract_address: string;
  }>
): Promise<ApiResponse<Post>> {
  return fetchApi(`/api/admin/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(post),
  });
}

export async function adminDeletePost(id: number): Promise<ApiResponse<void>> {
  return fetchApi(`/api/admin/posts/${id}`, { method: 'DELETE' });
}

export async function adminMarkTradeResult(
  id: number,
  result: 'win' | 'lose' | null
): Promise<ApiResponse<{ success: boolean; trade_result: string | null }>> {
  return fetchApi(`/api/admin/posts/${id}/result`, {
    method: 'PUT',
    body: JSON.stringify({ result }),
  });
}

export async function getWinRate(): Promise<ApiResponse<{
  allTime: { wins: number; losses: number; total: number; winRate: number };
  monthly: Array<{ month: string; label: string; wins: number; losses: number; total: number; winRate: number }>;
}>> {
  return fetchApi('/api/win-rate');
}

export async function adminUpdateSettings(settings: {
  is_paused?: boolean;
  pause_message?: string;
}): Promise<ApiResponse<SiteSettings>> {
  return fetchApi('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function adminUploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE}/api/admin/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Upload failed' };
    }
    return { success: true, data };
  } catch {
    return { success: false, error: 'Upload failed' };
  }
}

export interface UserProfile {
  wallet: string;
  username: string | null;
  created_at: string;
  subscription: {
    is_active: boolean;
    expires_at: string;
  } | null;
}

export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  return fetchApi('/api/user/profile');
}

export async function setUsername(username: string): Promise<ApiResponse<{ success: boolean; username: string }>> {
  return fetchApi('/api/user/username', {
    method: 'PUT',
    body: JSON.stringify({ username }),
  });
}
