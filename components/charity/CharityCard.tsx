'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Charity } from '@/types';

interface CharityCardProps {
  charity: Charity;
  variant?: 'compact' | 'hero';
}

export default function CharityCard({ charity, variant = 'compact' }: CharityCardProps) {
  if (variant === 'hero') {
    return (
      <Link href={`/donate/${charity.id}`} style={{ textDecoration: 'none' }}>
        <div className="card tap-scale" style={{ cursor: 'pointer' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 46,
                height: 46,
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
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)' }}>
                {charity.displayName}
              </div>
              {charity.verificationStatus === 'VERIFIED' && (
                <span className="pill pg" style={{ marginTop: 3 }}>
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 13,
              color: 'var(--tx2)',
              lineHeight: 1.5,
              margin: '0 0 10px',
            }}
          >
            {charity.missionSummary}
          </p>

          {/* Impact */}
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--green)',
              margin: '0 0 12px',
            }}
          >
            ⭐ {charity.impactSummary}
          </p>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="pill pgr">{charity.category.replace('_', ' ')}</span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'var(--green)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Give <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Compact
  return (
    <Link href={`/donate/${charity.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card tap-scale"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
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
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>
            {charity.displayName}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>
            {charity.impactSummary}
          </div>
        </div>
        {charity.verificationStatus === 'VERIFIED' && (
          <span className="pill pg">✓</span>
        )}
      </div>
    </Link>
  );
}
