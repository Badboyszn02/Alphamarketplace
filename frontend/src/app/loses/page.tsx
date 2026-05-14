'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/app';
import { getPosts, getSettings } from '@/lib/api';
import { PostCard } from '@/components/PostCard';
import { MonthFilter } from '@/components/MonthFilter';
import { PaymentButton } from '@/components/PaymentButton';
import type { PostPreview, MonthGroup } from '@/types';

export default function LosesPage() {
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

                setPosts(postsResponse.data.posts.filter((p) => (p as any).trade_result === 'lose'));
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/10 border border-red-900/20 mb-6">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        <span className="text-sm text-red-400 font-medium">Full Transparency</span>
                    </div>

                    <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
                        Loss <span className="text-red-400">Gallery</span>
                    </h1>

                    <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                        Transparency is key. Here are the trades that didn&apos;t work out.
                        No one wins 100% of the time.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <span className="text-text-secondary">Filter by month:</span>
                    </div>
                    <MonthFilter months={months} />
                </div>

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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-display text-xl font-semibold text-text-primary mb-2">No losses recorded</h3>
                        <p className="text-text-secondary">All trades have been wins so far!</p>
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
