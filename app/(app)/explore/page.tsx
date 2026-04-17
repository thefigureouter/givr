'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CharityCard from '@/components/charity/CharityCard';
import CharitySearchModal from '@/components/charity/CharitySearchModal';
import { CHARITIES } from '@/lib/mock-data';
import type { CauseCategory, Charity } from '@/types';

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
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CauseCategory | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [charities, setCharities] = useState<Charity[]>(CHARITIES);
  const [loadingCharities, setLoadingCharities] = useState(true);

  useEffect(() => {
    fetch('/api/charities')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setCharities(data); })
      .finally(() => setLoadingCharities(false));
  }, []);

  const filtered = charities.filter((c) => {
    const matchesFilter = activeFilter === 'all' || c.category === activeFilter;
    const matchesQuery =
      !query ||
      c.displayName.toLowerCase().includes(query.toLowerCase()) ||
      c.missionSummary.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ padding: '16px 16px 24px' }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--tx)', margin: '0 0 16px' }}>
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
        {loadingCharities && charities === CHARITIES ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0,1,2,3,4].map((i) => (
              <div key={i} style={{ height: 72, borderRadius: 20, background: 'var(--sf)', border: '1.5px solid var(--br)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.08}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx2)' }}>
              No charities found
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 6, marginBottom: 20 }}>
              {query ? `No results for "${query}"` : 'Try selecting a different category'}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '12px 24px',
                borderRadius: 14,
                background: 'var(--green)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Add a charity
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((charity) => (
              <CharityCard key={charity.id} charity={charity} variant="compact" />
            ))}
          </div>
        )}

        {/* Can't find them? — always visible at bottom */}
        {filtered.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              marginTop: 20,
              padding: '14px',
              borderRadius: 16,
              border: '1.5px dashed var(--br2)',
              background: 'var(--sf)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--tx2)',
              cursor: 'pointer',
              transition: 'all 120ms',
            }}
          >
            <Plus size={16} color="var(--tx3)" />
            Can&apos;t find your charity? Add it
          </button>
        )}
      </motion.div>

      {/* Modal — selecting a found charity goes to donate page */}
      <CharitySearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        startUnclaimed
        onSelect={(c) => {
          setModalOpen(false);
          router.push(`/donate/${c.id}`);
        }}
      />
    </>
  );
}
