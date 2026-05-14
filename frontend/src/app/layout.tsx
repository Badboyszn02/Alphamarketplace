import type { Metadata } from 'next';
import ClientLayout from './ClientLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alpha Signal | Premium Crypto Insights',
  description: 'Get exclusive crypto trading signals, market analysis, and proven strategies from a top trader. Join the premium community.',
  keywords: ['crypto', 'trading', 'signals', 'alpha', 'solana', 'premium'],
  openGraph: {
    title: 'Alpha Signal | Premium Crypto Insights',
    description: 'Exclusive crypto trading signals and market analysis.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Signal | Premium Crypto Insights',
    description: 'Exclusive crypto trading signals and market analysis.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
