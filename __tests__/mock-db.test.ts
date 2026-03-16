import {
  getCharities,
  getCharityById,
  searchCharities,
  getDonations,
  createDonation,
  getUserProfile,
  getStreak,
  updateStreak,
  getBadges,
  awardBadges,
  getFeed,
} from '@/lib/mock-db';

describe('getCharities', () => {
  test('returns all charities', async () => {
    const result = await getCharities();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getCharityById', () => {
  test('returns charity for known id', async () => {
    const result = await getCharityById('feeding-america');
    expect(result).not.toBeNull();
    expect(result?.displayName).toBe('Feeding America');
  });

  test('returns null for unknown id', async () => {
    const result = await getCharityById('nonexistent-id');
    expect(result).toBeNull();
  });
});

describe('searchCharities', () => {
  test('finds charities by name', async () => {
    const result = await searchCharities('feeding');
    expect(result.some((c) => c.displayName.toLowerCase().includes('feeding'))).toBe(true);
  });

  test('returns empty for no matches', async () => {
    const result = await searchCharities('zzzzzzzzzzzzz');
    expect(result).toHaveLength(0);
  });
});

describe('getDonations', () => {
  test('returns donations for demo user', async () => {
    const result = await getDonations('demo-user-id');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns empty for unknown user', async () => {
    const result = await getDonations('no-such-user');
    expect(result).toHaveLength(0);
  });

  test('includes charity data', async () => {
    const result = await getDonations('demo-user-id');
    expect(result[0].charity).toBeDefined();
  });

  test('is sorted newest first', async () => {
    const result = await getDonations('demo-user-id');
    for (let i = 0; i < result.length - 1; i++) {
      expect(new Date(result[i].donatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i + 1].donatedAt).getTime()
      );
    }
  });
});

describe('createDonation', () => {
  test('creates and returns a donation with generated id', async () => {
    const donation = await createDonation({
      userId: 'demo-user-id',
      charityId: 'feeding-america',
      amountCents: 500,
      tipCents: 0,
      feeCents: 0,
      totalCents: 500,
      charityReceivesCents: 500,
      currency: 'usd',
      status: 'SUCCEEDED',
      privacyMode: 'PUBLIC',
      donatedAt: new Date().toISOString(),
    });
    expect(donation.id).toBeTruthy();
    expect(donation.amountCents).toBe(500);
  });
});

describe('getUserProfile', () => {
  test('returns demo user', async () => {
    const result = await getUserProfile('demo-user-id');
    expect(result?.name).toBe('Alex Rivera');
  });

  test('returns null for unknown user', async () => {
    const result = await getUserProfile('nobody');
    expect(result).toBeNull();
  });
});

describe('getStreak / updateStreak', () => {
  test('returns streak for demo user', async () => {
    const streak = await getStreak('demo-user-id');
    expect(streak).not.toBeNull();
    expect(streak?.currentStreak).toBeGreaterThanOrEqual(0);
  });

  test('updates streak values', async () => {
    await updateStreak('demo-user-id', 15, 23, new Date());
    const updated = await getStreak('demo-user-id');
    expect(updated?.currentStreak).toBe(15);
  });
});

describe('getBadges / awardBadges', () => {
  test('returns badges for demo user', async () => {
    const badges = await getBadges('demo-user-id');
    expect(badges.length).toBeGreaterThan(0);
  });

  test('awards new badge without duplicating', async () => {
    const before = await getBadges('demo-user-id');
    const beforeCount = before.length;
    await awardBadges('demo-user-id', ['STREAK_365']);
    const after = await getBadges('demo-user-id');
    expect(after.length).toBe(beforeCount + 1);

    // Award again — should not duplicate
    await awardBadges('demo-user-id', ['STREAK_365']);
    const afterDup = await getBadges('demo-user-id');
    expect(afterDup.length).toBe(beforeCount + 1);
  });
});

describe('getFeed', () => {
  test('returns feed items sorted newest first', async () => {
    const items = await getFeed();
    expect(items.length).toBeGreaterThan(0);
    for (let i = 0; i < items.length - 1; i++) {
      expect(new Date(items[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(items[i + 1].createdAt).getTime()
      );
    }
  });
});
