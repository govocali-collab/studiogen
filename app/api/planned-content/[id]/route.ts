import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/planned-content/[id] — update status or date
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json() as { status?: string; suggested_date?: string };
  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.suggested_date) updates.suggested_date = body.suggested_date;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucune mise à jour' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('planned_content')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing || (existing as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('planned_content').update(updates as any).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/planned-content/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  void request;
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('planned_content')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing || (existing as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  }

  const { error } = await admin.from('planned_content').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
