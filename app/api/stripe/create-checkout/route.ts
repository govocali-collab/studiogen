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

    const { tier, promotionCodeId, couponId } = await request.json() as { tier: 'essentiel' | 'pro'; promotionCodeId?: string; couponId?: string };
    const priceId = PRICING[tier]?.stripePriceId;
    if (!priceId) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });

    const admin = createAdminClient();
    const { data: profileRaw } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = profileRaw as any;
    let customerId = profile?.stripe_customer_id as string | undefined;

    // Verify the stored customer still exists in current Stripe mode (test vs live)
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = undefined;
        await admin.from('profiles').update({ stripe_customer_id: null } as any).eq('id', user.id);
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await admin.from('profiles').update({ stripe_customer_id: customerId } as any).eq('id', user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // If customer already has an active subscription, upgrade it directly (no new checkout)
    const existingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    const existingSub = existingSubs.data[0];
    if (existingSub) {
      const item = existingSub.items.data[0];
      if (item.price.id === priceId) {
        // Already on this plan
        return NextResponse.json({ url: `${appUrl}/billing` });
      }
      const updateParams: import('stripe').Stripe.SubscriptionUpdateParams = {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: 'always_invoice',
        metadata: { supabase_user_id: user.id, tier },
      };
      if (couponId) updateParams.discounts = [{ coupon: couponId }];
      const updatedSub = await stripe.subscriptions.update(existingSub.id, updateParams);

      // Verify the proration invoice was actually paid before upgrading profile
      const latestInvoiceId = updatedSub.latest_invoice;
      if (latestInvoiceId) {
        const invoiceId = typeof latestInvoiceId === 'string' ? latestInvoiceId : latestInvoiceId.id;
        const invoice = await stripe.invoices.retrieve(invoiceId);
        if (invoice.status !== 'paid') {
          return NextResponse.json({ error: 'Paiement refusé. Veuillez mettre à jour ton mode de paiement via le portail de facturation.' }, { status: 402 });
        }
      }

      // Payment confirmed — upgrade profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await admin.from('profiles').update({ subscription_tier: tier } as any).eq('id', user.id);
      return NextResponse.json({ url: `${appUrl}/billing?activated=1` });
    }

    const sessionParams: import('stripe').Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      client_reference_id: user.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { supabase_user_id: user.id, tier },
      },
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?canceled=1`,
      locale: 'fr',
      allow_promotion_codes: !promotionCodeId,
    };
    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[create-checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
