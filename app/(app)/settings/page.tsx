'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

interface SettingRowProps {
  icon: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  href?: string;
  toggle?: boolean;
  toggleOn?: boolean;
  onToggle?: (v: boolean) => void;
  destructive?: boolean;
  isLast?: boolean;
}

function SettingRow({
  icon,
  iconBg,
  label,
  subtitle,
  href,
  toggle,
  toggleOn,
  onToggle,
  destructive,
  isLast,
}: SettingRowProps) {
  const inner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--br)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: destructive ? 'var(--coral)' : 'var(--tx)',
          }}
        >
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {toggle && onToggle !== undefined ? (
        <Toggle on={toggleOn ?? false} onChange={onToggle} />
      ) : (
        <ChevronRight size={16} color="var(--tx3)" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </Link>
    );
  }
  return <button style={{ width: '100%', display: 'block', textAlign: 'left' }}>{inner}</button>;
}

export default function SettingsPage() {
  const [streakReminders, setStreakReminders] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [badgeAlerts, setBadgeAlerts] = useState(false);

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
          paddingBottom: 8,
        }}
      >
        <Link
          href="/home"
          aria-label="Back"
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
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--tx)', margin: 0 }}>
          Settings
        </h1>
      </div>

      {/* Profile row */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green), var(--gd))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 900,
          }}
        >
          A
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)' }}>Alex Rivera</div>
          <div style={{ fontSize: 13, color: 'var(--tx3)' }}>alex@email.com</div>
        </div>
        <button
          style={{
            padding: '7px 14px',
            borderRadius: 10,
            border: '1.5px solid var(--br)',
            background: 'var(--sf2)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--tx2)',
            minHeight: 36,
          }}
        >
          Edit
        </button>
      </div>

      {/* Account */}
      <p className="section-label">Account</p>
      <div className="card" style={{ padding: '0 16px' }}>
        <SettingRow icon="📋" iconBg="var(--bl)" label="Transaction history" href="/history" />
        <SettingRow icon="💳" iconBg="var(--gl)" label="Payment methods" />
        <SettingRow icon="🏦" iconBg="var(--al)" label="Linked bank" isLast />
      </div>

      {/* Privacy & giving */}
      <p className="section-label">Privacy &amp; giving</p>
      <div className="card" style={{ padding: '0 16px' }}>
        <SettingRow icon="🌐" iconBg="var(--bl)" label="Default privacy" subtitle="Public" />
        <SettingRow icon="🎯" iconBg="var(--gl)" label="Monthly giving goal" subtitle="$50/month" />
        <SettingRow
          icon="🔒"
          iconBg="var(--al)"
          label="Security threshold"
          subtitle="Face ID > $50"
          isLast
        />
      </div>

      {/* Notifications */}
      <p className="section-label">Notifications</p>
      <div className="card" style={{ padding: '0 16px' }}>
        <SettingRow
          icon="🔔"
          iconBg="var(--al)"
          label="Streak reminders"
          toggle
          toggleOn={streakReminders}
          onToggle={setStreakReminders}
        />
        <SettingRow
          icon="📧"
          iconBg="var(--bl)"
          label="Email receipts"
          toggle
          toggleOn={emailReceipts}
          onToggle={setEmailReceipts}
        />
        <SettingRow
          icon="🏆"
          iconBg="var(--gl)"
          label="Badge alerts"
          toggle
          toggleOn={badgeAlerts}
          onToggle={setBadgeAlerts}
          isLast
        />
      </div>

      {/* Support */}
      <p className="section-label">Support</p>
      <div className="card" style={{ padding: '0 16px' }}>
        <SettingRow icon="💬" iconBg="var(--sf2)" label="Help &amp; support" />
        <SettingRow icon="📜" iconBg="var(--sf2)" label="Privacy policy" />
        <SettingRow
          icon="🚪"
          iconBg="var(--cl)"
          label="Sign out"
          destructive
          isLast
        />
      </div>
    </motion.div>
  );
}
