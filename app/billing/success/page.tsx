import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

// Server component — runs on the server, no auth required.
// Uses the Stripe session_id to activate the subscription directly.
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

        // Get user ID from metadata or client_reference_id
        const userId = sub?.metadata?.supabase_user_id
          ?? session.client_reference_id;

        const priceId = sub?.items?.data[0]?.price?.id ?? '';
        const tier = parseTier(priceId);

        if (userId) {
          const admin = createAdminClient();
          await admin.from('profiles').update({
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_customer_id: customerId ?? undefined,
            generations_used: 0,
            trial_generations_used: 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any).eq('id', userId);
        }
      }
    } catch (e) {
      console.error('[billing/success]', e);
    }
  }

  redirect('/billing?activated=1');
}
