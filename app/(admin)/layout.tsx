export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px 48px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 0',
          borderBottom: '1.5px solid var(--br)',
          marginBottom: 24,
        }}
      >
        <span style={{ fontSize: 24 }}>💚</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--tx)' }}>
          TapGive Admin
        </span>
      </header>
      {children}
    </div>
  );
}
