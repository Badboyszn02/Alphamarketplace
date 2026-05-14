-- Hussayn Signal Database Schema
-- Run with: wrangler d1 execute hussayn-signal-db --file=./schema.sql

-- Users table (wallet-based identity)
CREATE TABLE IF NOT EXISTS users (
  wallet TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (wallet) REFERENCES users(wallet)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT DEFAULT '[]', -- JSON array of image URLs
  month TEXT NOT NULL, -- Format: YYYY-MM
  is_premium INTEGER DEFAULT 1, -- 1 = premium, 0 = free
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE, -- Payment reference pubkey
  wallet TEXT NOT NULL,
  amount REAL NOT NULL, -- Amount in SOL
  tx_signature TEXT, -- Solana transaction signature
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  expires_at TEXT NOT NULL, -- Reference expiry
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (wallet) REFERENCES users(wallet)
);

-- Settings table (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table (for wallet auth)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (wallet) REFERENCES users(wallet)
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('is_paused', 'false');
INSERT OR IGNORE INTO settings (key, value) VALUES ('pause_message', 'New subscriptions are temporarily paused. Please check back later.');
INSERT OR IGNORE INTO settings (key, value) VALUES ('price_sol', '0.5');
INSERT OR IGNORE INTO settings (key, value) VALUES ('subscription_days', '30');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_wallet ON subscriptions(wallet);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_month ON posts(month);
CREATE INDEX IF NOT EXISTS idx_posts_premium ON posts(is_premium);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_wallet ON payments(wallet);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_sessions_wallet ON sessions(wallet);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
