'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { getBrowserSupabase, supabaseBrowserConfigured } from '@/lib/supabase-browser';
import type { MeResponse } from '@/app/api/me/route';
import type { GivingMode, RemainderPreference } from '@/types';

type Step = 'mode' | 'budget' | 'card' | 'done';

const BUDGET_OPTIONS = [
  { cents: 1000, label: '$10 / mo', sublabel: 'A coffee a month' },
  { cents: 2500, label: '$25 / mo', sublabel: 'Most popular' },
  { cents: 5000, label: '$50 / mo', sublabel: 'Make real impact' },
  { cents: 10000, label: '$100 / mo', sublabel: 'Power giver' },
];

const REMAINDER_OPTIONS: { value: RemainderPreference; label: string; sublabel: string }[] = [
  { value: 'top_charity', label: 'Top charity', sublabel: 'Auto-donate to your #1 pick' },
  { value: 'split_even', label: 'Split evenly', sublabel: 'Spread across your saved charities' },
  { value: 'rollover', label: 'Roll over', sublabel: 'Carry unused budget to next month' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('mode');

  const [userEmail, setUserEmail] = useState('demo@tapgive.co');
  const [userName, setUserName] = useState('TapGive User');

  // Resolve user ID once on mount via server-side session
  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.ok ? r.json() as Promise<MeResponse> : null)
      .then((me) => {
        if (me?.id) {
          setUserId(me.id);
          setUserEmail(me.email || 'demo@tapgive.co');
          setUserName(me.name || 'TapGive User');
        }
      });
  }, []);
  const [mode, setMode] = useState<GivingMode>('intentional');
  const [budgetCents, setBudgetCents] = useState(2500);
  const [remainder, setRemainder] = useState<RemainderPreference>('rollover');
  const [saving, setSaving] = useState(false);
  const [cardStep, setCardStep] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading');
  const [cardLast4, setCardLast4] = useState('');

  // For Stripe Elements
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [StripeElements, setStripeElements] = useState<React.ComponentType<{
    stripe: Promise<import('@stripe/stripe-js').Stripe | null>;
    options: { clientSecret: string };
    children: React.ReactNode;
  }> | null>(null);
  const [SetupElement, setSetupElement] = useState<React.ComponentType<{ onReady?: () => void }> | null>(null);
  const [stripeInstance, setStripeInstance] = useState<import('@stripe/stripe-js').Stripe | null>(null);

  // Load Stripe when we reach the card step
  useEffect(() => {
    if (step !== 'card') return;
    let cancelled = false;

    async function init() {
      // Ensure user has a Stripe customer
      try {
        await fetch('/api/stripe/create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, name: userName }),
        });

        const siRes = await fetch('/api/stripe/setup-intent', { method: 'POST' });
        const siData = await siRes.json() as { clientSecret?: string; error?: string };

        if (!cancelled && siData.clientSecret) {
          setSetupClientSecret(siData.clientSecret);

          if (siData.clientSecret.startsWith('mock_')) {
            setCardStep('ready');
            return;
          }

          // Load Stripe.js and React Elements
          const [stripeJs, reactStripe] = await Promise.all([
            import('@stripe/stripe-js'),
            import('@stripe/react-stripe-js'),
          ]);
          const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
          if (publishableKey) {
            const stripe = await stripeJs.loadStripe(publishableKey);
            if (!cancelled) {
              setStripeInstance(stripe);
              setStripeElements(() => reactStripe.Elements);
              setSetupElement(() => reactStripe.PaymentElement);
              setCardStep('ready');
            }
          } else {
            if (!cancelled) setCardStep('ready');
          }
        } else {
          if (!cancelled) setCardStep('error');
        }
      } catch {
        if (!cancelled) setCardStep('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [step]);

  async function saveMode() {
    setSaving(true);
    try {
      if (userId) {
        const client = getBrowserSupabase();
        await client!.from('profiles').update({
          giving_mode: mode,
          monthly_budget_cents: mode === 'budget' ? budgetCents : null,
          remainder_preference: remainder,
        }).eq('id', userId);
      }
    } finally {
      setSaving(false);
    }
    setStep(mode === 'intentional' ? 'card' : 'budget');
  }

  async function saveBudget() {
    setSaving(true);
    try {
      if (userId) {
        const client = getBrowserSupabase();
        await client!.from('profiles').update({
          monthly_budget_cents: budgetCents,
          remainder_preference: remainder,
        }).eq('id', userId);
      }
    } finally {
      setSaving(false);
    }
    setStep('card');
  }

  async function saveCard() {
    if (!setupClientSecret) return;
    setCardStep('saving');

    // Mock path
    if (setupClientSecret.startsWith('mock_')) {
      setCardLast4('4242');
      setCardStep('saved');
      await markComplete();
      return;
    }

    if (!stripeInstance || !StripeElements || !SetupElement) {
      setCardStep('error');
      return;
    }

    const { error, setupIntent } = await stripeInstance.confirmSetup({
      elements: document.querySelector('[data-stripe-elements]') as never,
      confirmParams: { return_url: `${window.location.origin}/onboarding?complete=1` },
      redirect: 'if_required',
    });

    if (error) {
      setCardStep('error');
      return;
    }

    const pm = setupIntent?.payment_method;
    if (typeof pm === 'string' && userId) {
      const client = getBrowserSupabase();
      await client!.from('profiles').update({ stripe_payment_method_id: pm }).eq('id', userId);
    }

    setCardLast4('••••');
    setCardStep('saved');
    await markComplete();
  }

  async function markComplete() {
    if (userId) {
      const client = getBrowserSupabase();
      await client!.from('profiles').update({ onboarding_complete: true }).eq('id', userId);
    }
    setTimeout(() => setStep('done'), 800);
  }

  function skipCard() {
    markComplete().then(() => router.push('/home'));
  }

  const slideVariants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', maxWidth: 430, margin: '0 auto' }}>
      <AnimatePresence mode="wait">

        {/* ── Mode selection ── */}
        {step === 'mode' && (
          <motion.div key="mode" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} style={{ width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>💚</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--tx)', textAlign: 'center', margin: '0 0 6px' }}>How do you want to give?</h1>
            <p style={{ fontSize: 14, color: 'var(--tx3)', textAlign: 'center', marginBottom: 28 }}>You can change this any time in Settings.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {([
                { value: 'budget', emoji: '📅', label: 'Monthly Budget', sublabel: 'Set a monthly cap. Tap freely, batch-charged once.' },
                { value: 'open', emoji: '⚡', label: 'Open Giving', sublabel: 'No cap. Taps are batched and charged weekly.' },
                { value: 'intentional', emoji: '🎯', label: 'One at a Time', sublabel: 'Pay per donation. Best for larger, deliberate gifts.' },
              ] as const).map((m) => {
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px', borderRadius: 18,
                      border: `2px solid ${active ? 'var(--green)' : 'var(--br)'}`,
                      background: active ? 'var(--gl)' : 'var(--sf)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 130ms',
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{m.sublabel}</div>
                    </div>
                    {active && <Check size={18} color="var(--green)" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={saveMode}
              disabled={saving}
              style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'var(--green)', color: '#fff', fontSize: 16, fontWeight: 800, minHeight: 56, cursor: 'pointer' }}
            >
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </motion.div>
        )}

        {/* ── Budget amount ── */}
        {step === 'budget' && (
          <motion.div key="budget" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} style={{ width: '100%' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--tx)', marginBottom: 6 }}>Set your monthly budget</h1>
            <p style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 24 }}>Your card is charged once per month for this amount.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {BUDGET_OPTIONS.map((opt) => {
                const active = budgetCents === opt.cents;
                return (
                  <button key={opt.cents} onClick={() => setBudgetCents(opt.cents)} style={{ padding: '14px 12px', borderRadius: 16, border: `2px solid ${active ? 'var(--green)' : 'var(--br)'}`, background: active ? 'var(--gl)' : 'var(--sf)', cursor: 'pointer', textAlign: 'center', transition: 'all 120ms' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: active ? 'var(--gd)' : 'var(--tx)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: active ? 'var(--gd)' : 'var(--tx3)', fontWeight: 600, marginTop: 3 }}>{opt.sublabel}</div>
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>If budget isn't fully used…</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {REMAINDER_OPTIONS.map((opt) => {
                const active = remainder === opt.value;
                return (
                  <button key={opt.value} onClick={() => setRemainder(opt.value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, border: `2px solid ${active ? 'var(--green)' : 'var(--br)'}`, background: active ? 'var(--gl)' : 'var(--sf)', cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{opt.sublabel}</div>
                    </div>
                    {active && <Check size={16} color="var(--green)" />}
                  </button>
                );
              })}
            </div>

            <button onClick={saveBudget} disabled={saving} style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'var(--green)', color: '#fff', fontSize: 16, fontWeight: 800, minHeight: 56, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </motion.div>
        )}

        {/* ── Card saving ── */}
        {step === 'card' && (
          <motion.div key="card" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} style={{ width: '100%' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--tx)', marginBottom: 6 }}>Add your card</h1>
            <p style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 24 }}>
              {mode === 'intentional' ? 'Saved securely for faster one-tap giving.' : 'Your card is charged automatically per your plan.'}
            </p>

            {cardStep === 'loading' && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--tx3)', fontSize: 14 }}>Loading…</div>
            )}

            {(cardStep === 'ready' || cardStep === 'saving') && setupClientSecret && (
              <>
                {setupClientSecret.startsWith('mock_') ? (
                  <div style={{ border: '2px solid var(--br)', borderRadius: 16, padding: '20px', marginBottom: 16, background: 'var(--sf)', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 4 }}>Demo mode — no real card needed</div>
                    <div style={{ fontSize: 22 }}>💳 •••• 4242</div>
                  </div>
                ) : StripeElements && SetupElement ? (
                  <div data-stripe-elements style={{ marginBottom: 16 }}>
                    <StripeElements
                      stripe={stripeInstance ? Promise.resolve(stripeInstance) : Promise.resolve(null)}
                      options={{ clientSecret: setupClientSecret }}
                    >
                      <SetupElement />
                    </StripeElements>
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Loading payment form…</div>
                )}

                <button onClick={saveCard} disabled={cardStep === 'saving'} style={{ width: '100%', padding: '16px', borderRadius: 16, background: cardStep === 'saving' ? 'var(--br2)' : 'var(--green)', color: '#fff', fontSize: 16, fontWeight: 800, minHeight: 56, cursor: 'pointer', marginBottom: 12 }}>
                  {cardStep === 'saving' ? 'Saving card…' : 'Save card 🔒'}
                </button>
                <button onClick={skipCard} style={{ width: '100%', padding: '12px', borderRadius: 16, background: 'transparent', color: 'var(--tx3)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Skip for now
                </button>
              </>
            )}

            {cardStep === 'saved' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)' }}>Card saved!</div>
                {cardLast4 && <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>•••• {cardLast4}</div>}
              </div>
            )}

            {cardStep === 'error' && (
              <>
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--coral)', fontWeight: 600 }}>Couldn't load payment form.</div>
                <button onClick={skipCard} style={{ width: '100%', padding: '14px', borderRadius: 16, background: 'var(--green)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                  Continue without card
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌱</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--tx)', marginBottom: 8 }}>You're all set!</h1>
            <p style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>Time to start making an impact.</p>
            <button onClick={() => router.push('/home')} style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'var(--green)', color: '#fff', fontSize: 16, fontWeight: 800, minHeight: 56, cursor: 'pointer' }}>
              Start giving 💚
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
