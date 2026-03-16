'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import CharityCard from '@/components/charity/CharityCard';
import { CHARITIES } from '@/lib/mock-data';
import type { CauseCategory } from '@/types';

const FILTERS: { label: string; emoji: string; value: CauseCategory | 'all' }[] = [
  { label: 'All', emoji: '✨', value: 'all' },
  { label: 'Hunger', emoji: '🥗', value: 'hunger' },
  { label: 'Animals', emoji: '🐾', value: 'animals' },
  { label: 'Education', emoji: '📚', value: 'education' },
  { label: 'Nature', emoji: '🌿', value: 'environment' },
  { label: 'Health', emoji: '🏥', value: 'health' },
  { label: 'Children', emoji: '👶', value: 'children' },
  { label: 'Veterans', emoji: '🎖️', value: 'veterans' },
  { label: 'Housing', emoji: '🏠', value: 'housing' },
];

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CauseCategory | 'all'>('all');

  const filtered = CHARITIES.filter((c) => {
    const matchesFilter = activeFilter === 'all' || c.category === activeFilter;
    const matchesQuery =
      !query ||
      c.displayName.toLowerCase().includes(query.toLowerCase()) ||
      c.missionSummary.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: '16px 16px 24px' }}
    >
      <h1
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: 'var(--tx)',
          margin: '0 0 16px',
        }}
      >
        Explore
      </h1>

      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--sf)',
          border: '1.5px solid var(--br)',
          borderRadius: 14,
          padding: '11px 14px',
          marginBottom: 14,
        }}
      >
        <Search size={16} color="var(--tx3)" />
        <input
          type="text"
          placeholder="Search charities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 14,
            color: 'var(--tx)',
          }}
        />
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 14,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 14px',
              borderRadius: 999,
              border: `1.5px solid ${activeFilter === f.value ? 'var(--green)' : 'var(--br)'}`,
              background: activeFilter === f.value ? 'var(--gl)' : 'var(--sf)',
              color: activeFilter === f.value ? 'var(--gd)' : 'var(--tx2)',
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              minHeight: 40,
              transition: 'all 120ms',
              flexShrink: 0,
            }}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: 'var(--tx3)',
            fontSize: 14,
          }}
        >
          No charities found. Try a different search.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((charity) => (
            <CharityCard key={charity.id} charity={charity} variant="compact" />
          ))}
        </div>
      )}
    </motion.div>
  );
}
