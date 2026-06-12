import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';

// PATCH /api/calendar/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { workspaceId } = await getWorkspaceContext(user.id);
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
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/calendar/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { workspaceId } = await getWorkspaceContext(user.id);
  const { id } = await params;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from('calendar_posts')
    .select('image_url')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (post?.image_url) {
    const path = (post as { image_url: string }).image_url.split('/post-images/')[1];
    if (path) await supabase.storage.from('post-images').remove([path]);
  }

  const { error } = await admin
    .from('calendar_posts')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
