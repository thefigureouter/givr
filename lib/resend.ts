import type { Donation, Charity } from '@/types';
import { randomId } from './utils';

const isDev = process.env.NODE_ENV === 'development';
const resendConfigured = !!process.env.RESEND_API_KEY;

function getResend() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'TapGive <onboarding@resend.dev>';

export async function sendDonationReceipt(email: string, donation: Donation, charity: Charity) {
  if (resendConfigured) {
    const resend = getResend();
    const dollars = (donation.amountCents / 100).toFixed(2);
    const date = new Date(donation.donatedAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your $${dollars} donation to ${charity.displayName} 💚`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1C1C1E">
          <div style="font-size:32px;margin-bottom:8px">💚</div>
          <h1 style="font-size:24px;font-weight:900;margin:0 0 4px">Thank you!</h1>
          <p style="color:#6B6B72;margin:0 0 24px">Your donation receipt from TapGive</p>

          <div style="background:#F7F5F0;border-radius:16px;padding:20px;margin-bottom:24px">
            <div style="font-size:36px;font-weight:900;color:#18B85A">$${dollars}</div>
            <div style="font-size:16px;font-weight:600;color:#1C1C1E;margin-top:4px">donated to ${charity.displayName} ${charity.emoji ?? ''}</div>
            <div style="font-size:13px;color:#6B6B72;margin-top:8px">${date} · ${charity.legalName ?? charity.displayName}</div>
          </div>

          ${charity.impactSummary ? `<p style="background:#E6F9EE;border-radius:12px;padding:14px;font-size:14px;font-weight:700;color:#0F8A40">🌟 ${charity.impactSummary}</p>` : ''}

          <p style="font-size:13px;color:#ADADB8;margin-top:24px">
            ${charity.legalName ?? charity.displayName} is a verified 501(c)(3) nonprofit.
            This donation may be tax-deductible. Keep this email as your receipt.
          </p>

          <hr style="border:none;border-top:1px solid #E8E4DA;margin:24px 0">
          <p style="font-size:12px;color:#ADADB8">Sent by TapGive · Give in 10 seconds.</p>
        </div>
      `,
    });
    return { id: 'email_' + randomId() };
  }

  if (isDev) console.log('[RESEND MOCK] sendDonationReceipt', { email, amount: donation.amountCents, charity: charity.displayName });
  return { id: 'mock_email_' + randomId() };
}

export async function sendYearlySummary(email: string, year: number, donations: Donation[]) {
  if (resendConfigured) {
    const resend = getResend();
    const total = donations.reduce((s, d) => s + d.amountCents, 0);
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your ${year} TapGive tax summary 📄`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1C1C1E">
          <div style="font-size:32px;margin-bottom:8px">📄</div>
          <h1 style="font-size:24px;font-weight:900;margin:0 0 4px">${year} Tax Summary</h1>
          <p style="color:#6B6B72">${donations.length} donations · $${(total / 100).toFixed(2)} total</p>
          <p style="font-size:13px;color:#ADADB8;margin-top:24px">All organizations are verified 501(c)(3) nonprofits. Consult a tax advisor for deduction eligibility.</p>
        </div>
      `,
    });
    return { id: 'email_' + randomId() };
  }

  if (isDev) console.log('[RESEND MOCK] sendYearlySummary', { email, year, count: donations.length });
  return { id: 'mock_email_' + randomId() };
}
