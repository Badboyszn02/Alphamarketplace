import Link from 'next/link';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Disclaimer
          </h1>
          <p className="text-text-secondary">
            Please read this carefully before using this service.
          </p>
        </div>

        <div className="card p-8 md:p-10 prose-content">
          <section className="mb-10">
            <h2>Not Financial Advice</h2>
            <p>
              The content provided on Alpha Signal, including but not limited to trading signals,
              market analysis, and educational content, is for informational purposes only and
              should not be construed as financial, investment, or trading advice.
            </p>
            <p>
              I am not a registered investment advisor, broker, or dealer. All trading involves
              risk, and you should never trade with money you cannot afford to lose.
            </p>
          </section>

          <section className="mb-10">
            <h2>My Track Record</h2>
            <p>
              I&apos;m proud of my 90%+ win rate and 5+ years of experience in the crypto markets.
              My signals are backed by thorough analysis and a proven trading methodology. I share
              my results transparently in the Win Gallery.
            </p>
            <p>
              However, past performance is not a guarantee of future results. The cryptocurrency
              market is highly volatile and unpredictable. While my track record is strong, every
              trade carries risk. Always do your own research to validate any signal before acting on it.
            </p>
          </section>

          <section className="mb-10">
            <h2>Trade Responsibly</h2>
            <p>
              <strong>Only trade what you can afford to lose.</strong> This is the golden rule of
              trading. No matter how confident you are in a trade or how good my signals are,
              never risk money you need for bills, rent, or other essentials.
            </p>
            <p>
              Use proper risk management: set stop losses, size your positions appropriately,
              and never put all your capital into a single trade. Smart risk management is what
              separates successful traders from the rest.
            </p>
          </section>

          <section className="mb-10">
            <h2>Your Responsibility</h2>
            <p>
              You are solely responsible for your own trading decisions. Before making any
              investment decision, you should:
            </p>
            <ul>
              <li>Conduct your own research and due diligence</li>
              <li>Consider your personal financial situation and risk tolerance</li>
              <li>Consult with qualified financial professionals if needed</li>
              <li>Never invest more than you can afford to lose</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2>Risk Disclosure</h2>
            <p>
              Trading cryptocurrencies involves significant risk of loss. Prices can be extremely
              volatile, and you may lose some or all of your investment. Leverage trading
              amplifies both potential profits and losses.
            </p>
            <p>
              Specific risks include but are not limited to: market volatility, liquidity risks,
              technical failures, regulatory changes, exchange hacks, and smart contract
              vulnerabilities.
            </p>
          </section>

          <section className="mb-10">
            <h2>No Liability</h2>
            <p>
              Alpha Signal and its operators shall not be held liable for any losses, damages,
              or claims arising from:
            </p>
            <ul>
              <li>Trading decisions made based on my content</li>
              <li>Technical issues or service interruptions</li>
              <li>Information that may be inaccurate or outdated</li>
              <li>Your reliance on any content provided</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2>Subscription Terms</h2>
            <p>
              All subscription payments are final and non-refundable. By subscribing, you
              acknowledge that:
            </p>
            <ul>
              <li>Payments are made directly on the Solana blockchain</li>
              <li>Subscription grants access for 30 days from payment or renewal</li>
              <li>Early renewal extends your existing subscription</li>
              <li>Subscriptions may be paused at any time at my discretion</li>
              <li>No refunds are provided for any reason</li>
            </ul>
          </section>

          <section>
            <h2>Changes to This Disclaimer</h2>
            <p>
              I reserve the right to modify this disclaimer at any time. Continued use of this
              service after changes constitutes acceptance of the modified terms.
            </p>
            <p className="text-text-muted text-sm mt-6">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-accent-gold hover:text-accent-goldLight transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
