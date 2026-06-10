import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name, business_name, website, service_description, email, subscription_tier, subscription_status')
    .eq('id', session.user.id)
    .single();

  return NextResponse.json(data ?? {});
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const allowed = ['first_name', 'last_name', 'business_name', 'website', 'service_description'];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await supabase.from('profiles').update(update).eq('id', session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
