import BottomNav from '@/components/nav/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
        background: 'var(--bg)',
      }}
    >
      <main style={{ paddingBottom: 90 }}>{children}</main>
      <BottomNav />
    </div>
  );
}
