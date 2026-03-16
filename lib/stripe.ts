import { randomId, delay } from './utils';

// TODO: [STRIPE] Uncomment real implementation when keys added:
// import Stripe from 'stripe';
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPaymentIntent(amountCents: number, charityId: string) {
  // TODO: [STRIPE] Replace mock with real Stripe PaymentIntent creation
  console.log('[STRIPE MOCK] createPaymentIntent', { amountCents, charityId });
  await delay(600);
  return {
    clientSecret: 'mock_pi_secret_' + randomId(),
    paymentIntentId: 'pi_mock_' + randomId(),
  };
}

export async function confirmPayment(paymentIntentId: string) {
  // TODO: [STRIPE] Replace with Stripe webhook confirmation
  console.log('[STRIPE MOCK] confirmPayment', { paymentIntentId });
  await delay(800);
  return { status: 'succeeded' as const };
}
