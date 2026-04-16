import type { Donation, Charity, UserProfile, Streak, Badge, FeedItem } from '@/types';
import {
  CHARITIES,
  DEMO_USER,
  SAMPLE_DONATIONS,
  SAMPLE_STREAK,
  SAMPLE_BADGES,
  SAMPLE_FEED,
} from './mock-data';
import { randomId } from './utils';
import { supabase, supabaseConfigured } from './supabase';
import { getBrowserSupabase } from './supabase-browser';

/**
 * Returns the best available Supabase client for the current environment.
 *
 * - Browser: uses the @supabase/ssr cookie-based client so RLS can see the
 *   authenticated session (createBrowserClient stores JWTs in cookies).
 * - Server / API routes: falls back to the anon-key singleton which is fine
 *   for public data; API routes that write user data should use supabaseAdmin.
 */
function getClient() {
  if (typeof window !== 'undefined') {
    const browserClient = getBrowserSupabase();
    if (browserClient) return browserClient;
  }
  return supabase;
}

// ─── Helpers: snake_case ↔ camelCase ─────────────────────────────────────────

function charityFromRow(r: Record<string, unknown>): Charity {
  return {
    id: r.id as string,
    displayName: r.display_name as string,
    legalName: (r.legal_name as string | null) ?? (r.display_name as string),
    category: r.category as Charity['category'],
    emoji: (r.emoji as string | null) ?? '💚',
    missionSummary: r.mission_summary as string,
    impactSummary: r.impact_summary as string | undefined,
    logoUrl: r.logo_url as string | undefined,
    website: r.website as string | undefined,
    verificationStatus: r.verification_status as Charity['verificationStatus'],
    cityRegion: r.city_region as string | undefined,
    country: r.country as string,
    popularityScore: r.popularity_score as number,
    urgencyScore: r.urgency_score as number,
    impactMetricLabel: (r.impact_metric_label as string | null) ?? 'impact per dollar',
    impactPerDollar: (r.impact_per_dollar as number | null) ?? 1,
    stripeAccountId: r.stripe_account_id as string | undefined,
    ein: r.ein as string | undefined,
    orgType: r.org_type as Charity['orgType'],
    taxDeductible: r.tax_deductible as boolean | undefined,
  };
}

function donationFromRow(row: Record<string, unknown>): Donation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    charityId: row.charity_id as string,
    amountCents: row.amount_cents as number,
    tipCents: row.tip_cents as number,
    feeCents: row.fee_cents as number,
    totalCents: row.total_cents as number,
    charityReceivesCents: row.charity_receives_cents as number,
    currency: row.currency as string,
    status: row.status as Donation['status'],
    privacyMode: row.privacy_mode as Donation['privacyMode'],
    fundingSource: row.funding_source as string | undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id as string | undefined,
    idempotencyKey: row.idempotency_key as string,
    donatedAt: row.donated_at as string,
    createdAt: row.created_at as string,
  };
}

function badgeFromRow(row: Record<string, unknown>): Badge {
  return {
    userId: row.user_id as string,
    badgeType: row.badge_type as Badge['badgeType'],
    awardedAt: row.awarded_at as string,
  };
}

// ─── Mock store (used when Supabase is not configured) ───────────────────────

interface MockStore {
  donations: Donation[];
  charities: Charity[];
  user: UserProfile;
  streak: { userId: string; currentStreak: number; longestStreak: number; lastDonationDate: Date | null; updatedAt: Date };
  badges: Badge[];
  feed: FeedItem[];
}

function loadStore(): MockStore {
  if (typeof window === 'undefined') {
    return { donations: SAMPLE_DONATIONS, charities: CHARITIES, user: DEMO_USER, streak: SAMPLE_STREAK, badges: SAMPLE_BADGES, feed: SAMPLE_FEED };
  }
  try {
    const raw = localStorage.getItem('tapgive-mock-store');
    if (raw) {
      const parsed = JSON.parse(raw) as MockStore;
      if (parsed.streak.lastDonationDate) parsed.streak.lastDonationDate = new Date(parsed.streak.lastDonationDate);
      parsed.streak.updatedAt = new Date(parsed.streak.updatedAt);
      return parsed;
    }
  } catch {}
  return { donations: SAMPLE_DONATIONS, charities: CHARITIES, user: DEMO_USER, streak: SAMPLE_STREAK, badges: SAMPLE_BADGES, feed: SAMPLE_FEED };
}

