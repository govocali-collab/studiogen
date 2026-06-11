import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

// GET — diagnostic only, no writes
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profileRaw, error: profileErr } = await admin
    .from('profiles')
    .select('stripe_customer_id, subscription_status, subscription_tier')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any;
  const customerId = profile?.stripe_customer_id ?? null;

  let stripeCustomer = null;
  let subscriptions: unknown[] = [];

  if (customerId) {
    try {
      stripeCustomer = await stripe.customers.retrieve(customerId);
    } catch (e) {
      stripeCustomer = { error: String(e) };
    }
    try {
      const all = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
      subscriptions = all.data.map(s => ({
        id: s.id,
        status: s.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        price: (s as any).items?.data[0]?.price?.id,
      }));
    } catch (e) {
      subscriptions = [{ error: String(e) }];
    }
  }

  return NextResponse.json({
    user_id: user.id,
    profile_error: profileErr?.message ?? null,
    profile: {
      stripe_customer_id: customerId,
      subscription_status: profile?.subscription_status,
      subscription_tier: profile?.subscription_tier,
    },
    stripe_customer: stripeCustomer ? 'found' : 'not_found',
    stripe_subscriptions: subscriptions,
    env: {
      STRIPE_PRICE_ESSENTIEL: process.env.STRIPE_PRICE_ESSENTIEL ?? '(not set)',
      STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO ?? '(not set)',
      STRIPE_SECRET_KEY_PREFIX: (process.env.STRIPE_SECRET_KEY ?? '').slice(0, 8) + '...',
    },
  });
}

// POST — called after successful checkout
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { session_id } = await request.json().catch(() => ({})) as { session_id?: string };

  const admin = createAdminClient();
  const { data: profileRaw } = await admin
    .from('profiles')
    .select('stripe_customer_id, subscription_status, subscription_tier')
    .eq('id', user.id)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any;

  let subscriptionId: string | null = null;
  let customerId: string | null = profile?.stripe_customer_id ?? null;

  // Primary: retrieve subscription via checkout session ID
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription'],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = session.subscription as any;
      if (sub?.id) subscriptionId = sub.id;
      if (session.customer) {
        const sid = typeof session.customer === 'string' ? session.customer : (session.customer as any).id;
        if (sid && sid !== customerId) {
          customerId = sid;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await admin.from('profiles').update({ stripe_customer_id: customerId } as any).eq('id', user.id);
        }
      }
    } catch (e) {
      console.error('[sync] session retrieve failed:', e);
    }
  }

  // Fallback: list all non-canceled subscriptions for the customer
  if (!subscriptionId && customerId) {
    const [activeList, trialingList] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 5 }),
      stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 5 }),
    ]);
    const sub = activeList.data[0] ?? trialingList.data[0];
    if (sub) subscriptionId = sub.id;
  }

  if (!subscriptionId) {
    console.error('[sync] no subscription found. customer:', customerId, 'session_id:', session_id);
    return NextResponse.json({ synced: false, reason: 'no_subscription', customer: customerId });
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceId = (subscription as any).items?.data[0]?.price?.id ?? '';
  const tier = parseTier(priceId);

  const { error: updateErr } = await admin.from('profiles').update({
    subscription_tier: tier,
    subscription_status: 'active',
    stripe_customer_id: customerId,
    generations_used: 0,
    trial_generations_used: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).eq('id', user.id);

  if (updateErr) {
    console.error('[sync] DB update failed:', updateErr);
    return NextResponse.json({ synced: false, reason: 'db_error', error: updateErr.message });
  }

  return NextResponse.json({ synced: true, tier });
}
