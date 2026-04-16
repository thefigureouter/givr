'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Heart, BarChart2 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/feed', label: 'Feed', Icon: Heart },
  { href: '/impact', label: 'Impact', Icon: BarChart2 },
];

export default function BottomNav() {
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
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active =
          pathname === href ||
          (href === '/explore' && pathname.startsWith('/donate')) ||
          (href === '/impact' && pathname === '/history');
        return (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={active} />
        );
      })}
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
        flex: 1,
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
