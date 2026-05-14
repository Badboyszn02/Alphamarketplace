

import type { RequestContext, Payment } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';
import { withAuth, requireAuth } from './auth';
import { getSettings, ensureUser, extendSubscription } from '../utils/db';
import { generateReference } from '../utils/crypto';

async function verifyTransaction(
  rpcUrl: string,
  signature: string,
  expectedWallet: string,
  expectedTreasury: string,
  expectedAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
      }),
    });

    const data = await response.json() as any;

    if (!data.result) {
      return { success: false, error: 'Transaction not found on chain' };
    }

    const tx = data.result;

    if (tx.meta?.err) {
      return { success: false, error: 'Transaction failed on-chain' };
    }

    const preBalances = tx.meta?.preBalances || [];
    const postBalances = tx.meta?.postBalances || [];
    const accountKeys = tx.transaction?.message?.accountKeys || [];

    let treasuryIndex = -1;
    for (let i = 0; i < accountKeys.length; i++) {
      const key = typeof accountKeys[i] === 'string' ? accountKeys[i] : accountKeys[i]?.pubkey;
      if (key?.toLowerCase() === expectedTreasury.toLowerCase()) {
        treasuryIndex = i;
        break;
      }
    }

    if (treasuryIndex === -1) {
      return { success: false, error: 'Treasury not found in transaction' };
    }

    const received = postBalances[treasuryIndex] - preBalances[treasuryIndex];
    const expectedLamports = expectedAmount * 1e9;

    if (received < expectedLamports) {
      return { success: false, error: `Insufficient payment: expected ${expectedAmount} SOL, received ${received / 1e9} SOL` };
    }

    return { success: true };
  } catch (error) {
    console.error('verifyTransaction error:', error);
    return { success: false, error: 'Failed to verify transaction on chain' };
  }
}

