

import type { RequestContext, Post } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';
import { updateSetting, getSettings } from '../utils/db';

async function getSession(db: D1Database, token: string) {
  return db.prepare(
    'SELECT wallet FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first<{ wallet: string }>();
}

function isAdmin(env: { ADMIN_WALLETS?: string }, wallet: string): boolean {
  const adminWallets = (env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase());
  return adminWallets.includes(wallet.toLowerCase());
}

export async function handleAdmin(ctx: RequestContext): Promise<Response> {
  const { request, env, url } = ctx;
  const path = url.pathname;
  const method = request.method;

  const cookies = request.headers.get('Cookie') || '';
  const sessionToken = cookies.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];

  if (!sessionToken) {
    return errorResponse('Unauthorized', 401, request);
  }

  const session = await getSession(env.DB, sessionToken);
  if (!session || !isAdmin(env, session.wallet)) {
    return errorResponse('Unauthorized', 401, request);
  }

  if (path === '/api/admin/stats' && method === 'GET') {
    const totalPosts = await env.DB.prepare('SELECT COUNT(*) as count FROM posts').first<{ count: number }>();
    const totalUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    const totalSubs = await env.DB.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE expires_at > datetime("now")').first<{ count: number }>();
    const totalWins = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE trade_result = 'win'").first<{ count: number }>();
    const totalLosses = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE trade_result = 'lose'").first<{ count: number }>();

    return jsonResponse({
      totalPosts: totalPosts?.count || 0,
      totalUsers: totalUsers?.count || 0,
      activeSubscribers: totalSubs?.count || 0,
      totalWins: totalWins?.count || 0,
      totalLosses: totalLosses?.count || 0,
    }, request);
  }

  if (path === '/api/admin/posts' && method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC').all<Post>();
    const posts = (result.results || []).map(post => ({
      ...post,
      images: JSON.parse(post.images || '[]'),
      is_premium: post.is_premium === 1,
    }));
    return jsonResponse(posts, request);
  }

  if (path === '/api/admin/posts' && method === 'POST') {
    const body = await request.json() as any;
    const result = await env.DB.prepare(
      'INSERT INTO posts (title, content, images, month, is_premium, contract_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(body.title, body.content, JSON.stringify(body.images || []), body.month, body.is_premium ? 1 : 0, body.contract_address || null).run();

    return jsonResponse({ id: result.meta.last_row_id, ...body }, request);
  }

  const putMatch = path.match(/^\/api\/admin\/posts\/(\d+)$/);
  if (putMatch && method === 'PUT') {
    const postId = parseInt(putMatch[1], 10);
    const body = await request.json() as any;

    await env.DB.prepare(
      'UPDATE posts SET title = ?, content = ?, images = ?, month = ?, is_premium = ?, contract_address = ? WHERE id = ?'
    ).bind(body.title, body.content, JSON.stringify(body.images || []), body.month, body.is_premium ? 1 : 0, body.contract_address || null, postId).run();

    return jsonResponse({ success: true }, request);
  }

  const deleteMatch = path.match(/^\/api\/admin\/posts\/(\d+)$/);
  if (deleteMatch && method === 'DELETE') {
    const postId = parseInt(deleteMatch[1], 10);
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
    return jsonResponse({ success: true }, request);
  }

  const resultMatch = path.match(/^\/api\/admin\/posts\/(\d+)\/result$/);
  if (resultMatch && method === 'PUT') {
    const postId = parseInt(resultMatch[1], 10);
    const body = await request.json() as { result: 'win' | 'lose' | null };

    await env.DB.prepare(
      'UPDATE posts SET trade_result = ? WHERE id = ?'
    ).bind(body.result, postId).run();

    return jsonResponse({ success: true, trade_result: body.result }, request);
  }

  if (path === '/api/admin/upload' && method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File;

    if (!file) {
      return errorResponse('No file provided', 400, request);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Invalid file type', 400, request);
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    await env.IMAGES.put(filename, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${filename}`;
    return jsonResponse({ url: publicUrl }, request);
  }

  if (path === '/api/admin/settings' && method === 'GET') {
    const result = await env.DB.prepare('SELECT key, value FROM settings').all();
    const settings: Record<string, string> = {};
    for (const row of result.results as { key: string; value: string }[]) {
      settings[row.key] = row.value;
    }
    return jsonResponse(settings, request);
  }

  if (path === '/api/admin/settings' && method === 'PUT') {
    const body = await request.json() as any;
    if (body.is_paused !== undefined) await updateSetting(env.DB, 'is_paused', String(body.is_paused));
    if (body.pause_message !== undefined) await updateSetting(env.DB, 'pause_message', body.pause_message);
    if (body.price_sol !== undefined) await updateSetting(env.DB, 'price_sol', String(body.price_sol));

    const updatedSettings = await getSettings(env.DB);
    return jsonResponse(updatedSettings, request);
  }

  return errorResponse('Not found', 404, request);
}
