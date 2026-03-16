import { CHARITIES, SAMPLE_DONATIONS } from '@/lib/mock-data';
import { totalCents } from '@/lib/utils';

// TODO: [SUPABASE] Check admin role from real session
const IS_ADMIN = true;

export default function AdminPage() {
  if (!IS_ADMIN) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--tx3)' }}>
        Access denied
      </div>
    );
  }

  const totalGiven = totalCents(SAMPLE_DONATIONS);
  const verifiedCount = CHARITIES.filter((c) => c.verificationStatus === 'VERIFIED').length;

  const metrics = [
    { label: 'Total donations', value: SAMPLE_DONATIONS.length, color: 'var(--bl)' },
    { label: 'Total raised', value: `$${(totalGiven / 100).toFixed(0)}`, color: 'var(--gl)' },
    { label: 'Charities', value: CHARITIES.length, color: 'var(--al)' },
    { label: 'Verified', value: verifiedCount, color: 'var(--gl)' },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: 'var(--tx)',
          marginBottom: 20,
        }}
      >
        Overview
      </h1>

      {/* Metric cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: m.color,
              border: '1.5px solid var(--br)',
              borderRadius: 16,
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--tx)' }}>{m.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)', marginTop: 4 }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charities table */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--tx)',
          marginBottom: 12,
        }}
      >
        Charities
      </h2>
      <div
        style={{
          background: 'var(--sf)',
          border: '1.5px solid var(--br)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 32,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--sf2)' }}>
              {['', 'Name', 'Category', 'Status', 'Impact'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontWeight: 800,
                    color: 'var(--tx3)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHARITIES.map((c, i) => (
              <tr
                key={c.id}
                style={{
                  borderTop: i > 0 ? '1px solid var(--br)' : 'none',
                }}
              >
                <td style={{ padding: '10px 16px', fontSize: 18 }}>{c.emoji}</td>
                <td
                  style={{
                    padding: '10px 16px',
                    fontWeight: 700,
                    color: 'var(--tx)',
                  }}
                >
                  {c.displayName}
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--tx2)' }}>
                  {c.category}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span
                    className="pill"
                    style={{
                      background: c.verificationStatus === 'VERIFIED' ? 'var(--gl)' : 'var(--al)',
                      color: c.verificationStatus === 'VERIFIED' ? 'var(--gd)' : '#CC7A10',
                    }}
                  >
                    {c.verificationStatus}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--tx2)', fontSize: 12 }}>
                  {c.impactSummary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent donations */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--tx)',
          marginBottom: 12,
        }}
      >
        Recent Donations
      </h2>
      <div
        style={{
          background: 'var(--sf)',
          border: '1.5px solid var(--br)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--sf2)' }}>
              {['ID', 'Charity', 'Amount', 'Status', 'Date'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontWeight: 800,
                    color: 'var(--tx3)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...SAMPLE_DONATIONS]
              .sort((a, b) => new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime())
              .slice(0, 10)
              .map((d, i) => {
                const charity = CHARITIES.find((c) => c.id === d.charityId);
                return (
                  <tr key={d.id} style={{ borderTop: i > 0 ? '1px solid var(--br)' : 'none' }}>
                    <td
                      style={{
                        padding: '10px 16px',
                        color: 'var(--tx3)',
                        fontFamily: 'monospace',
                        fontSize: 11,
                      }}
                    >
                      {d.id}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--tx)' }}>
                      {charity?.displayName ?? d.charityId}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 900,
                        color: 'var(--green)',
                      }}
                    >
                      ${(d.amountCents / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="pill pg">{d.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--tx2)' }}>
                      {new Date(d.donatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
