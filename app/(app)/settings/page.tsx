'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import type { MeResponse } from '@/app/api/me/route';

const SETTINGS_KEY = 'tapgive_settings';
const PROFILE_KEY = 'tapgive_profile';

interface SettingsState {
  streakReminders: boolean;
  emailReceipts: boolean;
  badgeAlerts: boolean;
}

interface ProfileState {
  name: string;
  email: string;
  bio: string;
}

function loadSettings(): SettingsState {
  if (typeof window === 'undefined') return { streakReminders: true, emailReceipts: true, badgeAlerts: false };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { streakReminders: true, emailReceipts: true, badgeAlerts: false };
}

function loadProfile(): ProfileState {
  if (typeof window === 'undefined') return { name: '', email: '', bio: '' };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: '', email: '', bio: '' };
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

interface SettingRowProps {
  icon: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  href?: string;
  toggle?: boolean;
  toggleOn?: boolean;
  onToggle?: (v: boolean) => void;
  onClick?: () => void;
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
  onClick,
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
        <div style={{ fontSize: 14, fontWeight: 700, color: destructive ? 'var(--coral)' : 'var(--tx)' }}>
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
  // When there's a toggle, the Toggle button is the interactive element — use div to avoid button-in-button
  if (toggle) {
    return (
      <div style={{ width: '100%', display: 'block', textAlign: 'left' }}>
        {inner}
      </div>
    );
  }
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'block', textAlign: 'left' }}>
      {inner}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [profile, setProfile] = useState<ProfileState>(loadProfile);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ProfileState>(profile);
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  // Load the real user's profile from server on mount
  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.ok ? r.json() as Promise<MeResponse> : null)
      .then((me) => {
        if (me?.id) setProfile({ name: me.name, email: me.email, bio: me.bio });
      });
  }, []);

  function updateSetting(key: keyof SettingsState, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  function saveProfile() {
    setProfile(editDraft);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(editDraft));
    setEditOpen(false);
  }

  async function handleSignOut() {
    const client = getBrowserSupabase();
    if (client) await client.auth.signOut(); // clears session cookie
    localStorage.clear();
    router.push('/login');
  }

  return (
    <>
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
            {profile.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)' }}>{profile.name}</div>
            <div style={{ fontSize: 13, color: 'var(--tx3)' }}>{profile.email}</div>
          </div>
          <button
            onClick={() => { setEditDraft(profile); setEditOpen(true); }}
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
            toggleOn={settings.streakReminders}
            onToggle={(v) => updateSetting('streakReminders', v)}
          />
          <SettingRow
            icon="📧"
            iconBg="var(--bl)"
            label="Email receipts"
            toggle
            toggleOn={settings.emailReceipts}
            onToggle={(v) => updateSetting('emailReceipts', v)}
          />
          <SettingRow
            icon="🏆"
            iconBg="var(--gl)"
            label="Badge alerts"
            toggle
            toggleOn={settings.badgeAlerts}
            onToggle={(v) => updateSetting('badgeAlerts', v)}
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
            onClick={() => setSignOutConfirm(true)}
            isLast
          />
        </div>
      </motion.div>

      {/* Edit profile modal */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: 100,
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                margin: '0 auto',
                width: '100%',
                maxWidth: 430,
                background: 'var(--sf)',
                borderRadius: '24px 24px 0 0',
                padding: '20px 20px 40px',
                zIndex: 101,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Edit Profile</h2>
                <button onClick={() => setEditOpen(false)} style={{ padding: 6 }}>
                  <X size={20} color="var(--tx3)" />
                </button>
              </div>

              {[
                { label: 'Name', field: 'name' as const, type: 'text' },
                { label: 'Email', field: 'email' as const, type: 'email' },
              ].map(({ label, field, type }) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={editDraft[field]}
                    onChange={(e) => setEditDraft((p) => ({ ...p, [field]: e.target.value }))}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: 6,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1.5px solid var(--br)',
                      background: 'var(--sf2)',
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--tx)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Bio
                </label>
                <textarea
                  value={editDraft.bio}
                  onChange={(e) => setEditDraft((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 6,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--br)',
                    background: 'var(--sf2)',
                    fontSize: 14,
                    color: 'var(--tx)',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={!editDraft.name.trim() || !editDraft.email.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 14,
                  background: !editDraft.name.trim() || !editDraft.email.trim() ? 'var(--br2)' : 'var(--green)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                Save changes
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sign out confirm */}
      <AnimatePresence>
        {signOutConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSignOutConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: 0,
                right: 0,
                margin: '0 auto',
                marginTop: '-160px',
                width: 'calc(100% - 48px)',
                maxWidth: 340,
                background: 'var(--sf)',
                borderRadius: 20,
                padding: 24,
                zIndex: 101,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx)', marginBottom: 8 }}>
                Sign out?
              </div>
              <div style={{ fontSize: 14, color: 'var(--tx2)', marginBottom: 24, lineHeight: 1.5 }}>
                Your streak and data will be here when you come back.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSignOutConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: '1.5px solid var(--br)',
                    background: 'var(--sf2)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--tx)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    background: 'var(--coral)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
