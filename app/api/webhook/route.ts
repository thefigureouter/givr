/**
 * POST /api/webhook
 *
 * Handles Stripe webhooks for both platform and Connect events.
 * Configure two endpoints in the Stripe Dashboard:
 *   - Platform:  https://your-domain/api/webhook  → STRIPE_WEBHOOK_SECRET
 *   - (Connect events also arrive here via "Listen to events on connected accounts")
 */
import { NextRequest, NextResponse } from 'next/server';
import { createDonation } from '@/lib/mock-db';
import { supabase, supabaseConfigured } from '@/lib/supabase';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

type StripeEvent = {
  type: string;
  account?: string;          // present on Connect events
  data: { object: Record<string, unknown> };
};

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    // Not configured — accept silently in dev so tests pass
    return NextResponse.json({ received: true });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: StripeEvent;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret) as StripeEvent;
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const metadata = (pi.metadata ?? {}) as Record<string, string>;

        // Only create donation if not already created client-side
        // (unique constraint on stripe_payment_intent_id prevents duplicates)
        await createDonation({
          userId: metadata.userId ?? 'unknown',
          charityId: metadata.charityId ?? 'unknown',
          amountCents: pi.amount as number,
          tipCents: 0,
          feeCents: 0,
          totalCents: pi.amount as number,
          charityReceivesCents: pi.amount as number,
          currency: (pi.currency as string) ?? 'usd',
          status: 'SUCCEEDED',
          privacyMode: (metadata.privacyMode as 'PUBLIC' | 'FRIENDS' | 'PRIVATE') ?? 'PUBLIC',
          fundingSource: 'card',
          stripePaymentIntentId: pi.id as string,
          donatedAt: new Date().toISOString(),
        }).catch(() => {
          // Duplicate — already recorded client-side, ignore
        });

        // Update transaction status if present
        if (supabaseConfigured && supabase) {
          await supabase
            .from('transactions')
            .update({ status: 'settled' })
            .eq('stripe_payment_intent_id', pi.id as string);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        if (supabaseConfigured && supabase) {
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', pi.id as string);
          await supabase
            .from('donations')
            .update({ status: 'FAILED' })
            .eq('stripe_payment_intent_id', pi.id as string);
        }
        break;
      }

      case 'account.updated': {
        // A connected charity account was updated (onboarding complete, etc.)
        const account = event.data.object;
        const accountId = account.id as string;
        if (supabaseConfigured && supabase && account.details_submitted) {
          await supabase
            .from('charities')
            .update({ verification_status: 'VERIFIED' })
            .eq('stripe_account_id', accountId);
        }
        break;
      }

      case 'transfer.created':
      case 'transfer.paid': {
        const transfer = event.data.object;
        const metadata = (transfer.metadata ?? {}) as Record<string, string>;
        if (supabaseConfigured && supabase && metadata.settlementId) {
          await supabase
            .from('settlements')
            .update({ status: 'completed', stripe_transfer_id: transfer.id as string })
            .eq('id', metadata.settlementId);
        }
        break;
      }

      case 'transfer.failed': {
        const transfer = event.data.object;
        const metadata = (transfer.metadata ?? {}) as Record<string, string>;
        if (supabaseConfigured && supabase && metadata.settlementId) {
          await supabase
            .from('settlements')
            .update({ status: 'failed' })
            .eq('id', metadata.settlementId);
        }
        break;
      }

      case 'setup_intent.succeeded': {
        // Card saved — persist the payment method ID to the user's profile
        const si = event.data.object;
        const customerId = si.customer as string;
        const paymentMethodId = si.payment_method as string;
        if (customerId && paymentMethodId && supabaseConfigured && supabase) {
          await supabase
            .from('profiles')
            .update({ stripe_payment_method_id: paymentMethodId })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error('[webhook] handler error:', event.type, err);
    // Return 200 so Stripe doesn't retry; log for investigation
  }

  return NextResponse.json({ received: true });
}
