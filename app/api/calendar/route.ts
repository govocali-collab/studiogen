import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requirePro(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('subscription_tier, subscription_status').eq('id', userId).single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = data as any;
  const status = p?.subscription_status ?? 'essentiel';
  const tier = p?.subscription_tier ?? 'essentiel';
  return status === 'trialing' || tier === 'pro';
}

// GET /api/calendar — fetch posts within a date range (default: -90d to +365d)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!await requirePro(user.id)) return NextResponse.json({ error: 'Plan Pro requis' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? ninetyDaysAgo();
  const to   = searchParams.get('to')   ?? oneYearFromNow();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calendar_posts')
    .select('*')
    .eq('user_id', user.id)
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .order('scheduled_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/calendar — create a new calendar entry
// Body: FormData with fields: scheduled_date, platform, content, content_type, image? (file)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!await requirePro(user.id)) return NextResponse.json({ error: 'Plan Pro requis' }, { status: 403 });

  const form = await request.formData();
  const scheduled_date = form.get('scheduled_date') as string;
  const platform       = form.get('platform') as 'fb' | 'ig';
  const content        = form.get('content') as string;
  const content_type   = form.get('content_type') as string;
  const imageFile      = form.get('image') as File | null;

  if (!scheduled_date || !platform || !content || !content_type) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  let image_url: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const ext = 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path);
      image_url = publicUrl;
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calendar_posts')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ user_id: user.id, scheduled_date, platform, content, content_type, image_url } as any)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

function ninetyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

function oneYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
