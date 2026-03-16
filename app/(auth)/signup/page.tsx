'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

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
      <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--tx)', margin: '0 0 6px' }}>
        Join TapGive
      </h1>
      <p style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>
        Start giving in seconds.
      </p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Full name"
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid var(--br)',
            background: 'var(--sf)',
            fontSize: 15,
            color: 'var(--tx)',
            outline: 'none',
          }}
        />
        <input
          type="email"
          placeholder="Email"
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid var(--br)',
            background: 'var(--sf)',
            fontSize: 15,
            color: 'var(--tx)',
            outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid var(--br)',
            background: 'var(--sf)',
            fontSize: 15,
            color: 'var(--tx)',
            outline: 'none',
          }}
        />
        <button
          onClick={() => router.push('/home')}
          style={{
            padding: '16px',
            borderRadius: 16,
            background: 'var(--green)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 800,
            minHeight: 56,
          }}
        >
          Create account 💚
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--tx3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
