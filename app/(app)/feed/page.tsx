'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { getFeed } from '@/lib/mock-db';
import { DEMO_USER } from '@/lib/mock-data';
import type { FeedItem } from '@/types';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatAmount(cents: number): string {
  if (cents < 100) return `¢${cents}`;
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [nearMe, setNearMe] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeed()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  function toggleLike(id: string) {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const displayed = nearMe
    ? items.filter((item) => item.cityRegion === DEMO_USER.cityRegion)
    : items;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: '16px 16px 24px' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--tx)', margin: 0 }}>
          Giving feed 🌎
        </h1>
      </div>

      {/* Toggle */}
      <div
        style={{
          display: 'flex',
          background: 'var(--sf2)',
          border: '1.5px solid var(--br)',
          borderRadius: 12,
          padding: 3,
          marginBottom: 16,
          width: 'fit-content',
        }}
      >
        {(['Everyone', 'Near me'] as const).map((label) => {
          const active = label === 'Near me' ? nearMe : !nearMe;
          return (
            <button
              key={label}
              onClick={() => setNearMe(label === 'Near me')}
              style={{
                padding: '7px 18px',
                borderRadius: 10,
                background: active ? 'var(--sf)' : 'transparent',
                fontSize: 13,
                fontWeight: 700,
                color: active ? 'var(--tx)' : 'var(--tx3)',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms',
                minHeight: 36,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 80,
                borderRadius: 20,
                background: 'var(--sf)',
                border: '1.5px solid var(--br)',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'var(--tx3)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx2)' }}>
            No activity near {DEMO_USER.cityRegion} yet
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Be the first to give in your area!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--gl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--gd)',
                  flexShrink: 0,
                }}
              >
                {item.displayName.charAt(0)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--tx)', margin: '0 0 4px', lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 800 }}>{item.displayName}</strong> gave{' '}
                  <strong style={{ color: 'var(--green)', fontWeight: 800 }}>
                    {formatAmount(item.amountCents)}
                  </strong>{' '}
                  to {item.charity.displayName} {item.charity.emoji}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pill pgr">{item.charity.category.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 11, color: 'var(--tx3)' }}>
                    {timeAgo(item.createdAt)} · {item.cityRegion}
                  </span>
                </div>
              </div>

              {/* Like */}
              <button
                onClick={() => toggleLike(item.id)}
                aria-label={liked[item.id] ? 'Unlike' : 'Like'}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: liked[item.id] ? 'var(--cl)' : 'var(--sf2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms',
                  flexShrink: 0,
                }}
              >
                <Heart
                  size={16}
                  color={liked[item.id] ? 'var(--coral)' : 'var(--tx3)'}
                  fill={liked[item.id] ? 'var(--coral)' : 'none'}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
