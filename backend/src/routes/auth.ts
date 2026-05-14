

import type { RequestContext, Session } from '../types';
import { jsonResponse, errorResponse, setCookieHeader, deleteCookieHeader, corsHeaders } from '../utils/response';
import { verifySignature, generateSessionToken, isValidSolanaAddress } from '../utils/crypto';
import { ensureUser, isAdminWallet } from '../utils/db';

const SESSION_DURATION = 7 * 24 * 60 * 60;
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000;

async function getSession(ctx: RequestContext): Promise<Session | null> {
  const { request, env } = ctx;
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);

  if (!match) return null;

  const token = match[1];

  const session = await env.DB
    .prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")')
    .bind(token)
    .first<Session>();

  return session || null;
}

export async function withAuth(ctx: RequestContext): Promise<void> {
  const session = await getSession(ctx);

  if (session) {

    if (session.last_activity) {
      const lastActivity = new Date(session.last_activity).getTime();
      const now = Date.now();

      if (now - lastActivity > INACTIVITY_TIMEOUT) {

        await ctx.env.DB
          .prepare('DELETE FROM sessions WHERE token = ?')
          .bind(session.token)
          .run();
        return;
      }
    }

    await ctx.env.DB
      .prepare('UPDATE sessions SET last_activity = datetime("now") WHERE token = ?')
      .bind(session.token)
      .run();

    ctx.wallet = session.wallet;
    ctx.isAdmin = isAdminWallet(session.wallet, ctx.env);
  }
}

export async function requireAuth(ctx: RequestContext): Promise<string | null> {
  if (!ctx.wallet) {
    return null;
  }
  return ctx.wallet;
}

export async function requireAdmin(ctx: RequestContext): Promise<Response | null> {
  await withAuth(ctx);
  if (!ctx.wallet || !ctx.isAdmin) {
    return errorResponse('Forbidden', 403, ctx.request);
  }
  return null;
}

export async function handleAuth(ctx: RequestContext): Promise<Response> {
  const { request, url, env } = ctx;
  const path = url.pathname;

  if (path === '/api/auth/verify' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        wallet: string;
        signature: string;
        message: string;
      };

      const { wallet, signature, message } = body;

      if (!wallet || !signature || !message) {
        return errorResponse('Missing required fields', 400, request);
      }

      if (!isValidSolanaAddress(wallet)) {
        return errorResponse('Invalid wallet address', 400, request);
      }

      if (!message.includes(wallet)) {
        return errorResponse('Invalid message', 400, request);
      }

      const timestampMatch = message.match(/Timestamp: (\d+)/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1], 10);
        const now = Date.now();
        if (Math.abs(now - timestamp) > 2 * 60 * 1000) {
          return errorResponse('Message expired', 400, request);
        }
      }

      const isValid = await verifySignature(message, signature, wallet);

      if (!isValid) {
        return errorResponse('Invalid signature', 401, request);
      }

      await ensureUser(env.DB, wallet);

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000).toISOString();

      await env.DB
        .prepare('INSERT INTO sessions (token, wallet, expires_at, last_activity) VALUES (?, ?, ?, datetime("now"))')
        .bind(token, wallet, expiresAt)
        .run();

      await env.DB
        .prepare('DELETE FROM sessions WHERE wallet = ? AND expires_at < datetime("now")')
        .bind(wallet)
        .run();

      const headers = corsHeaders(request);
      headers.set('Content-Type', 'application/json');
      headers.set('Set-Cookie', setCookieHeader('session', token, SESSION_DURATION));

      return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error) {
      console.error('Auth verify error:', error);
      return errorResponse("Auth error: " + (error as Error).message, 500, request);
    }
  }

  if (path === '/api/auth/session' && request.method === 'GET') {
    await withAuth(ctx);

    if (!ctx.wallet) {
      return jsonResponse({ wallet: null, isAdmin: false }, request);
    }

    return jsonResponse({
      wallet: ctx.wallet,
      isAdmin: ctx.isAdmin,
    }, request);
  }

  if (path === '/api/auth/logout' && request.method === 'POST') {
    const session = await getSession(ctx);

    if (session) {
      await env.DB
        .prepare('DELETE FROM sessions WHERE token = ?')
        .bind(session.token)
        .run();
    }

    const headers = corsHeaders(request);
    headers.set('Content-Type', 'application/json');
    headers.set('Set-Cookie', deleteCookieHeader('session'));

    return new Response(JSON.stringify({ success: true }), { headers });
  }

  return errorResponse('Not found', 404, request);
}
