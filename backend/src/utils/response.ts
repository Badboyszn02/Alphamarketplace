

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8788',
  'https://signal-8tw.pages.dev',
];

export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get('Origin') || '';
  const headers = new Headers();

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (origin) {

    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400');

  return headers;
}

export function jsonResponse(data: unknown, request: Request, status = 200): Response {
  const headers = corsHeaders(request);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(message: string, status: number, request: Request): Response {
  return jsonResponse({ success: false, error: message }, request, status);
}

export function setCookieHeader(name: string, value: string, maxAge: number): string {
  return name + '=' + value + '; Path=/; HttpOnly; Secure=true; SameSite=None; Max-Age=' + maxAge;
}

export function deleteCookieHeader(name: string): string {
  return name + '=; Path=/; HttpOnly; Secure=true; SameSite=None; Max-Age=0';
}
