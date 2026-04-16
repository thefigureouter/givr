import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  // ── Did migration_001 apply? Check for new columns ───────────────────────
  console.log('\n=== Migration columns present? ===');
  for (const col of ['stripe_customer_id', 'giving_mode', 'onboarding_complete']) {
    const { error } = await admin.from('profiles').select(col).limit(0);
    console.log(`  profiles.${col}:`, error ? `MISSING — ${error.message}` : 'EXISTS');
  }

  // ── Did migration_002 apply? Check for transactions table ────────────────
  const { error: txErr } = await admin.from('transactions').select('id').limit(0);
  console.log(`  transactions table:`, txErr ? `MISSING — ${txErr.message}` : 'EXISTS');
}

run().catch(console.error);
