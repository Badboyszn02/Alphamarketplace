'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGetStats } from '@/lib/api';
import { formatNumber, formatSol } from '@/lib/utils';
import type { AdminStats } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const response = await adminGetStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
        <p className="text-text-secondary">Overview of your subscription platform.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-4 w-1/2 mb-4" />
              <div className="skeleton h-8 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="card p-6">
            <p className="text-text-secondary text-sm mb-2">Total Users</p>
            <p className="font-display text-3xl font-bold text-text-primary">
              {formatNumber(stats?.totalUsers || 0)}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-text-secondary text-sm mb-2">Active Subscribers</p>
            <p className="font-display text-3xl font-bold text-accent-emerald">
              {formatNumber(stats?.activeSubscribers || 0)}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-text-secondary text-sm mb-2">Total Posts</p>
            <p className="font-display text-3xl font-bold text-text-primary">
              {formatNumber(stats?.totalPosts || 0)}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-text-secondary text-sm mb-2">Total Revenue</p>
            <p className="font-display text-3xl font-bold gradient-text">
              {formatSol(stats?.revenue || 0)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/posts/new" className="card p-6 hover:border-accent-gold/30 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-accent-gold/10 flex items-center justify-center mb-4 group-hover:bg-accent-gold/20 transition-colors">
            <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-text-primary mb-1">Create Post</h3>
          <p className="text-text-secondary text-sm">Add a new signal or content post.</p>
        </Link>

        <Link href="/admin/posts" className="card p-6 hover:border-accent-gold/30 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-accent-gold/10 flex items-center justify-center mb-4 group-hover:bg-accent-gold/20 transition-colors">
            <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-text-primary mb-1">Manage Posts</h3>
          <p className="text-text-secondary text-sm">Edit or delete existing posts.</p>
        </Link>

        <Link href="/admin/settings" className="card p-6 hover:border-accent-gold/30 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-accent-gold/10 flex items-center justify-center mb-4 group-hover:bg-accent-gold/20 transition-colors">
            <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-text-primary mb-1">Settings</h3>
          <p className="text-text-secondary text-sm">Manage pause status and messages.</p>
        </Link>
      </div>
    </div>
  );
}
