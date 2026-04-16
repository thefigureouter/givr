import { randomId, delay } from './utils';

const isDev = process.env.NODE_ENV === 'development';
const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

// Platform fee in basis points. Set to 0 for now; flip to e.g. 150 (1.5%) to enable.
const PLATFORM_FEE_BPS = 0;

function getStripe() {
  // Lazy-loaded to avoid importing on client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require('stripe');
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });
}

function platformFee(amountCents: number): number {
  return Math.floor((amountCents * PLATFORM_FEE_BPS) / 10000);
}

// ─── PaymentIntent (one-off / batch charge) ───────────────────────────────────

export async function createPaymentIntent(
  amountCents: number,
  charityId: string,
  opts: { customerId?: string; paymentMethodId?: string; stripeAccountId?: string } = {}
) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const fee = platformFee(amountCents);
    const params: Record<string, unknown> = {
      amount: amountCents,
      currency: 'usd',
      metadata: { charityId },
      automatic_payment_methods: { enabled: true },
    };
    if (opts.customerId) params.customer = opts.customerId;
    if (opts.paymentMethodId) {
      params.payment_method = opts.paymentMethodId;
      params.confirm = true;
      params.automatic_payment_methods = { enabled: true, allow_redirects: 'never' };
    }
    // Destination charge to connected account
    if (opts.stripeAccountId) {
      params.transfer_data = { destination: opts.stripeAccountId };
      if (fee > 0) params.application_fee_amount = fee;
    }
    const intent = await stripe.paymentIntents.create(params);
    return {
      clientSecret: intent.client_secret as string,
      paymentIntentId: intent.id,
      status: intent.status as string,
    };
  }

  if (isDev) console.log('[STRIPE MOCK] createPaymentIntent', { amountCents, charityId, opts });
  await delay(600);
  return {
    clientSecret: 'mock_pi_secret_' + randomId(),
    paymentIntentId: 'pi_mock_' + randomId(),
    status: opts.paymentMethodId ? 'succeeded' : 'requires_payment_method',
  };
}

export async function confirmPayment(paymentIntentId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { status: intent.status as string };
  }

  if (isDev) console.log('[STRIPE MOCK] confirmPayment', { paymentIntentId });
  await delay(800);
  return { status: 'requires_payment_method' };
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }
  return { id: paymentIntentId, status: 'succeeded', amount: 0 };
}

// ─── Customer ────────────────────────────────────────────────────────────────

export async function createCustomer(email: string, name: string, userId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
    return { customerId: customer.id };
  }

  if (isDev) console.log('[STRIPE MOCK] createCustomer', { email, name, userId });
  return { customerId: 'cus_mock_' + randomId() };
}

// ─── SetupIntent (save card) ──────────────────────────────────────────────────

export async function createSetupIntent(customerId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    return {
      clientSecret: setupIntent.client_secret as string,
      setupIntentId: setupIntent.id,
    };
  }

  if (isDev) console.log('[STRIPE MOCK] createSetupIntent', { customerId });
  await delay(400);
  return {
    clientSecret: 'mock_seti_secret_' + randomId(),
    setupIntentId: 'seti_mock_' + randomId(),
  };
}

export async function getDefaultPaymentMethod(customerId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 });
    const pm = paymentMethods.data[0];
    if (!pm) return null;
    return {
      id: pm.id,
      brand: pm.card?.brand ?? 'card',
      last4: pm.card?.last4 ?? '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
    };
  }

  if (isDev) console.log('[STRIPE MOCK] getDefaultPaymentMethod', { customerId });
  return { id: 'pm_mock_' + randomId(), brand: 'visa', last4: '4242', expMonth: 12, expYear: 2028 };
}

// ─── Connect: charity onboarding ─────────────────────────────────────────────

export async function createConnectedAccount(email: string, charityId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: 'standard',
      email,
      metadata: { charityId },
    });
    return { accountId: account.id };
  }

  if (isDev) console.log('[STRIPE MOCK] createConnectedAccount', { email, charityId });
  return { accountId: 'acct_mock_' + randomId() };
}

export async function createAccountLink(accountId: string, baseUrl: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/admin/charity-onboarding?refresh=1`,
      return_url: `${baseUrl}/admin/charity-onboarding?success=1`,
      type: 'account_onboarding',
    });
    return { url: link.url };
  }

  if (isDev) console.log('[STRIPE MOCK] createAccountLink', { accountId, baseUrl });
  return { url: `${baseUrl}/admin/charity-onboarding?mock=1` };
}

export async function getConnectedAccount(accountId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  }

  return { id: accountId, chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true };
}

// ─── Transfer (batch settlement to charity) ───────────────────────────────────

export async function createTransfer(
  amountCents: number,
  stripeAccountId: string,
  settlementId: string
) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: stripeAccountId,
      metadata: { settlementId },
    });
    return { transferId: transfer.id };
  }

  if (isDev) console.log('[STRIPE MOCK] createTransfer', { amountCents, stripeAccountId, settlementId });
  await delay(300);
  return { transferId: 'tr_mock_' + randomId() };
}
