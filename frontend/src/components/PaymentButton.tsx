'use client';

import { useState, useEffect } from 'react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/app';
import { createPaymentReference, verifyPayment, checkPaymentStatus, retryVerifyPayment, getSettings } from '@/lib/api';
import { cn } from '@/lib/utils';

const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || '';

interface PaymentButtonProps {
  className?: string;
  onSuccess?: () => void;
}

export function PaymentButton({ className, onSuccess }: PaymentButtonProps) {
  const { wallet, isConnected, refreshSubscription, connection } = useWallet();
  const { publicKey, sendTransaction } = useSolanaWallet();
  const { settings, setSettings, addToast } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'idle' | 'creating' | 'signing' | 'verifying' | 'checking'>('idle');
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [showCheckStatus, setShowCheckStatus] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const response = await getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    }
    loadSettings();
  }, [setSettings]);

  const isPaused = settings?.is_paused;
  const price = settings?.price_sol || 0.5;

  useEffect(() => {
    if (!wallet) return;

    const storedRef = localStorage.getItem(`pending_payment_${wallet}`);
    if (storedRef) {

      checkPaymentStatus(storedRef).then((result) => {
        if (result.success && result.data?.found && result.data.status !== 'expired') {

          setPendingReference(storedRef);
          setShowCheckStatus(true);
        } else {

          localStorage.removeItem(`pending_payment_${wallet}`);
        }
      }).catch(() => {

        localStorage.removeItem(`pending_payment_${wallet}`);
      });
    }
  }, [wallet]);

  const handlePayment = async () => {
    if (!wallet || !publicKey || isProcessing || isPaused) return;

    setIsProcessing(true);
    setShowCheckStatus(false);
    let currentReference: string | null = null;

    try {

      setStep('creating');
      const refResponse = await createPaymentReference(wallet);
      if (!refResponse.success || !refResponse.data) {
        throw new Error(refResponse.error || 'Failed to create payment reference');
      }

      const { reference, amount } = refResponse.data;
      currentReference = reference;

      setStep('signing');

      if (!TREASURY_WALLET) {
        throw new Error('Treasury wallet not configured');
      }

      const toPubkey = new PublicKey(TREASURY_WALLET);
      const referenceKeypair = Keypair.generate();

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: publicKey,
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      transaction.instructions[0].keys.push({
        pubkey: referenceKeypair.publicKey,
        isSigner: false,
        isWritable: false,
      });

      const signature = await sendTransaction(transaction, connection);

      localStorage.setItem(`pending_payment_${wallet}`, reference);
      setPendingReference(reference);

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      setStep('verifying');
      const verifyResponse = await verifyPayment(reference, signature);
      if (!verifyResponse.success || !verifyResponse.data?.success) {

        setShowCheckStatus(true);
        throw new Error(verifyResponse.error || 'Payment verification failed. Click "Check Status" to retry.');
      }

      localStorage.removeItem(`pending_payment_${wallet}`);
      setPendingReference(null);
      setShowCheckStatus(false);

      await refreshSubscription();
      addToast('success', 'Subscription activated! Welcome to Premium.');
      onSuccess?.();
    } catch (error) {
      console.error('Payment error:', error);
      const message = error instanceof Error ? error.message : 'Payment failed';

      if (!message.includes('User rejected') && message !== 'Transaction cancelled') {
        addToast('error', message);
      }
    } finally {
      setIsProcessing(false);
      setStep('idle');
    }
  };

  const handleCheckStatus = async () => {
    if (!pendingReference || isProcessing) return;

    setIsProcessing(true);
    setStep('checking');
    try {

      const result = await retryVerifyPayment(pendingReference);

      if (result.success && result.data?.success) {

        localStorage.removeItem(`pending_payment_${wallet}`);
        setPendingReference(null);
        setShowCheckStatus(false);

        await refreshSubscription();
        addToast('success', 'Payment verified! Subscription activated.');
        onSuccess?.();
      } else {

        const statusResult = await checkPaymentStatus(pendingReference);

        if (statusResult.data?.status === 'completed') {
          localStorage.removeItem(`pending_payment_${wallet}`);
          setPendingReference(null);
          setShowCheckStatus(false);
          await refreshSubscription();
          addToast('success', 'Payment already verified! Subscription active.');
          onSuccess?.();
        } else if (statusResult.data?.status === 'expired') {
          localStorage.removeItem(`pending_payment_${wallet}`);
          setPendingReference(null);
          setShowCheckStatus(false);
          addToast('error', 'Payment expired. Please try again.');
        } else {
          addToast('error', result.data?.error || 'Payment not yet confirmed on chain. Please wait and try again.');
        }
      }
    } catch (error) {
      console.error('Check status error:', error);
      addToast('error', 'Failed to check payment status');
    } finally {
      setIsProcessing(false);
      setStep('idle');
    }
  };

  if (!isConnected) {
    return (
      <button disabled className={cn('btn bg-bg-tertiary text-text-muted cursor-not-allowed', className)}>
        Connect wallet to subscribe
      </button>
    );
  }

  if (isPaused) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button disabled className={cn('btn bg-bg-tertiary text-text-muted cursor-not-allowed', className)}>
          Subscriptions Paused
        </button>
        {settings?.pause_message && (
          <p className="text-sm text-text-muted text-center">{settings.pause_message}</p>
        )}
      </div>
    );
  }

  if (showCheckStatus && pendingReference) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleCheckStatus}
          disabled={isProcessing}
          className={cn(
            'btn btn-secondary relative overflow-hidden',
            isProcessing && 'cursor-wait',
            className
          )}
        >
          {isProcessing && <div className="absolute inset-0 shimmer" />}
          <span className="relative flex items-center gap-2">
            {step === 'checking' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check Payment Status
              </>
            )}
          </span>
        </button>
        <button
          onClick={() => {
            localStorage.removeItem(`pending_payment_${wallet}`);
            setPendingReference(null);
            setShowCheckStatus(false);
          }}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Cancel and start new payment
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing}
      className={cn(
        'btn btn-primary relative overflow-hidden',
        isProcessing && 'cursor-wait',
        className
      )}
    >
      {isProcessing && (
        <div className="absolute inset-0 shimmer" />
      )}
      <span className="relative flex items-center gap-2">
        {step === 'creating' && (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating payment...
          </>
        )}
        {step === 'signing' && (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sign in wallet...
          </>
        )}
        {step === 'verifying' && (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Verifying...
          </>
        )}
        {step === 'idle' && (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Subscribe for {price} SOL
          </>
        )}
      </span>
    </button>
  );
}
