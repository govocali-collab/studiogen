import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

// Called after successful checkout to ensure the profile is updated even if webhook was delayed
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await admin.from('profiles').select('stripe_customer_id, subscription_status').eq('id', user.id).single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any;

  if (!profile?.stripe_customer_id) return NextResponse.json({ synced: false });

  // Already active — nothing to do
  if (profile.subscription_status === 'active') return NextResponse.json({ synced: false });

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  const sub = subscriptions.data[0];
  if (!sub) return NextResponse.json({ synced: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceId = (sub as any).items?.data[0]?.price?.id ?? '';
  const tier = parseTier(priceId);

  await admin.from('profiles').update({
    subscription_tier: tier,
    subscription_status: 'active',
    generations_used: 0,
    trial_generations_used: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).eq('id', user.id);

  return NextResponse.json({ synced: true, tier });
}
