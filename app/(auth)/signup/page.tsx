'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please fill in all fields. Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    if (supabaseConfigured && supabase) {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      // Supabase sends a confirmation email by default
      setVerificationSent(true);
      setLoading(false);
      return;
    }

    // Demo mode — go straight to home
    router.push('/home');
  }

  if (verificationSent) {
    return (
      <div
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px', maxWidth: 430, margin: '0 auto', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--tx)', margin: '0 0 8px' }}>Check your email</h1>
        <p style={{ fontSize: 14, color: 'var(--tx3)', lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: 'var(--tx)' }}>{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/login" style={{ marginTop: 24, color: 'var(--green)', fontWeight: 700, fontSize: 14 }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', maxWidth: 430, margin: '0 auto',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>💚</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--tx)', margin: '0 0 6px' }}>Join TapGive</h1>
      <p style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>Start giving in seconds.</p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          style={{
            padding: '14px 16px', borderRadius: 14,
            border: '1.5px solid var(--br)', background: 'var(--sf)',
            fontSize: 15, color: 'var(--tx)', outline: 'none',
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          style={{
            padding: '14px 16px', borderRadius: 14,
            border: '1.5px solid var(--br)', background: 'var(--sf)',
            fontSize: 15, color: 'var(--tx)', outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
          autoComplete="new-password"
          style={{
            padding: '14px 16px', borderRadius: 14,
            border: '1.5px solid var(--br)', background: 'var(--sf)',
            fontSize: 15, color: 'var(--tx)', outline: 'none',
          }}
        />

        {error && (
          <p style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 600, margin: 0 }}>{error}</p>
        )}

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            padding: '16px', borderRadius: 16,
            background: loading ? 'var(--br2)' : 'var(--green)',
            color: '#fff', fontSize: 16, fontWeight: 800, minHeight: 56,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating account...' : 'Create account 💚'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--tx3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
