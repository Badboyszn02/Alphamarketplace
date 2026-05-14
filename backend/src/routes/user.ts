

import type { RequestContext } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';
import { withAuth } from './auth';
import { getSubscriptionStatus, ensureUser } from '../utils/db';

export async function handleUser(ctx: RequestContext): Promise<Response> {
  const { request, env, url } = ctx;
  const path = url.pathname;

  if (path === '/api/user/profile' && request.method === 'GET') {
    await withAuth(ctx);
    if (!ctx.wallet) {
      return errorResponse('Unauthorized', 401, request);
    }

    const user = await env.DB
      .prepare('SELECT wallet, username, created_at FROM users WHERE wallet = ?')
      .bind(ctx.wallet)
      .first<{ wallet: string; username: string | null; created_at: string }>();

    const subscription = await getSubscriptionStatus(env.DB, ctx.wallet);

    return jsonResponse({
      wallet: ctx.wallet,
      username: user?.username || null,
      subscription,
    }, request);
  }

  if (path === '/api/user/username' && request.method === 'PUT') {
    await withAuth(ctx);
    if (!ctx.wallet) {
      return errorResponse('Unauthorized', 401, request);
    }

    const { username } = await request.json() as { username: string };

    if (!username || typeof username !== 'string') {
      return errorResponse('Username is required', 400, request);
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return errorResponse('Username must be 3-20 characters', 400, request);
    }

    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return errorResponse('Username can only contain lowercase letters, numbers, and underscores', 400, request);
    }

    const reserved = ['admin', 'hussayn', 'alpha', 'support', 'moderator', 'mod', 'system', 'root', 'help'];
    if (reserved.includes(normalizedUsername)) {
      return errorResponse('This username is reserved', 400, request);
    }

    try {

      const result = await env.DB.prepare(`
        UPDATE users
        SET username = ?, updated_at = datetime('now')
        WHERE wallet = ?
        AND NOT EXISTS (
          SELECT 1 FROM users WHERE LOWER(username) = ? AND wallet != ?
        )
      `)
        .bind(normalizedUsername, ctx.wallet, normalizedUsername, ctx.wallet)
        .run();

      if (!result.meta.changes || result.meta.changes === 0) {

        const existing = await env.DB
          .prepare('SELECT wallet FROM users WHERE LOWER(username) = ? AND wallet != ?')
          .bind(normalizedUsername, ctx.wallet)
          .first();

        if (existing) {
          return errorResponse('Username already taken', 409, request);
        }

        return jsonResponse({ username: normalizedUsername, unchanged: true }, request);
      }

      return jsonResponse({ username: normalizedUsername }, request);
    } catch (error: any) {
      console.error('Username update error:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        return errorResponse('Username already taken', 409, request);
      }
      return errorResponse('Failed to update username', 500, request);
    }
  }

  return errorResponse('Not found', 404, request);
}
