'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { getDonations, getBadges, getStreak } from '@/lib/mock-db';
import { BADGES } from '@/lib/badge-engine';
import { totalCents, uniqueCharityIds } from '@/lib/utils';
import { DEMO_USER } from '@/lib/mock-data';
import type { Badge } from '@/types';

const ALL_BADGE_TYPES = Object.keys(BADGES) as Badge['badgeType'][];

export default function ImpactPage() {
  const [givenCents, setGivenCents] = useState(0);
  const [causeCount, setCauseCount] = useState(0);
  const [donationCount, setDonationCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<Badge['badgeType'][]>([]);

  useEffect(() => {
    async function load() {
      const [donations, badges, streakData] = await Promise.all([
        getDonations('demo-user-id'),
        getBadges('demo-user-id'),
        getStreak('demo-user-id'),
      ]);
      setGivenCents(totalCents(donations));
      setCauseCount(uniqueCharityIds(donations).length);
      setDonationCount(donations.length);
      setEarnedBadges(badges.map((b) => b.badgeType));
      if (streakData) setStreak(streakData.currentStreak);
    }
    load();
  }, []);

  const dollars = (givenCents / 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: '0 16px 24px' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--tx)', margin: 0 }}>
          My Impact
        </h1>
        <Link href="/settings" aria-label="Settings">
          <Settings size={22} color="var(--tx3)" />
        </Link>
      </div>

      {/* Profile hero card */}
      <div
        className="card"
        style={{ overflow: 'hidden', padding: 0, borderRadius: 24, marginBottom: 14 }}
      >
        {/* Cover banner */}
        <div
          style={{
            height: 80,
            background: 'linear-gradient(135deg, #E6F9EE 0%, #C8F0DC 50%, #B8E8CC 100%)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle, var(--green) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.2,
            }}
          />
          {/* Edit button */}
          <button
            style={{
              position: 'absolute',
              bottom: 10,
              right: 14,
              padding: '5px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid var(--br)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--tx2)',
            }}
          >
            Edit profile
          </button>
        </div>

        {/* Avatar overlapping banner */}
        <div style={{ position: 'relative', padding: '0 20px 18px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '3px solid #fff',
              background: 'linear-gradient(135deg, var(--green), var(--gd))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 20,
              fontWeight: 900,
              marginTop: -28,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            A
          </div>

          {/* Total given */}
          <div
            style={{
              position: 'absolute',
              top: -28 + 18,
              right: 14,
            }}
          >
            <div
              style={{
                background: 'var(--gl)',
                border: '1.5px solid var(--gm)',
                borderRadius: 12,
                padding: '6px 12px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--green)' }}>
                ${dollars}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gd)', textTransform: 'uppercase' }}>
                total given
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--tx)' }}>
              {DEMO_USER.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx3)', fontWeight: 600, marginTop: 2 }}>
              @{DEMO_USER.username} · member since{' '}
              {new Date(DEMO_USER.memberSince).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5, margin: '8px 0' }}>
              {DEMO_USER.bio}
            </p>

            {/* Stat pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              <span className="pill pa">🔥 {streak} day streak</span>
              <span className="pill pg">{causeCount} causes</span>
              <span className="pill pgr">{donationCount} gives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions card */}
      <Link
        href="/history"
        style={{ textDecoration: 'none' }}
      >
        <div
          className="card tap-scale"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>
              All transactions
            </div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
              {donationCount} donations · view &amp; export
            </div>
          </div>
          <span className="pill pg">View →</span>
        </div>
      </Link>

      {/* Impact equals */}
      <div className="card-green" style={{ marginBottom: 14 }}>
        <p className="section-label" style={{ margin: '0 0 10px', color: 'var(--gd)' }}>
          Your impact equals
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { emoji: '🥗', label: `${Math.floor(givenCents / 10)} meals` },
            { emoji: '🌳', label: `${Math.floor(givenCents / 500)} trees` },
            { emoji: '💧', label: `${Math.floor(givenCents / 3000)} people` },
          ].map(({ emoji, label }) => (
            <div
              key={label}
              style={{
                background: 'var(--sf)',
                borderRadius: 12,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24 }}>{emoji}</div>
              <div
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd)', marginTop: 4 }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <p className="section-label">Badges</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
        }}
      >
        {ALL_BADGE_TYPES.map((bt) => {
          const earned = earnedBadges.includes(bt);
          const badge = BADGES[bt];
          return (
            <div
              key={bt}
              style={{
                background: earned ? 'var(--al)' : 'var(--sf)',
                border: `1.5px solid ${earned ? '#F5D6A0' : 'var(--br)'}`,
                borderRadius: 16,
                padding: '14px 8px',
                textAlign: 'center',
                opacity: earned ? 1 : 0.4,
                filter: earned ? 'none' : 'grayscale(1)',
              }}
            >
              <div style={{ fontSize: 28 }}>{badge.emoji}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: earned ? '#CC7A10' : 'var(--tx3)',
                  marginTop: 6,
                  lineHeight: 1.3,
                }}
              >
                {badge.label}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
