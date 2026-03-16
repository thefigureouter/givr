'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CHARITIES } from '@/lib/mock-data';
import { createDonation, getStreak, updateStreak, getDonations, awardBadges } from '@/lib/mock-db';
import { createPaymentIntent, confirmPayment } from '@/lib/stripe';
import { sendDonationReceipt } from '@/lib/resend';
import { calculateStreak } from '@/lib/streak-engine';
import { checkForNewBadges } from '@/lib/badge-engine';
import { uniqueCharityIds, totalCents, randomId } from '@/lib/utils';
import type { Charity } from '@/types';

const AMOUNTS = [
  { label: '$5', cents: 500, impact: 'Half a day of meals' },
  { label: '$10', cents: 1000, impact: 'Full day of meals' },
  { label: '$25', cents: 2500, impact: 'A full week' },
  { label: '$50', cents: 5000, impact: 'Two families' },
];

export default function DonatePage() {
  const params = useParams<{ charityId: string }>();
  const router = useRouter();
  const charity = CHARITIES.find((c) => c.id === params.charityId) ?? CHARITIES[0];

  const [selectedCents, setSelectedCents] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [impactText, setImpactText] = useState(getImpact(charity, 1000));

  function getImpact(c: Charity, cents: number): string {
    if (c.impactSummary) {
      if (cents >= 5000) return `$${cents / 100} = huge impact for ${c.displayName}!`;
      if (cents >= 2500) return `$${cents / 100} makes a real difference`;
      return c.impactSummary;
    }
    return `Your $${cents / 100} supports ${c.displayName}`;
  }

  const effectiveCents = customAmount
    ? Math.round(parseFloat(customAmount) * 100) || 0
    : selectedCents;

  useEffect(() => {
    setImpactText(getImpact(charity, effectiveCents));
  }, [effectiveCents, charity]);

  async function handleGive() {
    if (effectiveCents <= 0) return;
    setProcessing(true);

    try {
      const { paymentIntentId } = await createPaymentIntent(effectiveCents, charity.id);
      await confirmPayment(paymentIntentId);

      const donation = await createDonation({
        userId: 'demo-user-id',
        charityId: charity.id,
        amountCents: effectiveCents,
        tipCents: 0,
        feeCents: 0,
        totalCents: effectiveCents,
        charityReceivesCents: effectiveCents,
        currency: 'usd',
        status: 'SUCCEEDED',
        privacyMode: isPublic ? 'PUBLIC' : 'PRIVATE',
        fundingSource: 'card',
        stripePaymentIntentId: paymentIntentId,
        donatedAt: new Date().toISOString(),
      });

      // Update streak
      const streakData = await getStreak('demo-user-id');
      const { newStreak } = calculateStreak(
        streakData?.lastDonationDate ?? null,
        streakData?.currentStreak ?? 0
      );
      await updateStreak('demo-user-id', newStreak, streakData?.longestStreak ?? 0, new Date());

      // Check badges
      const donations = await getDonations('demo-user-id');
      const newBadges = checkForNewBadges(donations, newStreak, []);
      if (newBadges.length > 0) {
        await awardBadges('demo-user-id', newBadges);
      }

      // Send receipt
      await sendDonationReceipt('alex@email.com', donation, charity);

      // Navigate to success
      const params = new URLSearchParams({
        amount: String(effectiveCents),
        charity: charity.displayName,
        impact: impactText,
        streak: String(newStreak),
        badge: newBadges[0] ?? '',
      });
      router.push(`/donate/success?${params.toString()}`);
    } finally {
      setProcessing(false);
    }
  }

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
          gap: 12,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--sf2)',
            border: '1px solid var(--br)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color="var(--tx)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{charity.emoji}</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx)' }}>
              {charity.displayName}
            </span>
          </div>
          <span className="pill pg" style={{ marginTop: 4 }}>
            ✅ Verified nonprofit
          </span>
        </div>
      </div>

      {/* Impact card */}
      <div className="card-green" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--gd)', margin: 0 }}>
          🌟 {impactText}
        </p>
      </div>

      {/* Amount selector */}
      <p className="section-label">Choose amount</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 10,
        }}
      >
        {AMOUNTS.map((a) => (
          <button
            key={a.cents}
            onClick={() => {
              setSelectedCents(a.cents);
              setCustomAmount('');
            }}
            style={{
              padding: '14px 12px',
              borderRadius: 16,
              border: `2px solid ${!customAmount && selectedCents === a.cents ? 'var(--green)' : 'var(--br)'}`,
              background: !customAmount && selectedCents === a.cents ? 'var(--gl)' : 'var(--sf)',
              cursor: 'pointer',
              textAlign: 'center',
              minHeight: 64,
              transition: 'all 120ms',
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: !customAmount && selectedCents === a.cents ? 'var(--gd)' : 'var(--tx)',
              }}
            >
              {a.label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: !customAmount && selectedCents === a.cents ? 'var(--gd)' : 'var(--tx3)',
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {a.impact}
            </div>
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: `2px dashed ${customAmount ? 'var(--green)' : 'var(--br2)'}`,
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 16,
          background: customAmount ? 'var(--gl)' : 'transparent',
          transition: 'all 120ms',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: customAmount ? 'var(--gd)' : 'var(--tx3)',
            marginRight: 6,
          }}
        >
          $
        </span>
        <input
          type="number"
          placeholder="Custom amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--tx)',
          }}
        />
      </div>

      {/* Fee breakdown */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FeeRow
            label="Donation"
            value={`$${(effectiveCents / 100).toFixed(2)}`}
          />
          <FeeRow
            label="Processing fee"
            value={<span className="pill pg">Covered ✨</span>}
          />
          <div style={{ height: 1, background: 'var(--br)', margin: '2px 0' }} />
          <FeeRow
            label="Charity receives"
            value={
              <span style={{ color: 'var(--green)', fontWeight: 900 }}>
                ${(effectiveCents / 100).toFixed(2)}
              </span>
            }
            bold
          />
        </div>
      </div>

      {/* Public toggle */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '14px 16px',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Share publicly</div>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
            Appear in giving feed
          </div>
        </div>
        <Toggle on={isPublic} onChange={setIsPublic} />
      </div>

      {/* CTA */}
      <button
        onClick={handleGive}
        disabled={processing || effectiveCents <= 0}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          background: processing || effectiveCents <= 0 ? 'var(--br2)' : 'var(--green)',
          color: '#fff',
          fontSize: 17,
          fontWeight: 800,
          minHeight: 56,
          transition: 'all 150ms',
          cursor: processing || effectiveCents <= 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {processing
          ? 'Processing...'
          : `Give $${(effectiveCents / 100).toFixed(effectiveCents % 100 === 0 ? 0 : 2)} 💚`}
      </button>
    </motion.div>
  );
}

function FeeRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: bold ? 700 : 400,
          color: bold ? 'var(--tx)' : 'var(--tx2)',
        }}
      >
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-checked={on}
      role="switch"
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: on ? 'var(--green)' : '#D8D4CA',
        position: 'relative',
        transition: 'background 200ms',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'left 200ms',
        }}
      />
    </button>
  );
}
