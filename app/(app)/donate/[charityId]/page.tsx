'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { CHARITIES, DEMO_USER } from '@/lib/mock-data';
import { createDonation, getStreak, updateStreak, getDonations, getBadges, awardBadges } from '@/lib/mock-db';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { sendDonationReceipt } from '@/lib/resend';
import { calculateStreak } from '@/lib/streak-engine';
import { checkForNewBadges } from '@/lib/badge-engine';
import type { Charity } from '@/types';

// Stripe Elements — loaded lazily so they don't break SSR
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;
function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadStripe } = require('@stripe/stripe-js');
      stripePromise = loadStripe(key);
    } else {
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
}

const AMOUNTS = [
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
  { label: '$25', cents: 2500 },
  { label: '$50', cents: 5000 },
];

type Step = 'amount' | 'payment' | 'processing';

export default function DonatePage() {
  const params = useParams<{ charityId: string }>();
  const router = useRouter();
  const charity = CHARITIES.find((c) => c.id === params.charityId) ?? null;

  const [userId, setUserId] = useState('demo-user-id');

  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) return;
    client.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const [step, setStep] = useState<Step>('amount');
  const [selectedCents, setSelectedCents] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [impactText, setImpactText] = useState(() => charity ? getImpact(charity, 1000) : '');

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [cardError, setCardError] = useState('');
  const [processing, setProcessing] = useState(false);

  function getImpact(c: Charity, cents: number): string {
    if (cents <= 0) return c.impactSummary ?? `Support ${c.displayName}`;
    const dollars = cents / 100;
    if (c.impactPerDollar && c.impactMetricLabel) {
      const units = Math.round(dollars * c.impactPerDollar * 10) / 10;
      return `$${dollars} = ${units} ${c.impactMetricLabel}`;
    }
    if (c.impactSummary) {
      if (cents >= 5000) return `$${dollars} makes a huge impact for ${c.displayName}!`;
      if (cents >= 2500) return `$${dollars} makes a real difference`;
      return c.impactSummary;
    }
    return `Your $${dollars} supports ${c.displayName}`;
  }

  const parsedCustomCents = customAmount ? Math.round(parseFloat(customAmount) * 100) : 0;
  const effectiveCents = customAmount ? (parsedCustomCents >= 100 ? parsedCustomCents : 0) : selectedCents;

  useEffect(() => {
    if (charity) setImpactText(getImpact(charity, effectiveCents));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCents]);

  // When stepping to payment, create a PaymentIntent
  const proceedToPayment = useCallback(async () => {
    if (!charity || effectiveCents <= 0) return;
    setStep('payment');
    try {
      const res = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charityId: charity.id, amountCents: effectiveCents }),
      });
      const data = await res.json() as { clientSecret?: string; error?: string };
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setCardError(data.error ?? 'Failed to initialize payment');
      }
    } catch {
      setCardError('Network error. Please try again.');
    }
  }, [charity, effectiveCents]);

  async function handlePayment() {
    if (!charity || effectiveCents <= 0) return;
    setProcessing(true);
    setStep('processing');

    try {
      const stripeInstance = await getStripePromise();

      // If Stripe is configured, confirm via Stripe.js
      if (stripeInstance && clientSecret && !clientSecret.startsWith('mock_')) {
        // The PaymentElement handles card collection — confirmPayment submits it
        const { error } = await stripeInstance.confirmPayment({
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/donate/success`,
          },
          redirect: 'if_required',
        });
        if (error) {
          setCardError(error.message ?? 'Payment failed');
          setStep('payment');
          setProcessing(false);
          return;
        }
      }
      // Mock path: clientSecret is mock_* or stripe not configured — just proceed

      const paymentIntentId = clientSecret?.replace('mock_pi_secret_', 'pi_mock_') ?? 'pi_mock_local';

      const donation = await createDonation({
        userId,
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
      const streakData = await getStreak(userId);
      const { newStreak } = calculateStreak(
        streakData?.lastDonationDate ?? null,
        streakData?.currentStreak ?? 0
      );
      await updateStreak(userId, newStreak, streakData?.longestStreak ?? 0, new Date());

      // Check badges
      const [donations, existingBadges] = await Promise.all([
        getDonations(userId),
        getBadges(userId),
      ]);
      const earnedTypes = existingBadges.map((b) => b.badgeType);
      const newBadges = checkForNewBadges(donations, newStreak, earnedTypes);
      if (newBadges.length > 0) await awardBadges(userId, newBadges);

      // Send receipt
      let userEmail = DEMO_USER.email;
      try {
        const client = getBrowserSupabase();
        if (client) {
          const { data: { user } } = await client.auth.getUser();
          if (user?.email) userEmail = user.email;
        }
      } catch {}
      await sendDonationReceipt(userEmail, donation, charity);

      const qp = new URLSearchParams({
        amount: String(effectiveCents),
        charity: charity.displayName,
        impact: impactText,
        streak: String(newStreak),
        badge: newBadges[0] ?? '',
        email: userEmail,
      });
      router.push(`/donate/success?${qp.toString()}`);
    } catch {
      setCardError('Something went wrong. Please try again.');
      setStep('payment');
      setProcessing(false);
    }
  }

  if (!charity) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)', marginBottom: 8 }}>Charity not found</div>
        <a href="/explore" style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>Browse charities →</a>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: '0 16px 24px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 16 }}>
        <button
          onClick={() => step === 'payment' ? setStep('amount') : router.back()}
          aria-label="Go back"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--sf2)', border: '1px solid var(--br)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color="var(--tx)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{charity.emoji}</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx)' }}>{charity.displayName}</span>
          </div>
          <span className="pill pg" style={{ marginTop: 4 }}>✅ Verified nonprofit</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'amount' && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
          >
            {/* Impact card */}
            <div className="card-green" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--gd)', margin: 0 }}>
                🌟 {impactText}
              </p>
            </div>

            {/* Amount selector */}
            <p className="section-label">Choose amount</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {AMOUNTS.map((a) => {
                const active = !customAmount && selectedCents === a.cents;
                return (
                  <button
                    key={a.cents}
                    onClick={() => { setSelectedCents(a.cents); setCustomAmount(''); }}
                    style={{
                      padding: '14px 12px', borderRadius: 16,
                      border: `2px solid ${active ? 'var(--green)' : 'var(--br)'}`,
                      background: active ? 'var(--gl)' : 'var(--sf)',
                      cursor: 'pointer', textAlign: 'center', minHeight: 56,
                      transition: 'all 120ms',
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 900, color: active ? 'var(--gd)' : 'var(--tx)' }}>
                      {a.label}
                    </div>
                    {charity.impactPerDollar && charity.impactMetricLabel && (
                      <div style={{ fontSize: 11, color: active ? 'var(--gd)' : 'var(--tx3)', fontWeight: 600, marginTop: 2 }}>
                        {Math.round((a.cents / 100) * charity.impactPerDollar * 10) / 10} {charity.impactMetricLabel}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom amount */}
            <div
              style={{
                display: 'flex', alignItems: 'center',
                border: `2px dashed ${customAmount ? 'var(--green)' : 'var(--br2)'}`,
                borderRadius: 14, padding: '12px 14px', marginBottom: 4,
                background: customAmount ? 'var(--gl)' : 'transparent', transition: 'all 120ms',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: customAmount ? 'var(--gd)' : 'var(--tx3)', marginRight: 6 }}>$</span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 18, fontWeight: 800, color: 'var(--tx)' }}
              />
            </div>
            {customAmount && parsedCustomCents < 100 && parsedCustomCents > 0 && (
              <p style={{ fontSize: 12, color: 'var(--coral)', margin: '4px 0 12px', fontWeight: 600 }}>
                Minimum donation is $1.00
              </p>
            )}

            {/* Fee breakdown */}
            <div className="card" style={{ margin: '16px 0', padding: '14px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FeeRow label="Donation" value={`$${(effectiveCents / 100).toFixed(2)}`} />
                <FeeRow label="Processing fee" value={<span className="pill pg">Covered ✨</span>} />
                <div style={{ height: 1, background: 'var(--br)', margin: '2px 0' }} />
                <FeeRow
                  label="Charity receives"
                  value={<span style={{ color: 'var(--green)', fontWeight: 900 }}>${(effectiveCents / 100).toFixed(2)}</span>}
                  bold
                />
              </div>
            </div>

            {/* Public toggle */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '14px 16px' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Share publicly</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>Appear in giving feed</div>
              </div>
              <Toggle on={isPublic} onChange={setIsPublic} />
            </div>

            {/* Continue to payment */}
            <button
              onClick={proceedToPayment}
              disabled={effectiveCents <= 0}
              style={{
                width: '100%', padding: '16px', borderRadius: 16,
                background: effectiveCents <= 0 ? 'var(--br2)' : 'var(--green)',
                color: '#fff', fontSize: 17, fontWeight: 800, minHeight: 56,
                transition: 'all 150ms', cursor: effectiveCents <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Continue · ${(effectiveCents / 100).toFixed(effectiveCents % 100 === 0 ? 0 : 2)} 💚
            </button>
          </motion.div>
        )}

        {(step === 'payment' || step === 'processing') && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18 }}
          >
            {/* Summary */}
            <div className="card-green" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--gd)', fontWeight: 600 }}>Donating to</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', marginTop: 2 }}>{charity.displayName}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)' }}>
                  ${(effectiveCents / 100).toFixed(effectiveCents % 100 === 0 ? 0 : 2)}
                </div>
              </div>
            </div>

            {/* Card section */}
            <p className="section-label">Payment</p>

            {clientSecret && !clientSecret.startsWith('mock_') ? (
              <StripePaymentForm
                clientSecret={clientSecret}
                onReady={() => setStripeReady(true)}
                onError={setCardError}
              />
            ) : (
              /* Mock card UI when Stripe is not configured */
              <div
                style={{
                  border: '2px solid var(--br)', borderRadius: 16,
                  padding: '16px', marginBottom: 16, background: 'var(--sf)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <CreditCard size={18} color="var(--tx3)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Card details</span>
                  <span className="pill" style={{ marginLeft: 'auto', background: 'var(--gl)', color: 'var(--gd)', fontSize: 11 }}>
                    Demo mode
                  </span>
                </div>
                <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
                  No real card needed in demo mode.
                  <br />Your donation will be simulated.
                </div>
              </div>
            )}

            {cardError && (
              <p style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 600, margin: '0 0 12px' }}>
                {cardError}
              </p>
            )}

            <button
              onClick={handlePayment}
              disabled={processing || (!!clientSecret && !clientSecret.startsWith('mock_') && !stripeReady)}
              style={{
                width: '100%', padding: '16px', borderRadius: 16, minHeight: 56,
                background: processing ? 'var(--br2)' : 'var(--green)',
                color: '#fff', fontSize: 17, fontWeight: 800,
                transition: 'all 150ms',
                cursor: processing ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? 'Processing...' : `Give $${(effectiveCents / 100).toFixed(effectiveCents % 100 === 0 ? 0 : 2)} 💚`}
            </button>

            <p style={{ fontSize: 12, color: 'var(--tx3)', textAlign: 'center', marginTop: 12 }}>
              🔒 Secured by Stripe · 100% goes to charity
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stripe PaymentElement wrapper ───────────────────────────────────────────

function StripePaymentForm({
  clientSecret,
  onReady,
  onError,
}: {
  clientSecret: string;
  onReady: () => void;
  onError: (msg: string) => void;
}) {
  const [Elements, setElements] = useState<React.ComponentType<{
    stripe: Promise<import('@stripe/stripe-js').Stripe | null>;
    options: { clientSecret: string; appearance: Record<string, unknown> };
    children: React.ReactNode;
  }> | null>(null);
  const [PaymentElement, setPaymentElement] = useState<React.ComponentType<{ onReady: () => void }> | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    Promise.all([
      import('@stripe/react-stripe-js'),
    ]).then(([stripeReact]) => {
      setElements(() => stripeReact.Elements);
      setPaymentElement(() => stripeReact.PaymentElement);
    }).catch(() => onError('Failed to load payment form'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!Elements || !PaymentElement) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
        Loading payment form...
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: { colorPrimary: '#18B85A', borderRadius: '12px', fontFamily: 'Figtree, system-ui, sans-serif' },
  };

  return (
    <Elements stripe={getStripePromise() ?? Promise.resolve(null)} options={{ clientSecret, appearance }}>
      <PaymentElement onReady={onReady} />
    </Elements>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeeRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 400, color: bold ? 'var(--tx)' : 'var(--tx2)' }}>
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
        width: 44, height: 26, borderRadius: 999,
        background: on ? 'var(--green)' : '#D8D4CA',
        position: 'relative', transition: 'background 200ms', flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'left 200ms',
        }}
      />
    </button>
  );
}
