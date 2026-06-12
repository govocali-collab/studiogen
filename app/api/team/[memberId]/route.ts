import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/team/[memberId] — remove a member from the workspace
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { workspaceId, isOwner } = await getWorkspaceContext(user.id);
  if (!isOwner) return NextResponse.json({ error: 'Accès réservé au propriétaire' }, { status: 403 });

  const admin = createAdminClient();

  // Find the workspace_users record
  const { data: member } = await admin
    .from('workspace_users')
    .select('user_id')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!member) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 });

  const removedUserId = (member as { user_id: string }).user_id;

  // Remove from workspace_users
  await admin.from('workspace_users').delete().eq('id', memberId);

  // Restore the removed user as an independent owner of their own workspace
  await admin.from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ workspace_id: removedUserId, role: 'owner' } as any)
    .eq('id', removedUserId);

  return NextResponse.json({ ok: true });
}
