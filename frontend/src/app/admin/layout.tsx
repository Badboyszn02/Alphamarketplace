'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, isAdmin, wallet, disconnect } = useWallet();
  const [initialCheck, setInitialCheck] = useState(true);

  useEffect(() => {

    if (initialCheck) {
      const timer = setTimeout(() => {
        setInitialCheck(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [initialCheck]);

  useEffect(() => {

    if (!initialCheck && !isConnected && !isAdmin) {
      router.push('/');
    }
  }, [initialCheck, isConnected, isAdmin, router]);

  if (initialCheck && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-accent-gold border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">You don&apos;t have permission to access this area.</p>
          <Link href="/" className="btn btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      <div className="bg-bg-secondary border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-display font-semibold text-text-primary">
                Admin Dashboard
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/admin" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Overview
                </Link>
                <Link href="/admin/posts" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Posts
                </Link>
                <Link href="/admin/settings" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-muted font-mono hidden sm:block">
                {wallet?.slice(0, 4)}...{wallet?.slice(-4)}
              </span>
              <button
                onClick={() => {
                  disconnect();
                  router.push('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-sm hover:bg-red-900/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
