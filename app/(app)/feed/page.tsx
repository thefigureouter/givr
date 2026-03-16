'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { getFeed } from '@/lib/mock-db';
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

  useEffect(() => {
    getFeed().then(setItems);
  }, []);

  function toggleLike(id: string) {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
        {['Everyone', 'Near me'].map((label, i) => (
          <button
            key={label}
            style={{
              padding: '7px 18px',
              borderRadius: 10,
              background: i === 0 ? 'var(--sf)' : 'transparent',
              fontSize: 13,
              fontWeight: 700,
              color: i === 0 ? 'var(--tx)' : 'var(--tx3)',
              boxShadow: i === 0 ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 150ms',
              minHeight: 36,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
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
                <span className="pill pgr">{item.charity.category.replace('_', ' ')}</span>
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
    </motion.div>
  );
}
