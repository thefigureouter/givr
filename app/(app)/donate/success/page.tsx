'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DEMO_USER } from '@/lib/mock-data';

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amount = parseInt(params.get('amount') ?? '0', 10);
  const charityName = params.get('charity') ?? 'a charity';
  const impact = params.get('impact') ?? '';
  const streak = parseInt(params.get('streak') ?? '0', 10);
  const badge = params.get('badge') ?? '';

  const dollars = (amount / 100).toFixed(amount % 100 === 0 ? 0 : 2);

  // Load persisted profile email if available
  let displayEmail = DEMO_USER.email;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tapgive_profile');
      if (saved) displayEmail = JSON.parse(saved).email ?? DEMO_USER.email;
    } catch {}
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => router.push('/home'), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [router]);

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '40px 16px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {/* Check */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0, type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          background: 'var(--gl)',
          border: '3px solid var(--gm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          marginBottom: 20,
        }}
      >
        ✅
      </motion.div>

      {/* Amount */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', marginBottom: 8 }}
      >
        <div style={{ fontSize: 58, fontWeight: 900, color: 'var(--tx)', lineHeight: 1 }}>
          ${dollars}
        </div>
        <div style={{ fontSize: 16, color: 'var(--tx2)', marginTop: 6, fontWeight: 600 }}>
          donated to {charityName}
        </div>
      </motion.div>

      {/* Impact */}
      {impact && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
          style={{ width: '100%', marginBottom: 12, textAlign: 'center' }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', margin: 0 }}>
            {impact}
          </p>
        </motion.div>
      )}

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="card-amber"
        style={{
          width: '100%',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#CC7A10' }}>🔥 Daily streak</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--tx)', marginTop: 2 }}>
            {streak} days
          </div>
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 999,
            background: '#CC7A10',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          +1
        </span>
      </motion.div>

      {/* Badge */}
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="card-amber"
          style={{ width: '100%', marginBottom: 12 }}
        >
          <p style={{ fontSize: 13, fontWeight: 800, color: '#CC7A10', margin: 0 }}>
            🏆 New badge earned: {badge.replace(/_/g, ' ')}
          </p>
        </motion.div>
      )}

      {/* Receipt */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: badge ? 1.5 : 1.2 }}
        style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 24, textAlign: 'center' }}
      >
        📧 Receipt sent to {displayEmail}
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: badge ? 1.5 : 1.2 }}
        style={{ display: 'flex', gap: 10, width: '100%' }}
      >
        <Link
          href="/home"
          onClick={cancel}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 14,
            border: '1.5px solid var(--br)',
            background: 'var(--sf)',
            color: 'var(--tx)',
            fontSize: 15,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          Done
        </Link>
        <Link
          href="/explore"
          onClick={cancel}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 14,
            background: 'var(--green)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          Give again 💚
        </Link>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
