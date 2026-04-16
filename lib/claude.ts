import type { CauseCategory, Charity, Donation } from '@/types';

const isDev = process.env.NODE_ENV === 'development';
const claudeConfigured = !!process.env.ANTHROPIC_API_KEY;

function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk');
  return new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SONNET = 'claude-sonnet-4-6';
const HAIKU = 'claude-haiku-4-5-20251001';

export async function getCharityMatches(userCauses: CauseCategory[], charities: Charity[]) {
  if (claudeConfigured) {
    const client = getClient();
    const list = charities.map((c) => `${c.id}: ${c.displayName} (${c.category})`).join('\n');
    const msg = await client.messages.create({
      model: SONNET,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `User cares about: ${userCauses.join(', ')}.\n\nCharities:\n${list}\n\nReturn up to 5 charity IDs that best match, comma-separated. Only IDs, no explanation.`,
      }],
    });
    const ids = (msg.content[0] as { text: string }).text.split(',').map((s: string) => s.trim());
    return charities.filter((c) => ids.includes(c.id)).slice(0, 5);
  }

  if (isDev) console.log('[CLAUDE MOCK] getCharityMatches', { userCauses });
  return charities.filter((c) => userCauses.includes(c.category as CauseCategory)).slice(0, 5);
}

export async function generateCauseSummary(charity: Charity): Promise<string> {
  if (claudeConfigured) {
    const client = getClient();
    const msg = await client.messages.create({
      model: HAIKU,
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Write a punchy 1-sentence impact statement for ${charity.displayName}: "${charity.missionSummary}". Max 15 words. No quotes.`,
      }],
    });
    return (msg.content[0] as { text: string }).text.trim();
  }

  if (isDev) console.log('[CLAUDE MOCK] generateCauseSummary', charity.displayName);
  return charity.missionSummary ?? '';
}

export async function generateGivingRecap(donations: Donation[]): Promise<string> {
  if (claudeConfigured) {
    const client = getClient();
    const total = donations.reduce((s, d) => s + d.amountCents, 0);
    const causes = new Set(donations.map((d) => d.charityId)).size;
    const msg = await client.messages.create({
      model: SONNET,
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Write a warm, encouraging 2-sentence giving recap. The user donated $${(total / 100).toFixed(0)} across ${causes} causes in ${donations.length} gifts. Be specific and inspiring. No emojis.`,
      }],
    });
    return (msg.content[0] as { text: string }).text.trim();
  }

  const total = donations.reduce((s, d) => s + d.amountCents, 0);
  const causes = new Set(donations.map((d) => d.charityId)).size;
  return `You've given $${(total / 100).toFixed(0)} across ${causes} causes. Amazing impact.`;
}

export async function triageCharityApplication(name: string, website?: string) {
  if (claudeConfigured) {
    const client = getClient();
    const msg = await client.messages.create({
      model: HAIKU,
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Briefly assess this charity application. Name: "${name}"${website ? `, Website: "${website}"` : ''}. Return JSON: {"summary":"<1 sentence>","riskScore":"low"|"medium"|"high"}`,
      }],
    });
    try {
      return JSON.parse((msg.content[0] as { text: string }).text) as { summary: string; riskScore: string };
    } catch {
      return { summary: 'Unable to assess. Manual review recommended.', riskScore: 'medium' };
    }
  }

  if (isDev) console.log('[CLAUDE MOCK] triageCharityApplication', name, website);
  return { summary: 'Appears to be a legitimate nonprofit. Recommend review.', riskScore: 'low' };
}
