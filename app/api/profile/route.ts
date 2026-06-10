import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const SELECT_FIELDS = [
  'first_name', 'last_name', 'business_name', 'website', 'service_description',
  'city', 'province', 'target_audience', 'brand_voice', 'services',
  'favorite_phrases', 'avoid_phrases', 'content_preferences', 'cta_style',
  'email', 'subscription_tier', 'subscription_status',
].join(', ');

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select(SELECT_FIELDS)
    .eq('id', session.user.id)
    .single();

  return NextResponse.json(data ?? {});
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const allowed = [
    'first_name', 'last_name', 'business_name', 'website', 'service_description',
    'city', 'province', 'target_audience', 'brand_voice', 'services',
    'favorite_phrases', 'avoid_phrases', 'content_preferences', 'cta_style',
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update(update).eq('id', session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
