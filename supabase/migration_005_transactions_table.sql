-- Migration 005: Add transactions table for tap-to-give ledger
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS transactions (
  id                        TEXT PRIMARY KEY DEFAULT ('txn_' || gen_random_uuid()::text),
  user_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id                TEXT REFERENCES charities(id),
  amount_cents              INT NOT NULL,
  type                      TEXT NOT NULL DEFAULT 'tap' CHECK (type IN ('tap','card','bank')),
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','settled','failed','refunded')),
  stripe_payment_intent_id  TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions"   ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also add stripe_customer_id and stripe_payment_method_id to profiles
-- (referenced by the webhook setup_intent.succeeded handler)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id  TEXT;
