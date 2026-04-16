import { randomId, delay } from './utils';

const isDev = process.env.NODE_ENV === 'development';
const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

function getStripe() {
  // Lazy-loaded to avoid importing on client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require('stripe');
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });
}

export async function createPaymentIntent(amountCents: number, charityId: string) {
  if (stripeConfigured) {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { charityId },
      automatic_payment_methods: { enabled: true },
    });
    return {
      clientSecret: intent.client_secret as string,
      paymentIntentId: intent.id,
    };
  }

  if (isDev) console.log('[STRIPE MOCK] createPaymentIntent', { amountCents, charityId });
  await delay(600);
  return {
    clientSecret: 'mock_pi_secret_' + randomId(),
    paymentIntentId: 'pi_mock_' + randomId(),
  };
}

export async function confirmPayment(paymentIntentId: string) {
  if (stripeConfigured) {
    // Real confirmation happens client-side via Stripe.js
    // Server-side we just verify the intent status
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
