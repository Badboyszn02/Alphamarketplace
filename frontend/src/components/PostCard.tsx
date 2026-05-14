'use client';

import Link from 'next/link';
import { formatDate, cn } from '@/lib/utils';
import type { PostPreview } from '@/types';

interface PostCardProps {
  post: PostPreview;
  isPremium: boolean;
  locked?: boolean;
}

export function PostCard({ post, isPremium, locked = false }: PostCardProps) {
  const isLocked = post.is_premium && !isPremium;
  const showHidden = isLocked && locked;

  const displayTitle = showHidden ? 'Premium Signal' : post.title;
  const displayPreview = showHidden
    ? 'This signal is exclusive to premium members. Subscribe to unlock full access to all trading calls, tickers, and contract addresses.'
    : post.preview;

  return (
    <Link href={`/post/${post.id}`}>
      <article
        className={cn(
          'card card-hover p-6 h-full flex flex-col',
          post.is_premium && 'win-card'
        )}
      >

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-text-primary line-clamp-2">
              {displayTitle}
            </h3>
            <time className="text-sm text-text-muted mt-1 block">
              {formatDate(post.created_at)}
            </time>
          </div>
          {post.is_premium && (
            <span className="premium-badge flex-shrink-0">
              {isLocked ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              PRO
            </span>
          )}
        </div>

        <p className="text-text-secondary text-sm leading-relaxed flex-1">
          {displayPreview}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
          {post.image_count > 0 && !showHidden && (
            <span className="flex items-center gap-1 text-text-muted text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {post.image_count}
            </span>
          )}

          {isLocked ? (
            <span className="text-accent-gold text-sm font-medium">
              Unlock with Premium
            </span>
          ) : (
            <span className="text-text-muted text-sm group-hover:text-accent-gold transition-colors">
              Read more
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