function saveStore(store: MockStore): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('tapgive-mock-store', JSON.stringify(store)); } catch {}
}

let _store: MockStore | null = null;
function getStore(): MockStore {
  if (!_store) _store = loadStore();
  return _store;
}

// ─── Charities ────────────────────────────────────────────────────────────────

export async function getCharities(): Promise<Charity[]> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.from('charities').select('*').eq('verification_status', 'VERIFIED');
    if (!error && data) return data.map((r) => charityFromRow(r as Record<string, unknown>));
  }
  return getStore().charities;
}

export async function getCharityById(id: string): Promise<Charity | null> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.from('charities').select('*').eq('id', id).single();
    if (!error && data) return charityFromRow(data as Record<string, unknown>);
  }
  return getStore().charities.find((c) => c.id === id) ?? null;
}

export async function searchCharities(query: string): Promise<Charity[]> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .eq('verification_status', 'VERIFIED')
      .or(`display_name.ilike.%${query}%,mission_summary.ilike.%${query}%`);
    if (!error && data) return data.map((r) => charityFromRow(r as Record<string, unknown>));
  }
  const q = query.toLowerCase();
  return getStore().charities.filter(
    (c) => c.displayName.toLowerCase().includes(q) || c.missionSummary.toLowerCase().includes(q)
  );
}

// ─── Donations ────────────────────────────────────────────────────────────────

export async function getDonations(userId: string): Promise<Donation[]> {
  const client = getClient();
  if (supabaseConfigured && client) {
    const { data, error } = await client
      .from('donations')
      .select('*')
      .eq('user_id', userId)
      .order('donated_at', { ascending: false });
    if (!error && data) return data.map((r: Record<string, unknown>) => donationFromRow(r));
  }
  const store = getStore();
  return store.donations
    .filter((d) => d.userId === userId)
    .sort((a, b) => new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime());
}

export async function createDonation(
  data: Omit<Donation, 'id' | 'createdAt' | 'idempotencyKey'>
): Promise<Donation> {
  const client = getClient();
  if (supabaseConfigured && client) {
    const { data: row, error } = await client
      .from('donations')
      .insert({
        user_id: data.userId,
        charity_id: data.charityId,
        amount_cents: data.amountCents,
        tip_cents: data.tipCents,
        fee_cents: data.feeCents,
        total_cents: data.totalCents,
        charity_receives_cents: data.charityReceivesCents,
        currency: data.currency,
        status: data.status,
        privacy_mode: data.privacyMode,
        funding_source: data.fundingSource,
        stripe_payment_intent_id: data.stripePaymentIntentId,
        donated_at: data.donatedAt,
      })
      .select()
      .single();
    if (!error && row) return donationFromRow(row as Record<string, unknown>);
  }
  const store = getStore();
  const donation: Donation = {
    ...data,
    id: 'd_' + randomId(),
    idempotencyKey: 'idem_' + randomId(),
    createdAt: new Date().toISOString(),
  };
  store.donations.push(donation);
  saveStore(store);
  return donation;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const client = getClient();
  if (supabaseConfigured && client) {
    const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
    if (!error && data) {
      const r = data as Record<string, unknown>;
      return {
        id: r.id as string,
        name: r.name as string,
        email: r.email as string,
        privacyMode: r.privacy_mode as UserProfile['privacyMode'],
        cityRegion: r.city_region as string | undefined,
        bio: r.bio as string | undefined,
        username: (r.username as string | undefined) ?? '',
        memberSince: r.member_since as string,
      };
    }
  }
  const store = getStore();
  if (store.user.id === userId) return store.user;
  return null;
}

