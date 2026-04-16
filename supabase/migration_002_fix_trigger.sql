-- Migration 002: Fix handle_new_user trigger + constraint syntax
-- Run this in Supabase Dashboard → SQL Editor
--
-- Fixes:
--   1. Adds SET search_path = '' to the SECURITY DEFINER function so it works
--      with Supabase's hardened search_path enforcement (newer projects require
--      explicit schema-qualified references when search_path is empty).
--   2. Adds ON CONFLICT (id) DO NOTHING so retries don't error.
--   3. Replaces the invalid ADD CONSTRAINT IF NOT EXISTS syntax from migration_001.

-- ─── Fix the trigger function ─────────────────────────────────────────────────

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

-- Re-attach the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Fix the FK constraint from migration_001 ────────────────────────────────
-- ADD CONSTRAINT IF NOT EXISTS is not valid PostgreSQL syntax.
-- Use DO block to add it only if it doesn't already exist.

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
