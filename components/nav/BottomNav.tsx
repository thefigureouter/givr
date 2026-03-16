'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Heart, BarChart2, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/feed', label: 'Feed', Icon: Heart },
  { href: '/impact', label: 'Impact', Icon: BarChart2 },
];

interface BottomNavProps {
  onFabClick?: () => void;
}

export default function BottomNav({ onFabClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 80,
        background: 'var(--sf)',
        borderTop: '1.5px solid var(--br)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.slice(0, 2).map(({ href, label, Icon }) => (
        <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
      ))}

      {/* Center FAB */}
      <button
        onClick={onFabClick}
        aria-label="Give now"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 6px 20px rgba(24,184,90,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -18,
          flexShrink: 0,
          transition: 'transform 120ms ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>

      {NAV_ITEMS.slice(2).map(({ href, label, Icon }) => (
        <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
      ))}
    </nav>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size: number; strokeWidth: number; color: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minWidth: 48,
        minHeight: 48,
        justifyContent: 'center',
        textDecoration: 'none',
        color: active ? 'var(--green)' : 'var(--tx3)',
      }}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} color={active ? 'var(--green)' : 'var(--tx3)'} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
    </Link>
  );
}
