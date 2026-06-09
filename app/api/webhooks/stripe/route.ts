import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { sendSubscriptionConfirmation, sendPaymentFailedWarning, sendTrialEndingReminder } from '@/lib/emails';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

async function getProfileByCustomer(customerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as { id: string; email: string } | null;
}

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

function subStatus(s: string): 'active' | 'past_due' | 'canceled' {
  if (s === 'past_due') return 'past_due';
  if (s === 'active' || s === 'trialing') return 'active';
  return 'canceled';
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {

      // ── Checkout completed → activate subscription ────────────────────────
      case 'checkout.session.completed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;
        if (session.mode !== 'subscription') break;

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        if (!customerId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const priceId = (subscription as any).items?.data[0]?.price?.id ?? '';
        const tier = parseTier(priceId);

        // Look up by supabase_user_id from metadata (works even if stripe_customer_id wasn't saved yet)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (subscription as any).metadata?.supabase_user_id ?? session.client_reference_id;

        let profileId: string | null = null;
        let profileEmail: string | null = null;

        if (userId) {
          const { data } = await admin.from('profiles').select('id, email').eq('id', userId).single();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          profileId = (data as any)?.id ?? null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          profileEmail = (data as any)?.email ?? null;
        } else {
          const found = await getProfileByCustomer(customerId);
          profileId = found?.id ?? null;
          profileEmail = found?.email ?? null;
        }

        if (!profileId) break;

        await admin.from('profiles').update({
          stripe_customer_id: customerId,
          subscription_tier: tier,
          subscription_status: 'active',
          generations_used: 0,
          trial_generations_used: 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', profileId);

        if (profileEmail) await sendSubscriptionConfirmation(profileEmail, tier);
        break;
      }

      // ── Invoice paid → reset generation counter ──────────────────────────
      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const profile = await getProfileByCustomer(customerId);
        if (!profile) break;

        await admin.from('profiles').update({
          subscription_status: 'active',
          billing_period_start: invoice.period_start
            ? new Date(invoice.period_start * 1000).toISOString() : null,
          billing_period_end: invoice.period_end
            ? new Date(invoice.period_end * 1000).toISOString() : null,
          generations_used: 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', profile.id);
        break;
      }

      // ── Invoice failed → flag account ─────────────────────────────────────
      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const profile = await getProfileByCustomer(customerId);
        if (!profile) break;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await admin.from('profiles').update({ subscription_status: 'past_due' } as any).eq('id', profile.id);
        if (profile.email) await sendPaymentFailedWarning(profile.email);
        break;
      }

      // ── Subscription updated (upgrade / downgrade) ────────────────────────
      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        const profile = await getProfileByCustomer(customerId);
        if (!profile) break;

        const priceId = sub.items?.data[0]?.price?.id ?? '';
        const tier = parseTier(priceId);

        await admin.from('profiles').update({
          subscription_tier: tier,
          subscription_status: subStatus(sub.status),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', profile.id);
        break;
      }

      // ── Trial ending soon → send reminder email ───────────────────────────
      case 'customer.subscription.trial_will_end': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        const profile = await getProfileByCustomer(customerId);
        if (!profile) break;
        if (profile.email) await sendTrialEndingReminder(profile.email);
        break;
      }

      // ── Subscription canceled → downgrade ────────────────────────────────
      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        const profile = await getProfileByCustomer(customerId);
        if (!profile) break;

        await admin.from('profiles').update({
          subscription_tier: 'essentiel',
          subscription_status: 'canceled',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', profile.id);
        break;
      }
    }
  } catch (err) {
    console.error('[stripe webhook]', event.type, err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
