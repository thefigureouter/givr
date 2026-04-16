'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import QuickGive from '@/components/home/QuickGive';
import StreakSection from '@/components/gamification/StreakSection';
import CharityCard from '@/components/charity/CharityCard';
import CharitySearchModal from '@/components/charity/CharitySearchModal';
import { CHARITIES, SAMPLE_STREAK, DEMO_USER } from '@/lib/mock-data';
import { createDonation, getStreak, updateStreak, getDonations, getBadges, awardBadges } from '@/lib/mock-db';
import type { MeResponse } from '@/app/api/me/route';
import { calculateStreak } from '@/lib/streak-engine';
import { checkForNewBadges } from '@/lib/badge-engine';
import { totalCents, uniqueCharityIds, randomId } from '@/lib/utils';
import type { Charity, BadgeType } from '@/types';

const FEATURED = [CHARITIES[0], CHARITIES[5]]; // Feeding America, Doctors Without Borders

export default function HomePage() {
  const [userId, setUserId] = useState('demo-user-id');
  const [userName, setUserName] = useState(DEMO_USER.name);
  const [activeCharity, setActiveCharity] = useState<Charity>(CHARITIES[0]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [streak, setStreak] = useState(SAMPLE_STREAK.currentStreak);
  const [given, setGiven] = useState(0);
  const [causeCount, setCauseCount] = useState(0);
  const [newBadges, setNewBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning 👋' : hour < 18 ? 'Good afternoon 👋' : 'Good evening 👋';
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    async function load() {
      let uid = 'demo-user-id';
      let uname = DEMO_USER.name;

      // Server-side session read — never fails due to cookie visibility issues
      const meRes = await fetch('/api/me');
      if (meRes.ok) {
        const me = await meRes.json() as MeResponse;
        if (me.id) { uid = me.id; uname = me.name; }
      }

      setUserId(uid);
      setUserName(uname);

      try {
        const [streakData, donations] = await Promise.all([
          getStreak(uid),
          getDonations(uid),
        ]);
        if (streakData) setStreak(streakData.currentStreak);
        setGiven(totalCents(donations));
        setCauseCount(uniqueCharityIds(donations).length);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDonate(_amount: string, amountCents: number) {
    await createDonation({
      userId,
      charityId: activeCharity.id,
      amountCents,
      tipCents: 0,
      feeCents: 0,
      totalCents: amountCents,
      charityReceivesCents: amountCents,
      currency: 'usd',
      status: 'SUCCEEDED',
      privacyMode: 'PUBLIC',
      fundingSource: 'quick-give',
      stripePaymentIntentId: 'pi_mock_' + randomId(),
      donatedAt: new Date().toISOString(),
    });

    const streakData = await getStreak(userId);
    const { newStreak } = calculateStreak(
      streakData?.lastDonationDate ?? null,
      streakData?.currentStreak ?? 0
    );
    await updateStreak(userId, newStreak, streakData?.longestStreak ?? 0, new Date());
    setStreak(newStreak);

    const donations = await getDonations(userId);
    setGiven(totalCents(donations));
    setCauseCount(uniqueCharityIds(donations).length);

    const existingBadges = await getBadges(userId);
    const earnedTypes = existingBadges.map((b) => b.badgeType);
    const badges = checkForNewBadges(donations, newStreak, earnedTypes);
    if (badges.length > 0) {
      await awardBadges(userId, badges);
      setNewBadges(badges);
      setTimeout(() => setNewBadges([]), 3000);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: '0 16px 24px' }}
    >
      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Link href="/settings" aria-label="Settings">
          <Settings size={22} color="var(--tx3)" />
        </Link>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {userName.charAt(0)}
        </div>
      </div>

      {/* Greeting */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx3)', margin: '0 0 4px' }}>
          {greeting}
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: 'var(--tx)',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Ready to give today, {firstName}?
        </h1>
      </div>

      {/* QuickGive */}
      <QuickGive
        charityName={activeCharity.displayName}
        charityEmoji={activeCharity.emoji}
        onDonate={handleDonate}
        onChangeCharity={() => setSearchOpen(true)}
      />

      {/* New badge toast */}
      {newBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-amber"
          style={{ marginTop: 10 }}
        >
          <p style={{ fontSize: 14, fontWeight: 800, color: '#CC7A10', margin: 0 }}>
            🏆 Badge earned: {newBadges[0].replace(/_/g, ' ')}
          </p>
        </motion.div>
      )}

      {/* Streak section */}
      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  height: 120,
                  borderRadius: 20,
                  background: 'var(--sf2)',
                  border: '1.5px solid var(--br)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : (
          <StreakSection currentStreak={streak} totalCents={given} causeCount={causeCount} />
        )}
      </div>

      {/* Featured */}
      <p className="section-label">Featured today</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FEATURED.map((charity) => (
          <CharityCard key={charity.id} charity={charity} variant="hero" />
        ))}
      </div>

      {/* Charity search modal — updates QuickGive target */}
      <CharitySearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(c) => {
          setActiveCharity(c);
          setSearchOpen(false);
        }}
      />
    </motion.div>
  );
}
