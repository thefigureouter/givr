import { toUTCMidnight } from './utils';

export function calculateStreak(
  lastDonationDate: Date | null,
  currentStreak: number
): { newStreak: number; isExtended: boolean; isBroken: boolean } {
  const todayUTC = toUTCMidnight(new Date());

  if (!lastDonationDate) {
    return { newStreak: 1, isExtended: false, isBroken: false };
  }

  const lastUTC = toUTCMidnight(lastDonationDate);
  const diffDays = Math.round(
    (todayUTC.getTime() - lastUTC.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    // Same day — idempotent
    return { newStreak: currentStreak, isExtended: false, isBroken: false };
  }

  if (diffDays === 1) {
    // Yesterday — extend streak
    return { newStreak: currentStreak + 1, isExtended: true, isBroken: false };
  }

  // 2+ days — streak broken, reset to 1
  return { newStreak: 1, isExtended: false, isBroken: true };
}

export type StreakStatus = 'new' | 'building' | 'hot' | 'legendary';

export function getStreakStatus(streak: number): StreakStatus {
  if (streak === 0) return 'new';
  if (streak < 7) return 'building';
  if (streak < 30) return 'hot';
  return 'legendary';
}
