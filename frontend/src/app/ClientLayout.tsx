'use client';

import { ReactNode } from 'react';
import { WalletProvider } from '@/components/WalletProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toasts } from '@/components/Toast';
import './globals.css';

interface Props {
    children: ReactNode;
}

export default function ClientLayout({ children }: Props) {
    return (
        <WalletProvider>
            <Header />
            <main className="flex-1 pt-16 md:pt-20">
                {children}
            </main>
            <Footer />
            <Toasts />
        </WalletProvider>
    );
}
