import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import CalendrierClient from './CalendrierClient';

export const metadata = { title: 'Calendrier — StudioGen' };

export default async function CalendrierPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect('/auth/login?redirect=/calendrier');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', session.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any;
  const tier = p?.subscription_tier ?? 'essentiel';
  const status = p?.subscription_status ?? 'trialing';
  const effectiveTier = status === 'trialing' ? 'pro' : tier;

  return <CalendrierClient isPro={effectiveTier === 'pro'} />;
}
