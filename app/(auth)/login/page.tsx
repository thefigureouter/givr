'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    if (supabaseConfigured && supabase) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
    }

    router.push('/home');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>💚</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--tx)', margin: '0 0 6px' }}>TapGive</h1>
      <p style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>Give in 10 seconds.</p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          autoComplete="email"
          style={{
            padding: '14px 16px', borderRadius: 14,
            border: '1.5px solid var(--br)', background: 'var(--sf)',
            fontSize: 15, color: 'var(--tx)', outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          autoComplete="current-password"
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
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: '16px', borderRadius: 16,
            background: loading ? 'var(--br2)' : 'var(--green)',
            color: '#fff', fontSize: 16, fontWeight: 800, minHeight: 56,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in 💚'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--tx3)' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: 'var(--green)', fontWeight: 700 }}>Sign up free</Link>
        </p>

        {!supabaseConfigured && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--tx3)' }}>
            Demo mode — tap Sign in to continue
          </p>
        )}
      </div>
    </div>
  );
}
