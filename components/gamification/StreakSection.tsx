'use client';

interface StreakSectionProps {
  currentStreak: number;
  totalCents: number;
  causeCount: number;
}

export default function StreakSection({ currentStreak, totalCents, causeCount }: StreakSectionProps) {
  const totalDollars = (totalCents / 100).toFixed(2);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {/* Daily streak */}
      <div
        className="card-amber"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
          padding: '16px 14px',
          borderRadius: 20,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#CC7A10',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            margin: 0,
          }}
        >
          Daily streak
        </p>
        <span
          style={{
            fontSize: 32,
            animation: 'bob 2s ease-in-out infinite',
            display: 'inline-block',
            lineHeight: 1,
          }}
        >
          🔥
        </span>
        <p
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: 'var(--tx)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          {currentStreak}
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#CC7A10',
            margin: 0,
          }}
        >
          days in a row
        </p>
      </div>

      {/* Total given */}
      <div
        className="card-green"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
          padding: '16px 14px',
          borderRadius: 20,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--gd)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            margin: 0,
          }}
        >
          Total given
        </p>
        <span
          style={{
            fontSize: 32,
            animation: 'bob 2s ease-in-out infinite 0.3s',
            display: 'inline-block',
            lineHeight: 1,
          }}
        >
          💚
        </span>
        <p
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: 'var(--tx)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          ${totalDollars}
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--gd)',
            margin: 0,
          }}
        >
          across {causeCount} causes
        </p>
      </div>
    </div>
  );
}
