'use client';

import { useState } from 'react';
import BottomNav from '@/components/nav/BottomNav';
import CharitySearchModal from '@/components/charity/CharitySearchModal';
import type { Charity } from '@/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  function handleCharitySelect(_charity: Charity) {
    setSearchOpen(false);
  }

  return (
    <div
      style={{
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
        background: 'var(--bg)',
      }}
    >
      <main style={{ paddingBottom: 90 }}>{children}</main>
      <BottomNav onFabClick={() => setSearchOpen(true)} />
      <CharitySearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleCharitySelect}
      />
    </div>
  );
}
