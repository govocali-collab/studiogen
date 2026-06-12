import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { PRICING } from '@/lib/config/pricing';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single() as any;

    const customerId = profile?.stripe_customer_id;
    if (!customerId) return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 });

    const existingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    const existingSub = existingSubs.data[0];
    if (!existingSub) return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 });

    const priceId = PRICING.essentiel.stripePriceId;
    if (!priceId) return NextResponse.json({ error: 'Prix Essentiel non configuré' }, { status: 500 });

    const item = existingSub.items.data[0];
    if (item.price.id === priceId) return NextResponse.json({ ok: true });

    // Downgrade with immediate proration invoice:
    // - Credits unused Pro days
    // - Charges remaining days at Essentiel rate
    // - Renews at regular Essentiel price next cycle
    await stripe.subscriptions.update(existingSub.id, {
      items: [{ id: item.id, price: priceId }],
      proration_behavior: 'always_invoice',
      metadata: { supabase_user_id: user.id, tier: 'essentiel' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from('profiles').update({ subscription_tier: 'essentiel' } as any).eq('id', user.id);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[downgrade]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