export async function handlePayments(ctx: RequestContext): Promise<Response> {
  const { request, url, env } = ctx;
  const path = url.pathname;

  if (path === '/api/payments/initiate' && request.method === 'POST') {
    await withAuth(ctx);
    if (!ctx.wallet) return errorResponse('Unauthorized', 401, request);
    const wallet = ctx.wallet;

    const settings = await getSettings(env.DB);
    const amount = settings.price_sol || 0.5;

    const existing = await env.DB
      .prepare('SELECT * FROM payments WHERE wallet = ? AND status = ? AND expires_at > datetime("now")')
      .bind(wallet, 'pending')
      .first<Payment>();

    if (existing) {
      return jsonResponse({
        reference: existing.reference,
        amount: existing.amount,
        expiresAt: existing.expires_at,
        existing: true,
      }, request);
    }

    const reference = generateReference();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await env.DB
      .prepare('INSERT INTO payments (wallet, reference, amount, status, expires_at) VALUES (?, ?, ?, ?, ?)')
      .bind(wallet, reference, amount, 'pending', expiresAt)
      .run();

    return jsonResponse({
      reference,
      amount,
      treasury: env.TREASURY_WALLET || '',
      expiresAt,
    }, request);
  }

  if (path === '/api/payments/verify' && request.method === 'POST') {
    await withAuth(ctx);
    if (!ctx.wallet) return errorResponse('Unauthorized', 401, request);
    const wallet = ctx.wallet;

    const { reference, signature } = await request.json() as { reference: string; signature: string };

    if (!reference || !signature) {
      return errorResponse('Missing reference or signature', 400, request);
    }

    const payment = await env.DB
      .prepare('SELECT * FROM payments WHERE reference = ? AND wallet = ?')
      .bind(reference, wallet)
      .first<Payment>();

    if (!payment) {
      return errorResponse('Payment not found', 404, request);
    }

    if (payment.status === 'completed') {
      return jsonResponse({ success: true, message: 'Payment already verified' }, request);
    }

    if (new Date(payment.expires_at) < new Date()) {
      return errorResponse('Payment expired', 400, request);
    }

    const existingSignature = await env.DB
      .prepare('SELECT id FROM payments WHERE tx_signature = ?')
      .bind(signature)
      .first();

    if (existingSignature) {
      return errorResponse('Signature already used', 409, request);
    }

    const lockResult = await env.DB
      .prepare(`UPDATE payments SET tx_signature = ?, status = 'pending' WHERE reference = ? AND status = 'pending' AND tx_signature IS NULL`)
      .bind(signature, reference)
      .run();

    if (!lockResult.meta.changes || lockResult.meta.changes === 0) {
      return errorResponse('Payment already being processed', 409, request);
    }

    const rpcUrl = env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
    const verification = await verifyTransaction(
      rpcUrl,
      signature,
      wallet,
      env.TREASURY_WALLET || '',
      payment.amount
    );

    if (!verification.success) {
      await env.DB
        .prepare(`UPDATE payments SET tx_signature = NULL WHERE reference = ?`)
        .bind(reference)
        .run();
      return errorResponse(verification.error || 'Payment verification failed', 400, request);
    }

    const subscriptionDays = parseInt(env.SUBSCRIPTION_DAYS || '30', 10);

    await env.DB
      .prepare(`UPDATE payments SET status = 'completed', completed_at = datetime('now') WHERE reference = ?`)
      .bind(reference)
      .run();

    await extendSubscription(env.DB, wallet, subscriptionDays);

    return jsonResponse({ success: true, message: 'Payment verified and subscription activated' }, request);
  }

  if (path === '/api/payments/check-status' && request.method === 'GET') {
    await withAuth(ctx);
    if (!ctx.wallet) return errorResponse('Unauthorized', 401, request);
    const wallet = ctx.wallet;

    const reference = url.searchParams.get('reference');

    let payment: Payment | null = null;

    if (reference) {
      payment = await env.DB
        .prepare('SELECT * FROM payments WHERE reference = ? AND wallet = ?')
        .bind(reference, wallet)
        .first<Payment>();
    } else {
      payment = await env.DB
        .prepare('SELECT * FROM payments WHERE wallet = ? ORDER BY created_at DESC LIMIT 1')
        .bind(wallet)
        .first<Payment>();
    }

    if (!payment) {
      return jsonResponse({ found: false }, request);
    }

    return jsonResponse({
      found: true,
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      expiresAt: payment.expires_at,
      completedAt: payment.completed_at,
    }, request);
  }

  if (path === '/api/payments/retry-verify' && request.method === 'POST') {
    await withAuth(ctx);
    if (!ctx.wallet) return errorResponse('Unauthorized', 401, request);
    const wallet = ctx.wallet;

    const { reference } = await request.json() as { reference: string };

    if (!reference) {
      return errorResponse('Missing reference', 400, request);
    }

    const payment = await env.DB
      .prepare('SELECT * FROM payments WHERE reference = ? AND wallet = ?')
      .bind(reference, wallet)
      .first<Payment>();

    if (!payment) {
      return errorResponse('Payment not found', 404, request);
    }

    if (payment.status === 'completed') {
      return jsonResponse({ success: true, message: 'Payment already completed' }, request);
    }

    if (!payment.tx_signature) {
      return errorResponse('No transaction signature recorded', 400, request);
    }

    const rpcUrl = env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
    const verification = await verifyTransaction(
      rpcUrl,
      payment.tx_signature,
      wallet,
      env.TREASURY_WALLET || '',
      payment.amount
    );

    if (!verification.success) {
      return jsonResponse({ success: false, error: verification.error }, request);
    }

    const subscriptionDays = parseInt(env.SUBSCRIPTION_DAYS || '30', 10);

    await env.DB
      .prepare(`UPDATE payments SET status = 'completed', completed_at = datetime('now') WHERE reference = ?`)
      .bind(reference)
      .run();

    await extendSubscription(env.DB, wallet, subscriptionDays);

    return jsonResponse({ success: true, message: 'Payment verified and subscription activated' }, request);
  }

  return errorResponse('Not found', 404, request);
}
