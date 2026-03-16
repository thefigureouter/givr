import type { Donation, Charity } from '@/types';
import { randomId } from './utils';

// TODO: [RESEND] Uncomment when RESEND_API_KEY is set:
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDonationReceipt(email: string, donation: Donation, charity: Charity) {
  // TODO: [RESEND] Replace with real email via Resend
  console.log('[RESEND MOCK] sendDonationReceipt', {
    email,
    amount: donation.amountCents,
    charity: charity.displayName,
  });
  return { id: 'mock_email_' + randomId() };
}

export async function sendYearlySummary(email: string, year: number, donations: Donation[]) {
  // TODO: [RESEND] Replace with real yearly summary email
  console.log('[RESEND MOCK] sendYearlySummary', { email, year, count: donations.length });
  return { id: 'mock_email_' + randomId() };
}
