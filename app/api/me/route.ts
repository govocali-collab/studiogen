import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

function parseTier(priceId: string): 'essentiel' | 'pro' {
  return priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'essentiel';
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profile = profileRaw as any;

  // If profile still shows trialing but has a Stripe customer, sync from Stripe
  if (profile?.subscription_status === 'trialing' && profile?.stripe_customer_id) {
    try {
      const [activeList, trialingList] = await Promise.all([
        stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'active', limit: 1 }),
        stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'trialing', limit: 1 }),
      ]);
      const sub = activeList.data[0] ?? trialingList.data[0];
      if (sub && sub.status === 'active') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const priceId = (sub as any).items?.data[0]?.price?.id ?? '';
        const tier = parseTier(priceId);
        const admin = createAdminClient();
        await admin.from('profiles').update({
          subscription_tier: tier,
          subscription_status: 'active',
          generations_used: 0,
          trial_generations_used: 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', user.id);
        profile = { ...profile, subscription_status: 'active', subscription_tier: tier };
      }
    } catch {
      // Stripe check failed — return profile as-is
    }
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  const is_admin = adminEmails.includes((user.email ?? '').toLowerCase());

  return NextResponse.json({ user: { id: user.id, email: user.email }, profile, is_admin });
}
