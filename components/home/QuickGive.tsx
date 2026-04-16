'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

type Amount = '¢25' | '$1' | '$5' | '$10';

interface NotificationEntry {
  id: string;
  amount: string;
  charityName: string;
  tapNumber: number;
}

interface QuickGiveProps {
  charityName: string;
  charityEmoji: string;
  defaultAmount?: Amount;
  onDonate: (amount: string, amountCents: number) => void;
  onChangeCharity: () => void;
}

const AMOUNT_CENTS: Record<Amount, number> = {
  '¢25': 25,
  '$1': 100,
  '$5': 500,
  '$10': 1000,
};

const AMOUNTS: Amount[] = ['¢25', '$1', '$5', '$10'];

export default function QuickGive({
  charityName,
  charityEmoji,
  defaultAmount = '$1',
  onDonate,
  onChangeCharity,
}: QuickGiveProps) {
  const [selected, setSelected] = useState<Amount>(defaultAmount);
  const [pressing, setPressing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const tapCountRef = useRef(0);

  function handleTap() {
    tapCountRef.current += 1;
    const n = tapCountRef.current;

    const id = Date.now().toString();
    setNotifications((prev) => [{ id, amount: selected, charityName, tapNumber: n }, ...prev].slice(0, 3));
    onDonate(selected, AMOUNT_CENTS[selected]);
  }

  return (
    <div
      className="card"
      style={{ padding: 18 }}
      role="region"
      aria-label="Quick give"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '108px 1fr', gap: 14 }}>
        {/* Tap Circle */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <motion.button
            onTapStart={() => setPressing(true)}
            onTap={() => {
              setPressing(false);
              handleTap();
            }}
            onTapCancel={() => setPressing(false)}
            animate={pressing ? { scale: 0.92 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-label={`Tap to give ${selected} to ${charityName}`}
            style={{
              width: 108,
              height: 108,
              borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: pressing
                ? '0 2px 8px rgba(24,184,90,0.2)'
                : '0 5px 18px rgba(24,184,90,0.32)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'visible',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {/* Pulse rings */}
            <div
              style={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                border: '2px solid rgba(24,184,90,0.3)',
                animation: 'rip 2s ease-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -16,
                borderRadius: '50%',
                border: '2px solid rgba(24,184,90,0.18)',
                animation: 'rip 2s ease-out infinite 0.7s',
              }}
            />

            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                lineHeight: 1.2,
              }}
            >
              tap to
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                lineHeight: 1.2,
              }}
            >
              give
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#fff',
                marginTop: 2,
                lineHeight: 1,
              }}
            >
              {selected}
            </span>
          </motion.button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Amount selector */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--tx3)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: 7,
              }}
            >
              Amount
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 7,
              }}
            >
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelected(amt)}
                  style={{
                    padding: '9px 0',
                    borderRadius: 12,
                    border: `2px solid ${selected === amt ? 'var(--green)' : 'var(--br)'}`,
                    background: selected === amt ? 'var(--gl)' : 'var(--sf)',
                    color: selected === amt ? 'var(--gd)' : 'var(--tx2)',
                    fontSize: 14,
                    fontWeight: 800,
                    transition: 'all 120ms',
                    minHeight: 40,
                  }}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Charity selector */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--tx3)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: 7,
              }}
            >
              Giving to
            </p>
            <button
              onClick={onChangeCharity}
              style={{
                width: '100%',
                padding: '8px 11px',
                borderRadius: 12,
                background: 'var(--sf2)',
                border: '1.5px solid var(--br)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 40,
              }}
            >
              <span style={{ fontSize: 16 }}>{charityEmoji}</span>
              <span
                style={{
                  flex: 1,
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--tx)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {charityName}
              </span>
              <ChevronRight size={14} color="var(--tx3)" />
            </button>
          </div>
        </div>
      </div>

      {/* Notification log */}
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--gl)',
              border: '1px solid var(--gm)',
            }}
          >
            <span style={{ fontSize: 16 }}>✅</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gd)' }}>
                {n.amount} → {n.charityName}
              </span>
              <br />
              <span style={{ fontSize: 11, color: 'var(--gd)', opacity: 0.8 }}>
                Tap {n.tapNumber} · streak alive! 🔥
              </span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--gd)' }}>
              {n.amount}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
