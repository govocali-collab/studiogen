import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

// Called after successful checkout. Uses session_id for precise lookup,
// falls back to listing customer subscriptions.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { session_id } = await request.json().catch(() => ({})) as { session_id?: string };

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await admin.from('profiles').select('stripe_customer_id, subscription_status, subscription_tier').eq('id', user.id).single();
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
      // Also grab customer from session in case profile wasn't updated yet
      if (!customerId && session.customer) {
        customerId = typeof session.customer === 'string' ? session.customer : (session.customer as any).id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await admin.from('profiles').update({ stripe_customer_id: customerId } as any).eq('id', user.id);
      }
    } catch {
      // session lookup failed, will fall back to customer listing
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

  if (!subscriptionId) return NextResponse.json({ synced: false, reason: 'no_subscription' });

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceId = (subscription as any).items?.data[0]?.price?.id ?? '';
  const tier = parseTier(priceId);

  await admin.from('profiles').update({
    subscription_tier: tier,
    subscription_status: 'active',
    stripe_customer_id: customerId,
    generations_used: 0,
    trial_generations_used: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).eq('id', user.id);

  return NextResponse.json({ synced: true, tier });
}
