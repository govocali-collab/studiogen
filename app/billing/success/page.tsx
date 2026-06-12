import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription'],
      });

      if (session.payment_status === 'paid' || session.status === 'complete') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = session.subscription as any;
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : (session.customer as any)?.id;

        const userId = sub?.metadata?.supabase_user_id ?? session.client_reference_id;
        const priceId = sub?.items?.data[0]?.price?.id ?? '';
        const tier = parseTier(priceId);

        if (userId) {
          const admin = createAdminClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin.from('profiles') as any).upsert({
            id: userId,
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_customer_id: customerId ?? undefined,
            generations_used: 0,
            trial_generations_used: 0,
          }, { onConflict: 'id' });
        }
      }
    } catch (e) {
      console.error('[billing/success]', e);
    }
  }

  redirect('/billing?activated=1');
}
