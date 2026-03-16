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

// TODO: [SUPABASE] Replace entire module with real Supabase queries

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
    return {
      donations: SAMPLE_DONATIONS,
      charities: CHARITIES,
      user: DEMO_USER,
      streak: SAMPLE_STREAK,
      badges: SAMPLE_BADGES,
      feed: SAMPLE_FEED,
    };
  }
  try {
    const raw = localStorage.getItem('tapgive-mock-store');
    if (raw) {
      const parsed = JSON.parse(raw) as MockStore;
      // Restore Date objects
      if (parsed.streak.lastDonationDate) {
        parsed.streak.lastDonationDate = new Date(parsed.streak.lastDonationDate);
      }
      parsed.streak.updatedAt = new Date(parsed.streak.updatedAt);
      return parsed;
    }
  } catch {}
  return {
    donations: SAMPLE_DONATIONS,
    charities: CHARITIES,
    user: DEMO_USER,
    streak: SAMPLE_STREAK,
    badges: SAMPLE_BADGES,
    feed: SAMPLE_FEED,
  };
}

function saveStore(store: MockStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tapgive-mock-store', JSON.stringify(store));
  } catch {}
}

let _store: MockStore | null = null;

function getStore(): MockStore {
  if (!_store) _store = loadStore();
  return _store;
}

// ─── Charities ────────────────────────────────────────────────────────────────

export async function getCharities(): Promise<Charity[]> {
  // TODO: [SUPABASE] const { data } = await supabase.from('charities').select('*').eq('verification_status', 'VERIFIED');
  return getStore().charities;
}

export async function getCharityById(id: string): Promise<Charity | null> {
  // TODO: [SUPABASE] const { data } = await supabase.from('charities').select('*').eq('id', id).single();
  return getStore().charities.find((c) => c.id === id) ?? null;
}

export async function searchCharities(query: string): Promise<Charity[]> {
  // TODO: [SUPABASE] Full-text search via Postgres
  const q = query.toLowerCase();
  return getStore().charities.filter(
    (c) =>
      c.displayName.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.missionSummary.toLowerCase().includes(q)
  );
}

// ─── Donations ────────────────────────────────────────────────────────────────

export async function getDonations(userId: string): Promise<Donation[]> {
  // TODO: [SUPABASE] const { data } = await supabase.from('donations').select('*, charity:charities(*)').eq('user_id', userId).order('donated_at', { ascending: false });
  const store = getStore();
  return store.donations
    .filter((d) => d.userId === userId)
    .map((d) => ({ ...d, charity: store.charities.find((c) => c.id === d.charityId) }))
    .sort((a, b) => new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime());
}

export async function createDonation(
  data: Omit<Donation, 'id' | 'createdAt' | 'idempotencyKey'>
): Promise<Donation> {
  // TODO: [SUPABASE] const { data: donation } = await supabase.from('donations').insert(newDonation).select().single();
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

// ─── User ────────────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // TODO: [SUPABASE] const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const store = getStore();
  if (store.user.id === userId) return store.user;
  return null;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<MockStore['streak'] | null> {
  // TODO: [SUPABASE] const { data } = await supabase.from('streaks').select('*').eq('user_id', userId).single();
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
  // TODO: [SUPABASE] await supabase.from('streaks').upsert({ user_id: userId, current_streak: newStreak, ... });
  const store = getStore();
  store.streak = {
    userId,
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastDonationDate,
    updatedAt: new Date(),
  };
  saveStore(store);
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export async function getBadges(userId: string): Promise<Badge[]> {
  // TODO: [SUPABASE] const { data } = await supabase.from('badges').select('*').eq('user_id', userId);
  return getStore().badges.filter((b) => b.userId === userId);
}

export async function awardBadges(userId: string, badgeTypes: string[]): Promise<void> {
  // TODO: [SUPABASE] await supabase.from('badges').insert(badges);
  const store = getStore();
  const now = new Date().toISOString();
  for (const badgeType of badgeTypes) {
    const alreadyHas = store.badges.some(
      (b) => b.userId === userId && b.badgeType === badgeType
    );
    if (!alreadyHas) {
      store.badges.push({ userId, badgeType: badgeType as Badge['badgeType'], awardedAt: now });
    }
  }
  saveStore(store);
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function getFeed(): Promise<FeedItem[]> {
  // TODO: [SUPABASE] const { data } = await supabase.from('feed').select('*, charity:charities(*)').eq('privacy_mode', 'PUBLIC').order('created_at', { ascending: false }).limit(50);
  const store = getStore();
  return [...store.feed].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addFeedItem(item: Omit<FeedItem, 'id'>): Promise<void> {
  // TODO: [SUPABASE] await supabase.from('feed').insert(item);
  const store = getStore();
  store.feed.unshift({ ...item, id: 'feed_' + randomId() });
  if (store.feed.length > 100) store.feed = store.feed.slice(0, 100);
  saveStore(store);
}
