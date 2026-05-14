
import type { RequestContext } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleSubscription(ctx: RequestContext): Promise<Response> {
  const { request, url, env } = ctx;

  if (url.pathname === '/api/subscription' && request.method === 'GET') {
    const wallet = url.searchParams.get('wallet');
    if (!wallet) {
      return errorResponse('Wallet required', 400, request);
    }

    const subscription = await env.DB.prepare(
      `SELECT expires_at FROM subscriptions WHERE wallet = ? AND expires_at > datetime('now') ORDER BY expires_at DESC LIMIT 1`
    ).bind(wallet).first<{ expires_at: string }>();

    if (!subscription) {
      return jsonResponse({
        isActive: false,
        expiresAt: null,
        daysRemaining: null,
      }, request);
    }

    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return jsonResponse({
      isActive: true,
      expiresAt: subscription.expires_at,
      daysRemaining,
    }, request);
  }

  return errorResponse('Not found', 404, request);
}
