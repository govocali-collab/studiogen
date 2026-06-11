import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/calendar/[id] — update scheduled_date
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { scheduled_date } = body;
  if (!scheduled_date) return NextResponse.json({ error: 'scheduled_date requis' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calendar_posts')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ scheduled_date } as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/calendar/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch post to get image_url for storage cleanup
  const { data: post } = await admin
    .from('calendar_posts')
    .select('image_url, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (post?.image_url) {
    const path = post.image_url.split('/post-images/')[1];
    if (path) await supabase.storage.from('post-images').remove([path]);
  }

  const { error } = await admin
    .from('calendar_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
