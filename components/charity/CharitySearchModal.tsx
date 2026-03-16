'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight } from 'lucide-react';
import type { Charity } from '@/types';
import { CHARITIES } from '@/lib/mock-data';

interface CharitySearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (charity: Charity) => void;
}

export default function CharitySearchModal({ open, onClose, onSelect }: CharitySearchModalProps) {
  const [query, setQuery] = useState('');
  const [unclaimedName, setUnclaimedName] = useState('');
  const [unclaimedSite, setUnclaimedSite] = useState('');
  const [giftSent, setGiftSent] = useState(false);

  const results = query.length > 0
    ? CHARITIES.filter(
        (c) =>
          c.displayName.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : CHARITIES.slice(0, 8);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setUnclaimedName('');
      setUnclaimedSite('');
      setGiftSent(false);
    }
  }, [open]);

  function handleSendUnclaimed() {
    if (!unclaimedName.trim()) return;
    setGiftSent(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 100,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 430,
              maxHeight: '85vh',
              background: 'var(--sf)',
              borderRadius: '24px 24px 0 0',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 999,
                  background: 'var(--br2)',
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px 8px',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)' }}>
                Give to a charity
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--sf2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="var(--tx2)" />
              </button>
            </div>

            {/* Search input */}
            <div style={{ padding: '0 16px 8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--sf2)',
                  border: '1.5px solid var(--br)',
                  borderRadius: 14,
                  padding: '10px 14px',
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
                  autoFocus
                />
              </div>
            </div>

            {/* Content */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 24px' }}>
              {results.length > 0 ? (
                <>
                  <p className="section-label">
                    {query ? `${results.length} results` : 'Popular causes'}
                  </p>
                  {results.map((charity) => (
                    <button
                      key={charity.id}
                      onClick={() => onSelect(charity)}
                      className="tap-scale"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '12px 0',
                        borderBottom: '1px solid var(--br)',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: 'var(--gl)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        {charity.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: 'var(--tx)',
                            marginBottom: 2,
                          }}
                        >
                          {charity.displayName}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--tx2)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {charity.missionSummary}
                        </div>
                      </div>
                      {charity.verificationStatus === 'VERIFIED' && (
                        <span className="pill pg" style={{ flexShrink: 0 }}>
                          ✓
                        </span>
                      )}
                      <ChevronRight size={16} color="var(--tx3)" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
                    <p
                      style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', marginBottom: 6 }}
                    >
                      🔍 Can&apos;t find them?
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5 }}>
                      Send an unclaimed gift — they&apos;ll get an email to claim it within 30 days.
                    </p>
                  </div>

                  <div className="card-amber" style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Charity name *"
                        value={unclaimedName}
                        onChange={(e) => setUnclaimedName(e.target.value)}
                        style={{
                          padding: '11px 14px',
                          borderRadius: 12,
                          border: '1.5px solid #F5D6A0',
                          background: 'var(--sf)',
                          fontSize: 14,
                          color: 'var(--tx)',
                          outline: 'none',
                          width: '100%',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Website or email (optional)"
                        value={unclaimedSite}
                        onChange={(e) => setUnclaimedSite(e.target.value)}
                        style={{
                          padding: '11px 14px',
                          borderRadius: 12,
                          border: '1.5px solid #F5D6A0',
                          background: 'var(--sf)',
                          fontSize: 14,
                          color: 'var(--tx)',
                          outline: 'none',
                          width: '100%',
                        }}
                      />
                      <button
                        onClick={handleSendUnclaimed}
                        disabled={!unclaimedName.trim()}
                        style={{
                          padding: '13px',
                          borderRadius: 14,
                          background: unclaimedName.trim() ? 'var(--amber)' : 'var(--br2)',
                          color: unclaimedName.trim() ? '#fff' : 'var(--tx3)',
                          fontSize: 15,
                          fontWeight: 700,
                          width: '100%',
                          transition: 'all 150ms',
                        }}
                      >
                        Send unclaimed gift 📬
                      </button>
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: '#CC7A10',
                        marginTop: 10,
                        lineHeight: 1.5,
                      }}
                    >
                      🔒 Held securely · 30-day window · Full refund if unclaimed
                    </p>
                  </div>

                  {giftSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-green"
                      style={{ marginTop: 12, textAlign: 'center' }}
                    >
                      <p style={{ fontSize: 24, marginBottom: 6 }}>📬</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--gd)' }}>
                        Gift sent!
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--gd)', marginTop: 4 }}>
                        {unclaimedName} will receive an email to claim it within 30 days.
                      </p>
                      <button
                        onClick={onClose}
                        style={{
                          marginTop: 14,
                          padding: '12px 32px',
                          borderRadius: 14,
                          background: 'var(--green)',
                          color: '#fff',
                          fontSize: 15,
                          fontWeight: 700,
                          width: '100%',
                        }}
                      >
                        Done 💚
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
