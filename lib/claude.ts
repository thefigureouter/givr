import type { CauseCategory, Charity, Donation } from '@/types';

// TODO: [CLAUDE API] Uncomment when ANTHROPIC_API_KEY is set:
// import Anthropic from '@anthropic-ai/sdk';
// const client = new Anthropic();
// Sonnet model: claude-sonnet-4-6
// Haiku model: claude-haiku-4-5-20251001

export async function getCharityMatches(userCauses: CauseCategory[], charities: Charity[]) {
  // TODO: [CLAUDE API] Replace with claude-sonnet-4-6 call for personalized matching
  console.log('[CLAUDE MOCK] getCharityMatches', { userCauses });
  return charities.filter((c) => userCauses.includes(c.category as CauseCategory)).slice(0, 5);
}

export async function generateCauseSummary(charity: Charity): Promise<string> {
  // TODO: [CLAUDE API] Replace with claude-haiku-4-5-20251001 call
  console.log('[CLAUDE MOCK] generateCauseSummary', charity.displayName);
  return charity.missionSummary ?? '';
}

export async function generateGivingRecap(donations: Donation[]): Promise<string> {
  // TODO: [CLAUDE API] Replace with claude-sonnet-4-6 call for personalized recap
  const total = donations.reduce((sum, d) => sum + d.amountCents, 0);
  const causes = new Set(donations.map((d) => d.charityId)).size;
  return `You've given $${(total / 100).toFixed(0)} across ${causes} causes. Amazing impact.`;
}

export async function triageCharityApplication(name: string, website?: string) {
  // TODO: [CLAUDE API] Replace with claude-haiku-4-5-20251001 call
  console.log('[CLAUDE MOCK] triageCharityApplication', name, website);
  return { summary: 'Appears to be a legitimate nonprofit. Recommend review.', riskScore: 'low' };
}
