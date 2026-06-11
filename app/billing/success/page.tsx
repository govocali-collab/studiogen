import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let activated = false;
  let tier: 'essentiel' | 'pro' = 'essentiel';

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
        tier = parseTier(priceId);

        if (userId) {
          const admin = createAdminClient();
          const { error } = await admin.from('profiles').update({
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_customer_id: customerId ?? undefined,
            generations_used: 0,
            trial_generations_used: 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any).eq('id', userId);
          if (!error) activated = true;
        }
      }
    } catch (e) {
      console.error('[billing/success]', e);
    }
  }

  const planName = tier === 'pro' ? 'Pro' : 'Essentiel';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activated ? 'Paiement confirmé !' : 'Traitement en cours…'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {activated
              ? `Votre abonnement ${planName} est maintenant actif.`
              : 'Votre paiement est en cours de traitement.'}
          </p>
        </div>

        {activated && (
          <div className="bg-violet-50 rounded-2xl p-4 text-sm text-violet-700 font-medium">
            Retournez dans l&apos;application StudioGen pour accéder à votre plan.
          </div>
        )}

        <Link
          href="/billing"
          className="block w-full py-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          Aller à mon abonnement →
        </Link>
      </div>
    </div>
  );
}
