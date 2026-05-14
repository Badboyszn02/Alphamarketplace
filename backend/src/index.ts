
import { handleAuth } from './routes/auth';
import { handlePosts } from './routes/posts';
import { handlePayments } from './routes/payments';
import { handleAdmin } from './routes/admin';
import { handleUser } from './routes/user';
import { handleSettings } from './routes/settings';
import { handleSubscription } from './routes/subscription';
import type { Env, RequestContext } from './types';
import { errorResponse, corsHeaders } from './utils/response';

export default {
  async fetch(request: Request, env: Env, exeCtx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const ctx: RequestContext = { request, env, ctx: exeCtx, url };

    try {
      if (url.pathname.startsWith('/api/auth')) {
        return handleAuth(ctx);
      }

      if (url.pathname.startsWith('/api/posts') || url.pathname === '/api/win-rate') {
        return handlePosts(ctx);
      }

      if (url.pathname.startsWith('/api/payments')) {
        return handlePayments(ctx);
      }

      if (url.pathname.startsWith('/api/admin')) {
        return handleAdmin(ctx);
      }

      if (url.pathname.startsWith('/api/user')) {
        return handleUser(ctx);
      }

      if (url.pathname === '/api/settings') {
        return handleSettings(ctx);
      }

      if (url.pathname === '/api/subscription') {
        return handleSubscription(ctx);
      }

      if (url.pathname === '/' || url.pathname === '') {
        return new Response(
          JSON.stringify({ status: 'ok', message: 'Alpha Signal API is running' }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
        );
      }

      return errorResponse('Not found', 404, request);
    } catch (error) {
      console.error('API error:', error);
      return errorResponse('Internal server error', 500, request);
    }
  },
};
