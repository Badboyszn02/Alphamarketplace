'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { getPost } from '@/lib/api';
import { PaymentButton } from '@/components/PaymentButton';
import { formatDate, formatMonthLabel, cn } from '@/lib/utils';
import type { Post } from '@/types';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { wallet, isPremium, isAdmin } = useWallet();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const postId = parseInt(params.id as string, 10);

  useEffect(() => {
    async function loadPost() {
      if (isNaN(postId)) {
        setError('Invalid post ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await getPost(postId, wallet || undefined);

      if (response.success && response.data) {
        setPost(response.data);
      } else {
        setError(response.error || 'Post not found');
      }

      setLoading(false);
    }

    loadPost();
  }, [postId, wallet]);

  const isLocked = post?.is_premium && !isPremium && !isAdmin;

  if (loading) {
    return (
      <div className="min-h-screen py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="skeleton h-8 w-2/3 mb-4" />
          <div className="skeleton h-4 w-1/4 mb-8" />
          <div className="skeleton h-4 w-full mb-3" />
          <div className="skeleton h-4 w-full mb-3" />
          <div className="skeleton h-4 w-3/4 mb-6" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-bg-tertiary flex items-center justify-center">
            <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Post Not Found</h1>
          <p className="text-text-secondary mb-6">{error || 'The post you\'re looking for doesn\'t exist.'}</p>
          <Link href="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-20">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to signals
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {post.is_premium && (
              <span className="premium-badge">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                PRO
              </span>
            )}
            <span className="text-text-muted text-sm">
              {formatMonthLabel(post.month)}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
            {isLocked ? 'Premium Signal' : post.title}
          </h1>

          <time className="text-text-secondary">
            {formatDate(post.created_at)}
          </time>

          {!isLocked && (post as any).contract_address && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-bg-tertiary border border-border-subtle">
              <span className="text-text-muted text-sm">Contract:</span>
              <code className="text-text-primary font-mono text-sm flex-1 truncate">
                {(post as any).contract_address}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText((post as any).contract_address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded bg-accent-gold/20 text-accent-gold text-xs hover:bg-accent-gold/30 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </header>

        {isLocked ? (
          <div className="relative py-12">

            <div className="flex items-center justify-center">
              <div className="text-center p-8 rounded-2xl bg-bg-card border border-border-subtle max-w-md mx-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-gold/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
                  Premium Content
                </h3>
                <p className="text-text-secondary mb-6">
                  This signal contains exclusive alpha including ticker, contract address, and full analysis. Subscribe to unlock.
                </p>
                <PaymentButton className="w-full" />
              </div>
            </div>
          </div>
        ) : (
          <>

            <div className="prose-content" dangerouslySetInnerHTML={{ __html: post.content }} />

            {post.images.length > 0 && (
              <div className="mt-8 space-y-6">
                {post.images.map((image, index) => (
                  <figure key={index} className="rounded-xl overflow-hidden border border-border-subtle">
                    <img
                      src={image}
                      alt={`${post.title} - Image ${index + 1}`}
                      className="w-full"
                      loading="lazy"
                    />
                  </figure>
                ))}
              </div>
            )}
          </>
        )}

        <footer className="mt-12 pt-8 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-text-secondary hover:text-accent-gold transition-colors"
            >
              ← All Calls
            </Link>
            <Link
              href="/wins"
              className="text-text-secondary hover:text-accent-gold transition-colors"
            >
              Win Gallery →
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
