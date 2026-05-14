

import type { RequestContext, Post } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';
import { getSubscriptionStatus } from '../utils/db';
import { withAuth } from '../utils/auth';

function generatePreview(content: string, maxLength = 200): string {
  const text = content.replace(/<[^>]*>/g, '').substring(0, maxLength);
  return text.length === maxLength ? text + '...' : text;
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export async function handlePosts(ctx: RequestContext): Promise<Response> {
  const { request, url, env } = ctx;
  const path = url.pathname;

  if (path === '/api/posts' && request.method === 'GET') {
    const month = url.searchParams.get('month');

    let query = 'SELECT * FROM posts';
    const params: string[] = [];

    if (month) {
      query += ' WHERE month = ?';
      params.push(month);
    }

    query += ' ORDER BY created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all<Post>();
    const posts = result.results || [];

    const monthsResult = await env.DB.prepare(
      'SELECT month, COUNT(*) as count FROM posts GROUP BY month ORDER BY month DESC'
    ).all<{ month: string; count: number }>();

    const months = (monthsResult.results || []).map((m) => ({
      month: m.month,
      label: formatMonthLabel(m.month),
      postCount: m.count,
    }));

    const previews = posts.map((post) => {
      const images = JSON.parse(post.images || '[]') as string[];
      return {
        id: post.id,
        title: post.title,
        preview: generatePreview(post.content),
        month: post.month,
        is_premium: post.is_premium === 1,
        trade_result: (post as any).trade_result || null,
        contract_address: (post as any).contract_address || null,
        created_at: post.created_at,
        image_count: images.length,
      };
    });

    return jsonResponse({ posts: previews, months }, request);
  }

  const postMatch = path.match(/^\/api\/posts\/(\d+)$/);
  if (postMatch && request.method === 'GET') {
    const postId = parseInt(postMatch[1], 10);
    const walletParam = url.searchParams.get('wallet');

    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(postId).first<Post>();

    if (!post) {
      return errorResponse('Post not found', 404, request);
    }

    let hasPremiumAccess = false;

    await withAuth(ctx);
    if (ctx.wallet) {

      const adminWallets = (env.ADMIN_WALLETS || '').split(',').map((w: string) => w.trim().toLowerCase());
      if (adminWallets.includes(ctx.wallet.toLowerCase())) {
        hasPremiumAccess = true;
      } else {
        const status = await getSubscriptionStatus(env.DB, ctx.wallet);
        hasPremiumAccess = status.isActive;
      }
    }

    if (!hasPremiumAccess && walletParam) {
      const status = await getSubscriptionStatus(env.DB, walletParam);
      hasPremiumAccess = status.isActive;
    }

    if (post.is_premium === 1 && !hasPremiumAccess) {
      return jsonResponse({
        id: post.id,
        title: post.title,
        content: generatePreview(post.content, 300),
        images: [],
        month: post.month,
        is_premium: true,
        trade_result: (post as any).trade_result || null,
        contract_address: (post as any).contract_address || null,
        created_at: post.created_at,
        updated_at: post.updated_at,
        locked: true,
      }, request);
    }

    return jsonResponse({
      id: post.id,
      title: post.title,
      content: post.content,
      images: JSON.parse(post.images || '[]'),
      month: post.month,
      is_premium: post.is_premium === 1,
      trade_result: (post as any).trade_result || null,
      contract_address: (post as any).contract_address || null,
      created_at: post.created_at,
      updated_at: post.updated_at,
    }, request);
  }

  if (path === '/api/win-rate' && request.method === 'GET') {
    const totalWins = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE trade_result = 'win'").first<{ count: number }>();
    const totalLosses = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE trade_result = 'lose'").first<{ count: number }>();

    const wins = totalWins?.count || 0;
    const losses = totalLosses?.count || 0;
    const total = wins + losses;
    const allTimeWinRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const monthlyStats = await env.DB.prepare(`
      SELECT
        month,
        SUM(CASE WHEN trade_result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN trade_result = 'lose' THEN 1 ELSE 0 END) as losses
      FROM posts
      WHERE trade_result IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
    `).all<{ month: string; wins: number; losses: number }>();

    const monthly = (monthlyStats.results || []).map(m => ({
      month: m.month,
      label: formatMonthLabel(m.month),
      wins: m.wins,
      losses: m.losses,
      total: m.wins + m.losses,
      winRate: m.wins + m.losses > 0 ? Math.round((m.wins / (m.wins + m.losses)) * 100) : 0,
    }));

    return jsonResponse({
      allTime: { wins, losses, total, winRate: allTimeWinRate },
      monthly,
    }, request);
  }

  return errorResponse('Not found', 404, request);
}
