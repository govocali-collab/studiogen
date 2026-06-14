import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

interface ScheduleBody {
  caption: string;
  imageUrl: string;
  platforms: ('facebook' | 'instagram')[];
  scheduledFor: string; // ISO datetime string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json() as ScheduleBody;
  const { caption, imageUrl, platforms, scheduledFor } = body;

  if (!caption || !platforms?.length || !scheduledFor) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  if (new Date(scheduledFor) <= new Date()) {
    return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify the user has a Meta connection
  const { data: conn } = await admin
    .from('meta_connections')
    .select('facebook_page_id, instagram_business_id')
    .eq('user_id', user.id)
    .single();

  if (!conn) {
    return NextResponse.json({ error: 'Aucun compte Meta connecté. Va dans Paramètres → Connexions.' }, { status: 400 });
  }

  const { error } = await admin.from('scheduled_posts').insert({
    user_id: user.id,
    caption,
    image_url: imageUrl || null,
    platforms,
    scheduled_for: scheduledFor,
    status: 'pending',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, scheduledFor });
}
