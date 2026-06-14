import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('app_config')
    .select('value')
    .eq('key', 'founder_spots_remaining')
    .single();
  const spots = data ? parseInt(data.value, 10) : 87;
  return NextResponse.json({ spots: isNaN(spots) ? 87 : spots });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { spots } = await request.json() as { spots: number };
  if (typeof spots !== 'number' || spots < 0 || spots > 100) {
    return NextResponse.json({ error: 'Valeur invalide (0–100)' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('app_config')
    .upsert({ key: 'founder_spots_remaining', value: String(spots) }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ spots });
}
