'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGetPosts, adminDeletePost, adminMarkTradeResult } from '@/lib/api';
import { formatDate, formatMonthLabel, cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app';
import type { Post } from '@/types';

export default function AdminPostsPage() {
  const { addToast } = useAppStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [marking, setMarking] = useState<number | null>(null);

  async function loadPosts() {
    setLoading(true);
    const response = await adminGetPosts();
    if (response.success && response.data) {
      setPosts(response.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setDeleting(id);
    const response = await adminDeletePost(id);

    if (response.success) {
      addToast('success', 'Post deleted');
      setPosts(posts.filter(p => p.id !== id));
    } else {
      addToast('error', response.error || 'Failed to delete post');
    }
    setDeleting(null);
  }

  async function handleMarkResult(id: number, result: 'win' | 'lose' | null) {
    setMarking(id);
    const response = await adminMarkTradeResult(id, result);

    if (response.success) {
      addToast('success', result ? `Marked as ${result}` : 'Cleared result');
      setPosts(posts.map(p => p.id === id ? { ...p, trade_result: result } : p));
    } else {
      addToast('error', response.error || 'Failed to mark result');
    }
    setMarking(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Posts</h1>
          <p className="text-text-secondary">Manage your content and signals.</p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="skeleton h-5 w-1/3 mb-2" />
                  <div className="skeleton h-4 w-1/4" />
                </div>
                <div className="skeleton h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-text-primary mb-2">No posts yet</h3>
          <p className="text-text-secondary mb-6">Get started by creating your first post.</p>
          <Link href="/admin/posts/new" className="btn btn-primary">
            Create Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-lg font-semibold text-text-primary truncate">
                      {post.title}
                    </h3>
                    {post.is_premium && (
                      <span className="premium-badge flex-shrink-0">PRO</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>{formatMonthLabel(post.month)}</span>
                    <span>|</span>
                    <span>{formatDate(post.created_at)}</span>
                    {(post as any).trade_result && (
                      <>
                        <span>|</span>
                        <span className={cn(
                          'font-medium',
                          (post as any).trade_result === 'win' ? 'text-accent-emerald' : 'text-red-400'
                        )}>
                          {(post as any).trade_result === 'win' ? 'WIN' : 'LOSE'}
                        </span>
                      </>
                    )}
                    {post.images.length > 0 && (
                      <>
                        <span>|</span>
                        <span>{post.images.length} image{post.images.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">

                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => handleMarkResult(post.id, 'win')}
                      disabled={marking === post.id}
                      className={cn(
                        'px-2 py-1 text-xs rounded-lg transition-colors',
                        (post as any).trade_result === 'win'
                          ? 'bg-accent-emerald/20 text-accent-emerald'
                          : 'bg-bg-tertiary text-text-muted hover:text-accent-emerald hover:bg-accent-emerald/10'
                      )}
                    >
                      Win
                    </button>
                    <button
                      onClick={() => handleMarkResult(post.id, 'lose')}
                      disabled={marking === post.id}
                      className={cn(
                        'px-2 py-1 text-xs rounded-lg transition-colors',
                        (post as any).trade_result === 'lose'
                          ? 'bg-red-900/20 text-red-400'
                          : 'bg-bg-tertiary text-text-muted hover:text-red-400 hover:bg-red-900/10'
                      )}
                    >
                      Lose
                    </button>
                    {(post as any).trade_result && (
                      <button
                        onClick={() => handleMarkResult(post.id, null)}
                        disabled={marking === post.id}
                        className="px-2 py-1 text-xs rounded-lg bg-bg-tertiary text-text-muted hover:text-text-secondary transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deleting === post.id}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    {deleting === post.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
