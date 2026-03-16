'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getDonations } from '@/lib/mock-db';
import { CHARITIES } from '@/lib/mock-data';
import { groupByMonth, totalCents } from '@/lib/utils';
import type { Donation } from '@/types';

const YEARS = ['2024', '2023', 'All time'];

export default function HistoryPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeYear, setActiveYear] = useState('2024');
  const [pdfMsg, setPdfMsg] = useState('');
  const [csvMsg, setCsvMsg] = useState('');

  useEffect(() => {
    getDonations('demo-user-id').then(setDonations);
  }, []);

  const filtered = donations.filter((d) => {
    if (activeYear === 'All time') return true;
    return d.donatedAt.startsWith(activeYear);
  });

  const groups = groupByMonth(filtered);
  const total = totalCents(filtered);

  function handlePDF() {
    setPdfMsg('📄 Tax summary downloaded!');
    setTimeout(() => setPdfMsg(''), 3500);
  }

  function handleCSV() {
    setCsvMsg('📊 CSV exported!');
    setTimeout(() => setCsvMsg(''), 3500);
  }

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
          href="/impact"
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
          Transactions
        </h1>
      </div>

      {/* Tax summary card */}
      <div
        style={{
          border: '2px solid var(--green)',
          borderRadius: 20,
          background: 'var(--sf)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>📄</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>
              {activeYear} Tax Summary
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 2 }}>
              ${(total / 100).toFixed(2)} in deductible donations
            </div>
          </div>
        </div>

        {/* Inner green card */}
        <div
          className="card-green"
          style={{ padding: '12px 14px', marginBottom: 12, borderRadius: 14 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd)', textTransform: 'uppercase' }}>
                Tax Year
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--tx)' }}>
                {activeYear === 'All time' ? '2024' : activeYear}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd)', textTransform: 'uppercase' }}>
                Total
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--tx)' }}>
                ${(total / 100).toFixed(0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd)', textTransform: 'uppercase' }}>
                Donations
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--tx)' }}>
                {filtered.length}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span className="pill pg">✓ 501(c)(3) verified</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePDF}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: 'var(--green)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              minHeight: 44,
            }}
          >
            Download PDF
          </button>
          <button
            onClick={handleCSV}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: '1.5px solid var(--br)',
              background: 'var(--sf)',
              color: 'var(--tx)',
              fontSize: 13,
              fontWeight: 700,
              minHeight: 44,
            }}
          >
            Export CSV
          </button>
        </div>

        {/* Confirmation messages */}
        {pdfMsg && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 10,
              padding: '10px 14px',
              background: 'var(--gl)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--gd)',
            }}
          >
            {pdfMsg}
          </motion.div>
        )}
        {csvMsg && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 10,
              padding: '10px 14px',
              background: 'var(--gl)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--gd)',
            }}
          >
            {csvMsg}
          </motion.div>
        )}
      </div>

      {/* Year filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setActiveYear(y)}
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              border: `1.5px solid ${activeYear === y ? 'var(--green)' : 'var(--br)'}`,
              background: activeYear === y ? 'var(--gl)' : 'var(--sf)',
              color: activeYear === y ? 'var(--gd)' : 'var(--tx2)',
              fontSize: 13,
              fontWeight: 700,
              minHeight: 40,
              transition: 'all 120ms',
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Transaction groups */}
      {Object.entries(groups).map(([month, txs]) => (
        <div key={month} style={{ marginBottom: 16 }}>
          <p className="section-label">{month}</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {txs.map((tx, i) => {
              const charity = CHARITIES.find((c) => c.id === tx.charityId);
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 16px',
                    borderBottom: i < txs.length - 1 ? '1px solid var(--br)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'var(--gl)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {charity?.emoji ?? '💚'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--tx)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {charity?.displayName ?? tx.charityId}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
                      {new Date(tx.donatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {tx.fundingSource ?? 'card'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{ fontSize: 15, fontWeight: 900, color: 'var(--green)' }}
                    >
                      ${(tx.amountCents / 100).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>
                      ✓ Receipt sent
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
