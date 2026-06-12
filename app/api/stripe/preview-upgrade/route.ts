import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { PRICING } from '@/lib/config/pricing';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { tier } = await request.json() as { tier: 'essentiel' | 'pro' };
    const priceId = PRICING[tier]?.stripePriceId;
    if (!priceId) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single() as any;

    const customerId = profile?.stripe_customer_id;
    if (!customerId) return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 });

    const existingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    const existingSub = existingSubs.data[0];
    if (!existingSub) return NextResponse.json({ error: 'Aucun abonnement actif à mettre à jour' }, { status: 400 });

    const item = existingSub.items.data[0];
    if (item.price.id === priceId) return NextResponse.json({ alreadyOnPlan: true });

    // Fetch preview invoice to calculate exact proration amount
    const upcoming = await stripe.invoices.createPreview({
      customer: customerId,
      subscription: existingSub.id,
      subscription_details: {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: 'always_invoice',
      },
    });

    const amountDue = upcoming.amount_due; // in cents
    const currency = upcoming.currency;

    return NextResponse.json({ amountDue, currency });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[preview-upgrade]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
