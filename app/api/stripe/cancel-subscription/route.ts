import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profileRaw } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any;
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 });
  }

  const subs = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    limit: 5,
  });

  const active = subs.data.find((s) => s.status === 'active' || s.status === 'trialing');
  if (!active) {
    return NextResponse.json({ error: 'Aucun abonnement actif trouvé' }, { status: 400 });
  }

  await stripe.subscriptions.cancel(active.id);

  await admin.from('profiles').update({
    subscription_status: 'canceled',
    subscription_tier: 'essentiel',
  }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
