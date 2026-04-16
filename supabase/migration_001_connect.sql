-- Migration 001: Stripe Connect + giving modes + transactions/settlements
-- Run in Supabase Dashboard → SQL Editor AFTER schema.sql
-- Safe: only ADDs columns and tables, never drops or recreates.

-- ─── profiles additions ───────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS giving_mode               TEXT NOT NULL DEFAULT 'intentional'
                                                       CHECK (giving_mode IN ('budget','open','intentional')),
  ADD COLUMN IF NOT EXISTS monthly_budget_cents      INT,
  ADD COLUMN IF NOT EXISTS remainder_preference      TEXT NOT NULL DEFAULT 'rollover'
                                                       CHECK (remainder_preference IN ('top_charity','split_even','rollover')),
  ADD COLUMN IF NOT EXISTS weekly_alert_cents        INT,
  ADD COLUMN IF NOT EXISTS onboarding_complete       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id  TEXT;

-- ─── charities additions ──────────────────────────────────────────────────────
ALTER TABLE charities
  ADD COLUMN IF NOT EXISTS stripe_account_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS ein                TEXT,
  ADD COLUMN IF NOT EXISTS org_type          TEXT NOT NULL DEFAULT '501c3'
                                               CHECK (org_type IN ('501c3','mutual_aid','personal','other')),
  ADD COLUMN IF NOT EXISTS tax_deductible    BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── transactions ────────────────────────────────────────────────────────────
-- Ledger entries for every tap/seed and one-time donation.
-- "tap" entries do NOT create a Stripe charge immediately (batched).
-- "one_time" entries create an immediate PaymentIntent.
CREATE TABLE IF NOT EXISTS transactions (
  id                        TEXT PRIMARY KEY DEFAULT ('txn_' || gen_random_uuid()::text),
  user_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id                TEXT NOT NULL REFERENCES charities(id),
  amount_cents              INT NOT NULL CHECK (amount_cents >= 1),
  type                      TEXT NOT NULL CHECK (type IN ('tap','one_time','budget_remainder')),
  status                    TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','settled','failed')),
  stripe_payment_intent_id  TEXT UNIQUE,
  settlement_id             TEXT,  -- FK added below after settlements table created
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions"   ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── settlements ─────────────────────────────────────────────────────────────
-- One row per batch transfer to a charity.
CREATE TABLE IF NOT EXISTS settlements (
  id                  TEXT PRIMARY KEY DEFAULT ('stl_' || gen_random_uuid()::text),
  charity_id          TEXT NOT NULL REFERENCES charities(id),
  total_cents         INT NOT NULL CHECK (total_cents >= 1),
  stripe_transfer_id  TEXT UNIQUE,
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','completed','failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
-- Service role writes; admins read via service role. No user-facing RLS needed.

-- Back-fill FK now that settlements exists
ALTER TABLE transactions
  ADD CONSTRAINT IF NOT EXISTS fk_transactions_settlement
  FOREIGN KEY (settlement_id) REFERENCES settlements(id);

-- Index for batch queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_pending
  ON transactions (user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_charity_pending
  ON transactions (charity_id, status) WHERE status = 'pending';

-- ─── user_charity_preferences ────────────────────────────────────────────────
-- Determines how unallocated budget is distributed at month-end.
CREATE TABLE IF NOT EXISTS user_charity_preferences (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id  TEXT NOT NULL REFERENCES charities(id),
  weight      INT NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, charity_id)
);

ALTER TABLE user_charity_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own preferences"   ON user_charity_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_charity_preferences FOR ALL    USING (auth.uid() = user_id);
