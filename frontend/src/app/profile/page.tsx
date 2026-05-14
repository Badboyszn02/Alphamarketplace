'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { getUserProfile, setUsername } from '@/lib/api';
import { useAppStore } from '@/stores/app';
import { PaymentButton } from '@/components/PaymentButton';
import { formatWallet } from '@/lib/wallet';

interface SubscriptionInfo {
    isActive: boolean;
    expiresAt: string | null;
    daysLeft: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const { wallet, isConnected, isPremium, disconnect } = useWallet();
    const { addToast } = useAppStore();

    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [username, setUsernameState] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isConnected) {
            router.push('/');
            return;
        }

        async function loadProfile() {
            if (!wallet) return;

            setLoading(true);

            const profileResponse = await getUserProfile();
            if (profileResponse.success && profileResponse.data) {
                setUsernameState(profileResponse.data.username || '');
                setNewUsername(profileResponse.data.username || '');

                if (profileResponse.data.subscription) {
                    const expiresAt = profileResponse.data.subscription.expires_at;
                    const daysLeft = expiresAt
                        ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : 0;

                    setSubscription({
                        isActive: profileResponse.data.subscription.is_active,
                        expiresAt,
                        daysLeft: Math.max(0, daysLeft),
                    });
                }
            }

            setLoading(false);
        }

        loadProfile();
    }, [wallet, isConnected, router]);

    async function handleSaveUsername() {
        if (!newUsername.trim()) {
            addToast('error', 'Username cannot be empty');
            return;
        }

        if (newUsername.trim().length < 3) {
            addToast('error', 'Username must be at least 3 characters');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(newUsername.trim())) {
            addToast('error', 'Username can only contain letters, numbers, and underscores');
            return;
        }

        setSavingUsername(true);

        const response = await setUsername(newUsername.trim());

        if (response.success && response.data) {
            setUsernameState(response.data.username);
            setNewUsername('');
            addToast('success', 'Username saved successfully!');
        } else {
            addToast('error', response.error || 'Failed to save username');
        }

        setSavingUsername(false);
    }

    if (!isConnected) {
        return null;
    }

    const showRenewButton = subscription && subscription.isActive && subscription.daysLeft <= 5;

    return (
        <div className="min-h-screen py-12 md:py-20">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
                    Your Profile
                </h1>
                <p className="text-text-secondary mb-8">
                    Manage your account and subscription.
                </p>

                {loading ? (
                    <div className="space-y-6">
                        <div className="card p-6">
                            <div className="skeleton h-6 w-1/3 mb-4" />
                            <div className="skeleton h-4 w-1/2" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">

                        <div className="card p-6">
                            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                                Wallet
                            </h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-mono text-text-primary">{wallet}</p>
                                    <p className="text-sm text-text-muted mt-1">
                                        {formatWallet(wallet || '', 8)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                                Username
                            </h2>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Choose a username"
                                    className="flex-1"
                                    maxLength={20}
                                />
                                <button
                                    onClick={handleSaveUsername}
                                    disabled={savingUsername || newUsername.trim() === username}
                                    className="btn btn-primary"
                                >
                                    {savingUsername ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                            <p className="text-xs text-text-muted mt-2">
                                Usernames must be unique.
                            </p>
                        </div>

                        <div className="card p-6">
                            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                                Subscription
                            </h2>

                            {subscription?.isActive ? (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="premium-badge">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            PRO
                                        </span>
                                        <span className="text-accent-emerald font-medium">Active</span>
                                    </div>

                                    <p className="text-text-secondary mb-2">
                                        Expires: {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                    <p className="text-text-muted text-sm mb-4">
                                        {subscription.daysLeft} days remaining
                                    </p>

                                    {showRenewButton && (
                                        <div className="p-4 rounded-lg bg-accent-gold/10 border border-accent-gold/30 mb-4">
                                            <p className="text-accent-gold text-sm mb-3">
                                                âš ï¸ Your subscription expires soon! Renew now to avoid interruption.
                                            </p>
                                            <PaymentButton className="w-full" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-text-secondary mb-4">
                                        You don&apos;t have an active subscription.
                                    </p>
                                    <PaymentButton className="w-full" />
                                </div>
                            )}
                        </div>

                        <div className="card p-6">
                            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                                Session
                            </h2>
                            <button
                                onClick={() => {
                                    disconnect();
                                    router.push('/');
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Disconnect Wallet
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
