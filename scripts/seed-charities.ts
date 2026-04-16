/**
 * Seed the Supabase charities table from mock-data.
 * Run once after applying schema.sql:
 *   npx tsx scripts/seed-charities.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { CHARITIES } from '../lib/mock-data';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function seed() {
  const rows = CHARITIES.map((c) => ({
    id: c.id,
    display_name: c.displayName,
    legal_name: c.legalName ?? null,
    category: c.category,
    emoji: c.emoji ?? null,
    mission_summary: c.missionSummary ?? null,
    impact_summary: c.impactSummary ?? null,
    website: c.website ?? null,
    verification_status: c.verificationStatus,
    country: c.country,
    popularity_score: c.popularityScore ?? 0,
    urgency_score: c.urgencyScore ?? 0,
    impact_metric_label: c.impactMetricLabel ?? null,
    impact_per_dollar: c.impactPerDollar ?? null,
  }));

  const { error } = await supabase
    .from('charities')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false });

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Seeded ${rows.length} charities`);
}

seed();
