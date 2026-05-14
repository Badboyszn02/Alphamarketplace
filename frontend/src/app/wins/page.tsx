'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/app';
import { getPosts, getSettings } from '@/lib/api';
import { PostCard } from '@/components/PostCard';
import { MonthFilter } from '@/components/MonthFilter';
import { PaymentButton } from '@/components/PaymentButton';
import type { PostPreview, MonthGroup } from '@/types';

export default function WinsPage() {
  const { isPremium, isAdmin } = useWallet();
  const { selectedMonth, setSettings } = useAppStore();
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [months, setMonths] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const settingsResponse = await getSettings();
      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
      }

      const postsResponse = await getPosts(selectedMonth || undefined);
      if (postsResponse.success && postsResponse.data) {

        setPosts(postsResponse.data.posts.filter((p) => (p as any).trade_result === 'win'));
        setMonths(postsResponse.data.months);
      }

      setLoading(false);
    }

    loadData();
  }, [selectedMonth, setSettings]);

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 mb-6">
            <svg className="w-4 h-4 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm text-accent-emerald font-medium">Verified Results</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Win <span className="gradient-text-emerald">Gallery</span>
          </h1>

          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Real trades, real profits. Every win documented with screenshots.
            {!isPremium && !isAdmin && ' Subscribe to see all winning calls with full details.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary">Filter by month:</span>
          </div>
          <MonthFilter months={months} />
        </div>

        {!isPremium && !isAdmin && (
          <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-accent-gold/10 to-accent-emerald/10 border border-accent-gold/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
                  Unlock Full Win Gallery
                </h3>
                <p className="text-text-secondary">
                  Get complete access to all winning trades with entry/exit points and analysis.
                </p>
              </div>
              <PaymentButton className="w-full md:w-auto" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-6 h-64">
                <div className="skeleton h-6 w-3/4 mb-4" />
                <div className="skeleton h-4 w-1/4 mb-6" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-bg-tertiary flex items-center justify-center">
              <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold text-text-primary mb-2">No wins posted yet</h3>
            <p className="text-text-secondary">Check back soon for new winning trades!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} isPremium={isPremium || isAdmin} locked={!isPremium && !isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
