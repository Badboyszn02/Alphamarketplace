

import type { RequestContext } from '../types';

export async function withAuth(ctx: RequestContext): Promise<void> {
  const cookies = ctx.request.headers.get('Cookie') || '';
  const sessionToken = cookies.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];

  if (sessionToken) {
    const session = await ctx.env.DB.prepare(
      'SELECT wallet FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(sessionToken).first<{ wallet: string }>();

    if (session) {
      ctx.wallet = session.wallet;
    }
  }
}
