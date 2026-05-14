'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';

export function Header() {
  const {
    wallet,
    formattedWallet,
    isConnected,
    isConnecting,
    hasPhantom,
    hasSolflare,
    isPremium,
    isAdmin,
    connect,
    connectToWallet,
    disconnect,
    showWalletModal,
    closeWalletModal,
    needsAuth,
    authenticateWallet,
  } = useWallet();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-transparent border-b border-border-subtle/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            <div className="flex items-center gap-2">

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-text-secondary hover:text-text-primary"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold to-accent-goldDark flex items-center justify-center shadow-glow-gold">
                  <span className="text-bg-primary font-display font-bold text-xl">H</span>
                </div>
                <span className="font-display font-semibold text-xl text-text-primary group-hover:text-accent-gold transition-colors hidden sm:block logo-animated">
                  Alpha Signal
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">
                Home
              </Link>
              <Link href="/wins" className="text-text-secondary hover:text-text-primary transition-colors">
                Wins
              </Link>
              <Link href="/loses" className="text-text-secondary hover:text-text-primary transition-colors">
                Loses
              </Link>
              <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/disclaimer" className="text-text-secondary hover:text-text-primary transition-colors">
                Disclaimer
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {isConnected ? (
                <div className="relative">
                  <Link
                    href={isAdmin ? '/admin' : '/profile'}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-tertiary border border-border-subtle hover:border-accent-gold/30 transition-all"
                  >
                    {isPremium && (
                      <span className="premium-badge">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        PRO
                      </span>
                    )}
                    <span className="text-sm text-text-primary font-medium">
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </Link>
                </div>
              ) : needsAuth ? (
                <button
                  onClick={authenticateWallet}
                  disabled={isConnecting}
                  className="btn btn-primary animate-pulse"
                >
                  {isConnecting ? 'Signing...' : 'Sign to Continue'}
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="btn btn-primary"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border-subtle bg-bg-primary/95 backdrop-blur-sm">
            <nav className="flex flex-col p-4 gap-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
                Home
              </Link>
              <Link href="/wins" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
                Wins
              </Link>
              <Link href="/loses" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
                Loses
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
                Pricing
              </Link>
              <Link href="/disclaimer" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
                Disclaimer
              </Link>
            </nav>
          </div>
        )}
      </header>

      {showWalletModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeWalletModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-bg-card border border-border-subtle p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
              Connect Wallet
            </h2>
            <p className="text-text-secondary mb-6">
              Choose your Solana wallet to continue.
            </p>

            <div className="space-y-3">

              <button
                onClick={() => connectToWallet('Phantom')}
                disabled={isConnecting}
                className="wallet-btn w-full justify-between bg-bg-tertiary border border-border-subtle hover:border-accent-gold/30"
              >
                <span className="flex items-center gap-3">
                  <img src="https://phantom.app/img/logo.png" alt="Phantom" className="w-8 h-8 rounded-lg" />
                  <span className="font-medium text-text-primary">Phantom</span>
                </span>
                {hasPhantom ? (
                  <span className="text-xs text-accent-emerald">Detected</span>
                ) : (
                  <span className="text-xs text-text-muted">Not Detected</span>
                )}
              </button>

              <button
                onClick={() => connectToWallet('Solflare')}
                disabled={isConnecting}
                className="wallet-btn w-full justify-between bg-bg-tertiary border border-border-subtle hover:border-accent-gold/30"
              >
                <span className="flex items-center gap-3">
                  <img src="https://solflare.com/favicon.ico" alt="Solflare" className="w-8 h-8 rounded-lg" />
                  <span className="font-medium text-text-primary">Solflare</span>
                </span>
                {hasSolflare ? (
                  <span className="text-xs text-accent-emerald">Detected</span>
                ) : (
                  <span className="text-xs text-text-muted">Not Detected</span>
                )}
              </button>
            </div>

            <button
              onClick={closeWalletModal}
              className="mt-6 w-full py-3 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}
