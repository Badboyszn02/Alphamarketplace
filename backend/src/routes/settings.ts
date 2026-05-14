
import type { RequestContext } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleSettings(ctx: RequestContext): Promise<Response> {
  const { request, url, env } = ctx;

  if (url.pathname === '/api/settings' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT key, value FROM settings').all();
    const settings: Record<string, string> = {};
    for (const row of result.results as { key: string; value: string }[]) {
      settings[row.key] = row.value;
    }
    return jsonResponse({
      is_paused: settings.is_paused === 'true',
      pause_message: settings.pause_message || 'Subscriptions are paused',
      price_sol: parseFloat(settings.price_sol || '0.5'),
      subscription_days: parseInt(settings.subscription_days || '30', 10),
    }, request);
  }

  return errorResponse('Not found', 404, request);
}
