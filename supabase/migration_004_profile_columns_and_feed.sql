-- Migration 004: Add giving mode columns to profiles, donation_id to feed_items
-- Run this in Supabase Dashboard → SQL Editor

-- Add giving mode / budget columns to profiles (if they don't exist)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS giving_mode TEXT DEFAULT 'intentional'
    CHECK (giving_mode IN ('intentional','budget')),
  ADD COLUMN IF NOT EXISTS monthly_budget_cents INT,
  ADD COLUMN IF NOT EXISTS remainder_preference TEXT DEFAULT 'rollover'
    CHECK (remainder_preference IN ('top_charity','split_even','rollover'));

-- Add donation_id to feed_items so feed can link back to the source donation
ALTER TABLE feed_items
  ADD COLUMN IF NOT EXISTS donation_id TEXT REFERENCES donations(id) ON DELETE SET NULL;
