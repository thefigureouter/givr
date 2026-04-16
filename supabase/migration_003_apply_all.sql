-- Migration 003: Apply all changes + fix trigger
-- Safe to run on a fresh database OR one that only has schema.sql applied.
-- All statements use IF NOT EXISTS / OR REPLACE / DO blocks.
-- Run this in Supabase Dashboard → SQL Editor.

-- ─── 1. Fix the trigger function (THIS is why signup was failing) ─────────────
--
-- The original handle_new_user() lacks SET search_path, which causes it to fail
-- on Supabase projects with hardened security (search_path = '' by default).
-- Without SET search_path = '', the function can't find 'profiles' (in public schema)
-- when executing from the auth schema context.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. profiles — add Stripe Connect + giving mode columns ──────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS giving_mode              TEXT NOT NULL DEFAULT 'intentional'
                                                      CHECK (giving_mode IN ('budget','open','intentional')),
  ADD COLUMN IF NOT EXISTS monthly_budget_cents     INT,
  ADD COLUMN IF NOT EXISTS remainder_preference     TEXT NOT NULL DEFAULT 'rollover'
                                                      CHECK (remainder_preference IN ('top_charity','split_even','rollover')),
  ADD COLUMN IF NOT EXISTS weekly_alert_cents       INT,
  ADD COLUMN IF NOT EXISTS onboarding_complete      BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 3. charities — add Stripe Connect + org metadata columns ────────────────

ALTER TABLE public.charities
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS ein               TEXT,
  ADD COLUMN IF NOT EXISTS org_type         TEXT NOT NULL DEFAULT '501c3'
                                              CHECK (org_type IN ('501c3','mutual_aid','personal','other')),
  ADD COLUMN IF NOT EXISTS tax_deductible   BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── 4. transactions table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transactions (
  id                       TEXT PRIMARY KEY DEFAULT ('txn_' || gen_random_uuid()::text),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id               TEXT NOT NULL REFERENCES public.charities(id),
  amount_cents             INT NOT NULL CHECK (amount_cents >= 1),
  type                     TEXT NOT NULL CHECK (type IN ('tap','one_time','budget_remainder')),
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','settled','failed')),
  stripe_payment_intent_id TEXT UNIQUE,
  settlement_id            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='Users can read own transactions') THEN
    CREATE POLICY "Users can read own transactions"   ON public.transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='Users can insert own transactions') THEN
    CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_pending
  ON public.transactions (user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_charity_pending
  ON public.transactions (charity_id, status) WHERE status = 'pending';

-- ─── 5. settlements table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.settlements (
  id                 TEXT PRIMARY KEY DEFAULT ('stl_' || gen_random_uuid()::text),
  charity_id         TEXT NOT NULL REFERENCES public.charities(id),
  total_cents        INT NOT NULL CHECK (total_cents >= 1),
  stripe_transfer_id TEXT UNIQUE,
  period_start       TIMESTAMPTZ NOT NULL,
  period_end         TIMESTAMPTZ NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','completed','failed')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- ─── 6. transactions → settlements FK (safe, idempotent) ─────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_transactions_settlement'
      AND table_name = 'transactions'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT fk_transactions_settlement
      FOREIGN KEY (settlement_id) REFERENCES public.settlements(id);
  END IF;
END;
$$;

-- ─── 7. user_charity_preferences table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_charity_preferences (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id TEXT NOT NULL REFERENCES public.charities(id),
  weight     INT NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, charity_id)
);

ALTER TABLE public.user_charity_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_charity_preferences' AND policyname='Users can read own preferences') THEN
    CREATE POLICY "Users can read own preferences"   ON public.user_charity_preferences FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_charity_preferences' AND policyname='Users can manage own preferences') THEN
    CREATE POLICY "Users can manage own preferences" ON public.user_charity_preferences FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
