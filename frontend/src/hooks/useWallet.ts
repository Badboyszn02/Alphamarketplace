'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAppStore } from '@/stores/app';
import { verifyWallet, getSession, logout, getSubscriptionStatus } from '@/lib/api';
import { formatWallet } from '@/lib/wallet';

export function useWallet() {
  const {
    wallet: adapterWallet,
    publicKey,
    connected,
    connecting,
    disconnect: adapterDisconnect,
    signMessage: adapterSignMessage,
    select,
    wallets,
    connect: adapterConnect,
  } = useSolanaWallet();

  const { connection } = useConnection();

  const {
    wallet,
    walletType,
    setWallet,
    subscription,
    setSubscription,
    isAdmin,
    setIsAdmin,
    addToast,
  } = useAppStore();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const walletAddress = publicKey?.toBase58() || null;

  const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
  const solflareWallet = wallets.find(w => w.adapter.name === 'Solflare');

  const hasPhantom = phantomWallet?.readyState === 'Installed';
  const hasSolflare = solflareWallet?.readyState === 'Installed';

  const [sessionCheckedFor, setSessionCheckedFor] = useState<string | null>(null);

  useEffect(() => {
    if (connected && walletAddress) {

      if (wallet === walletAddress) {
        setNeedsAuth(false);
      } else if (sessionCheckedFor === walletAddress) {

        setNeedsAuth(true);
      } else {

        const checkExistingSession = async () => {
          const response = await getSession();
          if (response.success && response.data && response.data.wallet === walletAddress) {

            setWallet(response.data.wallet, adapterWallet?.adapter?.name?.toLowerCase() as 'phantom' | 'solflare' || null);
            setIsAdmin(response.data.isAdmin);
            setNeedsAuth(false);

            const subResponse = await getSubscriptionStatus(response.data.wallet);
            if (subResponse.success && subResponse.data) {
              setSubscription(subResponse.data);
            }
          } else {

            setNeedsAuth(true);
          }
          setSessionCheckedFor(walletAddress);
        };
        checkExistingSession();
      }
    } else {
      setNeedsAuth(false);
    }
  }, [connected, walletAddress, wallet, sessionCheckedFor, adapterWallet, setWallet, setIsAdmin, setSubscription]);

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => setHasInitialized(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {

    if (hasInitialized && !connected && !connecting && wallet) {
      handleLogout();
    }
  }, [connected, connecting, wallet, hasInitialized]);

  const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

  useEffect(() => {
    if (!wallet) return;

    const checkExpiration = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          addToast('info', 'Session expired. Please reconnect your wallet.');
          handleLogout();
          adapterDisconnect().catch(() => { });
          window.location.href = '/';
        }
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60 * 1000);

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [wallet, adapterDisconnect, addToast]);

  const authenticateWallet = useCallback(async () => {
    if (!connected || !walletAddress || !adapterSignMessage) {
      addToast('error', 'Wallet not ready');
      return;
    }

    setIsAuthenticating(true);

    try {
      const timestamp = Date.now();
      const message = `Sign this message to authenticate with Alpha Signal.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;

      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await adapterSignMessage(encodedMessage);

      const bs58 = await import('bs58');
      const signature = bs58.default.encode(signatureBytes);

      const response = await verifyWallet(walletAddress, signature, message);

      if (!response.success) {
        addToast('error', response.error || 'Authentication failed');
        setIsAuthenticating(false);
        return;
      }

      const walletName = adapterWallet?.adapter?.name?.toLowerCase() || 'phantom';
      setWallet(walletAddress, walletName as 'phantom' | 'solflare');
      setNeedsAuth(false);

      const sessionResponse = await getSession();
      if (sessionResponse.success && sessionResponse.data) {
        setIsAdmin(sessionResponse.data.isAdmin);
      }

      const subResponse = await getSubscriptionStatus(walletAddress);
      if (subResponse.success && subResponse.data) {
        setSubscription(subResponse.data);
      }

      localStorage.setItem('lastActivity', Date.now().toString());
      addToast('success', 'Wallet connected');

    } catch (error: any) {
      console.error('Auth error:', error);
      if (error?.message?.includes('User rejected') || error?.message?.includes('cancelled')) {
        addToast('error', 'Signing cancelled');
      } else {
        addToast('error', 'Connection failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [connected, walletAddress, adapterSignMessage, adapterWallet, addToast, setWallet, setIsAdmin, setSubscription]);

  const connectToWallet = useCallback(async (walletName: 'Phantom' | 'Solflare') => {
    setShowWalletModal(false);

    const targetWallet = walletName === 'Phantom' ? phantomWallet : solflareWallet;

    if (!targetWallet) {
      const url = walletName === 'Phantom' ? 'https://phantom.app/' : 'https://solflare.com/';
      window.open(url, '_blank');
      return;
    }

    try {
      select(targetWallet.adapter.name);
      await new Promise(resolve => setTimeout(resolve, 200));
      await adapterConnect();
    } catch (err: any) {
      if (!err?.message?.includes('rejected')) {
        console.log('Connect initiated');
      }
    }
  }, [phantomWallet, solflareWallet, select, adapterConnect]);

  const connect = useCallback(() => {
    setShowWalletModal(true);
  }, []);

  const closeWalletModal = useCallback(() => {
    setShowWalletModal(false);
  }, []);

  const handleLogout = async () => {
    await logout();
    setWallet(null, null);
    setSubscription(null);
    setIsAdmin(false);
    setNeedsAuth(false);
    localStorage.removeItem('lastActivity');
  };

  const disconnect = useCallback(async () => {
    try {
      await adapterDisconnect();
    } catch (e) {
      console.error('Disconnect error:', e);
    }
    await handleLogout();
    addToast('info', 'Wallet disconnected');
    window.location.href = '/';
  }, [adapterDisconnect, addToast]);

  const refreshSubscription = useCallback(async () => {
    if (!wallet) return;
    const response = await getSubscriptionStatus(wallet);
    if (response.success && response.data) {
      setSubscription(response.data);
    }
  }, [wallet, setSubscription]);

  return {
    wallet,
    walletType,
    formattedWallet: wallet ? formatWallet(wallet) : null,
    isConnected: !!wallet,
    isConnecting: connecting || isAuthenticating,
    hasPhantom,
    hasSolflare,
    subscription,
    isAdmin,
    isPremium: subscription?.isActive || false,

    connect,
    connectToWallet,
    disconnect,
    showWalletModal,
    closeWalletModal,

    needsAuth,
    authenticateWallet,

    refreshSubscription,
    adapterWallet,
    publicKey,
    signMessage: adapterSignMessage,
    connection,
    walletAddress,
  };
}
