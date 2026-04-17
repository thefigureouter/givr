-- TapGive Database Schema
-- Run this in Supabase Dashboard → SQL Editor

-- ─── Enable UUID extension ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL DEFAULT '',
  email                  TEXT NOT NULL DEFAULT '',
  privacy_mode           TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (privacy_mode IN ('PUBLIC','FRIENDS','PRIVATE')),
  city_region            TEXT,
  bio                    TEXT,
  username               TEXT UNIQUE,
  giving_mode            TEXT DEFAULT 'intentional' CHECK (giving_mode IN ('intentional','budget')),
  monthly_budget_cents   INT,
  remainder_preference   TEXT DEFAULT 'rollover' CHECK (remainder_preference IN ('top_charity','split_even','rollover')),
  member_since           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Charities ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charities (
  id                   TEXT PRIMARY KEY,
  display_name         TEXT NOT NULL,
  legal_name           TEXT,
  category             TEXT NOT NULL,
  emoji                TEXT,
  mission_summary      TEXT,
  impact_summary       TEXT,
  website              TEXT,
  verification_status  TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('VERIFIED','PENDING','REJECTED')),
  country              TEXT NOT NULL DEFAULT 'US',
  popularity_score     INT NOT NULL DEFAULT 0,
  urgency_score        INT NOT NULL DEFAULT 0,
  impact_metric_label  TEXT,
  impact_per_dollar    DECIMAL(10,4),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read verified charities" ON charities FOR SELECT USING (verification_status = 'VERIFIED');

-- ─── Donations ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id                        TEXT PRIMARY KEY DEFAULT ('d_' || gen_random_uuid()::text),
  user_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id                TEXT NOT NULL REFERENCES charities(id),
  amount_cents              INT NOT NULL CHECK (amount_cents >= 1),
  tip_cents                 INT NOT NULL DEFAULT 0,
  fee_cents                 INT NOT NULL DEFAULT 0,
  total_cents               INT NOT NULL,
  charity_receives_cents    INT NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'usd',
  status                    TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCEEDED','FAILED','REFUNDED')),
  privacy_mode              TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (privacy_mode IN ('PUBLIC','FRIENDS','PRIVATE')),
  funding_source            TEXT,
  stripe_payment_intent_id  TEXT UNIQUE,
  idempotency_key           TEXT UNIQUE DEFAULT ('idem_' || gen_random_uuid()::text),
  donated_at                TIMESTAMPTZ NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own donations"   ON donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own donations" ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Streaks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  user_id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak     INT NOT NULL DEFAULT 0,
  longest_streak     INT NOT NULL DEFAULT 0,
  last_donation_date DATE,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own streak"   ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own streak" ON streaks FOR ALL    USING (auth.uid() = user_id);

-- ─── Badges ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type  TEXT NOT NULL,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_type)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own badges"   ON badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Feed items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_items (
  id            TEXT PRIMARY KEY DEFAULT ('feed_' || gen_random_uuid()::text),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  donation_id   TEXT REFERENCES donations(id) ON DELETE SET NULL,
  display_name  TEXT NOT NULL,
  amount_cents  INT NOT NULL,
  charity_id    TEXT NOT NULL REFERENCES charities(id),
  city_region   TEXT,
  privacy_mode  TEXT NOT NULL DEFAULT 'PUBLIC',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read public feed" ON feed_items FOR SELECT USING (privacy_mode = 'PUBLIC');
CREATE POLICY "Users can insert own feed items" ON feed_items FOR INSERT WITH CHECK (auth.uid() = user_id);