export async function updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'name' | 'email' | 'bio' | 'cityRegion' | 'username' | 'privacyMode'>>): Promise<void> {
  const client = getClient();
  if (supabaseConfigured && client) {
    await client.from('profiles').update({
      name: updates.name,
      email: updates.email,
      bio: updates.bio,
      city_region: updates.cityRegion,
      username: updates.username,
      privacy_mode: updates.privacyMode,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
    return;
  }
  const store = getStore();
  if (store.user.id === userId) {
    store.user = { ...store.user, ...updates };
    saveStore(store);
  }
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<MockStore['streak'] | null> {
  const client = getClient();
  if (supabaseConfigured && client) {
    const { data, error } = await client.from('streaks').select('*').eq('user_id', userId).single();
    if (!error && data) {
      const r = data as Record<string, unknown>;
      return {
        userId: r.user_id as string,
        currentStreak: r.current_streak as number,
        longestStreak: r.longest_streak as number,
        lastDonationDate: r.last_donation_date ? new Date(r.last_donation_date as string) : null,
        updatedAt: new Date(r.updated_at as string),
      };
    }
  }
  const store = getStore();
  if (store.streak.userId === userId) return store.streak;
  return null;
}

export async function updateStreak(
  userId: string,
  newStreak: number,
  longestStreak: number,
  lastDonationDate: Date
): Promise<void> {
  const longest = Math.max(longestStreak, newStreak);
  const client = getClient();
  if (supabaseConfigured && client) {
    await client.from('streaks').upsert({
      user_id: userId,
      current_streak: newStreak,
      longest_streak: longest,
      last_donation_date: lastDonationDate.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    return;
  }
  const store = getStore();
  store.streak = { userId, currentStreak: newStreak, longestStreak: longest, lastDonationDate, updatedAt: new Date() };
  saveStore(store);
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export async function getBadges(userId: string): Promise<Badge[]> {
  const client = getClient();
  if (supabaseConfigured && client) {
    const { data, error } = await client.from('badges').select('*').eq('user_id', userId);
    if (!error && data) return data.map((r: Record<string, unknown>) => badgeFromRow(r));
  }
  return getStore().badges.filter((b) => b.userId === userId);
}

export async function awardBadges(userId: string, badgeTypes: string[]): Promise<void> {
  const client = getClient();
  if (supabaseConfigured && client) {
    const rows = badgeTypes.map((bt) => ({ user_id: userId, badge_type: bt }));
    await client.from('badges').upsert(rows, { onConflict: 'user_id,badge_type', ignoreDuplicates: true });
    return;
  }
  const store = getStore();
  const now = new Date().toISOString();
  for (const badgeType of badgeTypes) {
    if (!store.badges.some((b) => b.userId === userId && b.badgeType === badgeType)) {
      store.badges.push({ userId, badgeType: badgeType as Badge['badgeType'], awardedAt: now });
    }
  }
  saveStore(store);
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function getFeed(): Promise<FeedItem[]> {
  const client = getClient();
  if (supabaseConfigured && client) {
    const { data, error } = await client
      .from('feed_items')
      .select('*, charity:charities(*)')
      .eq('privacy_mode', 'PUBLIC')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      return data.map((r: Record<string, unknown>) => {
        const row = r;
        return {
          id: row.id as string,
          userId: row.user_id as string,
          donationId: (row.donation_id as string | undefined) ?? '',
          charityId: row.charity_id as string,
          displayName: row.display_name as string,
          amountCents: row.amount_cents as number,
          charity: row.charity as Charity,
          cityRegion: row.city_region as string,
          privacyMode: row.privacy_mode as FeedItem['privacyMode'],
          createdAt: row.created_at as string,
        };
      });
    }
  }
  const store = getStore();
  return [...store.feed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addFeedItem(item: Omit<FeedItem, 'id'>): Promise<void> {
  const client = getClient();
  if (supabaseConfigured && client) {
    await client.from('feed_items').insert({
      user_id: item.userId,
      display_name: item.displayName,
      amount_cents: item.amountCents,
      charity_id: item.charity.id,
      city_region: item.cityRegion,
      privacy_mode: item.privacyMode,
    });
    return;
  }
  const store = getStore();
  store.feed.unshift({ ...item, id: 'feed_' + randomId() });
  if (store.feed.length > 100) store.feed = store.feed.slice(0, 100);
  saveStore(store);
}
