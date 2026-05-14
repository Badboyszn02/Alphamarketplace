'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/app';
import { getSettings } from '@/lib/api';
import { PaymentButton } from '@/components/PaymentButton';
import { formatSol, getDaysRemaining } from '@/lib/utils';

export default function PricingPage() {
  const { isPremium, subscription, isConnected } = useWallet();
  const { settings, setSettings } = useAppStore();

  useEffect(() => {
    async function loadSettings() {
      const response = await getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    }
    loadSettings();
  }, [setSettings]);

  const price = settings?.price_sol || 0.5;
  const isPaused = settings?.is_paused || false;

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Simple <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            One plan. Full access. No hidden fees.
          </p>
        </div>

        {isPremium && subscription && (
          <div className="mb-12 p-6 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-emerald/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-text-primary">Active Premium Subscription</h3>
                <p className="text-text-secondary">
                  {subscription.daysRemaining} days remaining | Expires {new Date(subscription.expiresAt!).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-8 md:p-10 max-w-lg mx-auto">

          <div className="text-center mb-8">
            <span className="premium-badge text-sm px-3 py-1">Most Popular</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-text-primary text-center mb-2">
            Premium Access
          </h2>
          <p className="text-text-secondary text-center mb-8">
            Full access to all signals and content
          </p>

          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-display text-5xl font-bold gradient-text">{price}</span>
              <span className="text-text-secondary text-xl">SOL</span>
            </div>
            <p className="text-text-muted mt-2">per month (30 days)</p>
          </div>

          <ul className="space-y-4 mb-10">
            {[
              'All premium trading signals',
              'Win gallery with screenshots',
              'Entry & exit points',
              'Market analysis',
              'Monthly content archives',
              'Early renewal extends subscription',
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-text-secondary">
                <svg className="w-5 h-5 text-accent-emerald flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {isPaused ? (
            <div className="text-center p-4 rounded-xl bg-amber-900/20 border border-amber-600/30">
              <p className="text-amber-200">
                {settings?.pause_message || 'New subscriptions are temporarily paused.'}
              </p>
            </div>
          ) : isPremium ? (
            <div className="space-y-4">
              <PaymentButton className="w-full py-4 text-lg" />
              <p className="text-center text-text-muted text-sm">
                Renew early to extend your subscription by 30 days
              </p>
            </div>
          ) : (
            <PaymentButton className="w-full py-4 text-lg" />
          )}
        </div>

        <div className="mt-20">
          <h2 className="font-display text-2xl font-bold text-text-primary text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'How does payment work?',
                a: 'Payments are made directly on-chain using Solana. Connect your Phantom or Solflare wallet, sign the transaction, and your subscription is activated instantly.',
              },
              {
                q: 'What happens if I renew early?',
                a: 'Early renewal extends your current subscription by 30 days from your existing expiry date. You never lose days by renewing early.',
              },
              {
                q: 'Can I get a refund?',
                a: 'Due to the nature of blockchain payments and instant content access, all sales are final. Make sure to review the free previews before subscribing.',
              },
              {
                q: 'What if subscriptions are paused?',
                a: 'If subscriptions are paused, existing subscribers keep their access until expiry. No new subscriptions or renewals are processed during the pause.',
              },
              {
                q: 'Do I need to provide email?',
                a: 'No! We use wallet-based authentication only. Your wallet address is your identity - no email or personal information required.',
              },
            ].map((item, index) => (
              <div key={index} className="card p-6">
                <h3 className="font-display font-semibold text-text-primary mb-2">{item.q}</h3>
                <p className="text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/disclaimer" className="text-text-muted hover:text-text-secondary transition-colors text-sm">
            Read our full disclaimer â†’
          </Link>
        </div>
      </div>
    </div>
  );
}
