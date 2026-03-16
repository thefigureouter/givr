import type { BadgeType, Donation } from '@/types';
import { totalCents, uniqueCharityIds } from './utils';

export const BADGES: Record<
  BadgeType,
  { label: string; description: string; emoji: string }
> = {
  FIRST_DONATION: { label: 'First Give', description: 'Made your first donation', emoji: '🌱' },
  STREAK_7: { label: 'Week Warrior', description: '7 day giving streak', emoji: '🔥' },
  STREAK_30: { label: 'Monthly Hero', description: '30 day streak', emoji: '⚡' },
  STREAK_365: { label: 'Legend', description: '365 day streak', emoji: '👑' },
  CAUSES_5: { label: 'Cause Explorer', description: 'Supported 5 different causes', emoji: '🌍' },
  CAUSES_10: { label: 'World Giver', description: 'Supported 10 causes', emoji: '🌐' },
  DONATED_100: { label: 'Century Giver', description: 'Given $100 total', emoji: '💯' },
  DONATED_1000: { label: 'Power Donor', description: 'Given $1,000 total', emoji: '🏆' },
  EARLY_ADOPTER: { label: 'Early Adopter', description: 'One of the first 1,000 users', emoji: '⭐' },
  LOCAL_HERO: { label: 'Local Hero', description: 'Donated to 3 local causes', emoji: '📍' },
};

export function checkForNewBadges(
  donations: Donation[],
  currentStreak: number,
  earnedBadges: BadgeType[]
): BadgeType[] {
  const earned = new Set(earnedBadges);
  const newBadges: BadgeType[] = [];

  function maybeAward(badge: BadgeType, condition: boolean) {
    if (condition && !earned.has(badge)) newBadges.push(badge);
  }

  const total = totalCents(donations);
  const uniqueCauses = uniqueCharityIds(donations).length;

  maybeAward('FIRST_DONATION', donations.length >= 1);
  maybeAward('STREAK_7', currentStreak >= 7);
  maybeAward('STREAK_30', currentStreak >= 30);
  maybeAward('STREAK_365', currentStreak >= 365);
  maybeAward('CAUSES_5', uniqueCauses >= 5);
  maybeAward('CAUSES_10', uniqueCauses >= 10);
  maybeAward('DONATED_100', total >= 10000);
  maybeAward('DONATED_1000', total >= 100000);

  return newBadges;
}
