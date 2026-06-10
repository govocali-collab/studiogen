import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudioClient from './StudioClient';

export default async function StudioPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/auth/login?redirect=/studio');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes((user.email ?? '').toLowerCase());

  return <StudioClient profile={profile} isAdmin={isAdmin} />;
}
