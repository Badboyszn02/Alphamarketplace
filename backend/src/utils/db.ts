
import type { Env, Setting, SiteSettings } from '../types';

export async function getSettings(db: D1Database): Promise<SiteSettings> {
  const results = await db.prepare('SELECT key, value FROM settings').all<Setting>();

  const settings: Record<string, string> = {};
  for (const row of results.results || []) {
    settings[row.key] = row.value;
  }

  return {
    is_paused: settings.is_paused === 'true',
    pause_message: settings.pause_message || '',
    price_sol: parseFloat(settings.price_sol || '0.5'),
    subscription_days: parseInt(settings.subscription_days || '30', 10),
  };
}

export async function updateSetting(
  db: D1Database,
  key: string,
  value: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`
    )
    .bind(key, value, value)
    .run();
}

export function isAdminWallet(wallet: string, env: Env): boolean {
  const adminWallets = (env.ADMIN_WALLETS || '').split(',').map((w) => w.trim().toLowerCase());
  return adminWallets.includes(wallet.toLowerCase());
}

export async function ensureUser(db: D1Database, wallet: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (wallet) VALUES (?)
       ON CONFLICT(wallet) DO UPDATE SET updated_at = datetime('now')`
    )
    .bind(wallet)
    .run();
}

export async function getSubscriptionStatus(
  db: D1Database,
  wallet: string
): Promise<{ isActive: boolean; expiresAt: string | null; daysRemaining: number | null }> {
  const result = await db
    .prepare('SELECT expires_at FROM subscriptions WHERE wallet = ?')
    .bind(wallet)
    .first<{ expires_at: string }>();

  if (!result) {
    return { isActive: false, expiresAt: null, daysRemaining: null };
  }

  const expiresAt = new Date(result.expires_at);
  const now = new Date();
  const isActive = expiresAt > now;
  const daysRemaining = isActive
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    isActive,
    expiresAt: result.expires_at,
    daysRemaining,
  };
}

export async function extendSubscription(
  db: D1Database,
  wallet: string,
  days: number
): Promise<string> {

  const current = await db
    .prepare('SELECT expires_at FROM subscriptions WHERE wallet = ?')
    .bind(wallet)
    .first<{ expires_at: string }>();

  let newExpiry: Date;

  if (current) {

    const currentExpiry = new Date(current.expires_at);
    const now = new Date();
    const baseDate = currentExpiry > now ? currentExpiry : now;
    newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    await db
      .prepare(
        `UPDATE subscriptions
         SET expires_at = ?, updated_at = datetime('now')
         WHERE wallet = ?`
      )
      .bind(newExpiry.toISOString(), wallet)
      .run();
  } else {

    newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await db
      .prepare(
        `INSERT INTO subscriptions (wallet, expires_at)
         VALUES (?, ?)`
      )
      .bind(wallet, newExpiry.toISOString())
      .run();
  }

  return newExpiry.toISOString();
}

export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function generatePreview(content: string, maxLength = 150): string {
  const stripped = content.replace(/<[^>]*>/g, '');
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).trim() + '...';
}
