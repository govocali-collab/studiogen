import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import { sendTeamInvitation } from '@/lib/emails';
import { NextRequest, NextResponse } from 'next/server';

const MAX_SEATS = 3; // Pro: 3 users total (owner + 2 collaborators)

// GET /api/team — list members + pending invitations
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { workspaceId, isOwner } = await getWorkspaceContext(user.id);
  if (!isOwner) return NextResponse.json({ error: 'Accès réservé au propriétaire' }, { status: 403 });

  const admin = createAdminClient();

  const [membersResult, pendingResult] = await Promise.all([
    admin
      .from('workspace_users')
      .select('id, user_id, role, accepted_at, invited_at, profiles!workspace_users_user_id_fkey(first_name, last_name, email)')
      .eq('workspace_id', workspaceId),
    admin
      .from('team_invitations')
      .select('id, email, first_name, role, created_at, expires_at')
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString()),
  ]);

  return NextResponse.json({
    members: membersResult.data ?? [],
    pending: pendingResult.data ?? [],
    seats: { used: (membersResult.data?.length ?? 0) + 1, total: MAX_SEATS }, // +1 for owner
  });
}

// POST /api/team/invite — send invitation
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { workspaceId, isOwner } = await getWorkspaceContext(user.id);
  if (!isOwner) return NextResponse.json({ error: 'Accès réservé au propriétaire' }, { status: 403 });

  const admin = createAdminClient();

  // Check Pro plan
  const { data: ownerProfile } = await admin.from('profiles').select('subscription_tier, subscription_status, first_name, business_name').eq('id', workspaceId).single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const op = ownerProfile as any;
  const isPro = op?.subscription_tier === 'pro' || op?.subscription_status === 'trialing';
  if (!isPro) return NextResponse.json({ error: 'La collaboration d\'équipe est une fonctionnalité Pro.' }, { status: 403 });

  // Check seat count
  const { count: memberCount } = await admin.from('workspace_users').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
  const { count: pendingCount } = await admin.from('team_invitations').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).is('accepted_at', null).gt('expires_at', new Date().toISOString());
  const totalUsed = 1 + (memberCount ?? 0) + (pendingCount ?? 0); // owner + members + pending
  if (totalUsed >= MAX_SEATS) {
    return NextResponse.json({ error: `Limite de ${MAX_SEATS} utilisateurs atteinte pour le plan Pro.` }, { status: 400 });
  }

  const body = await request.json() as { email: string; firstName?: string };
  const email = body.email?.trim().toLowerCase();
  const firstName = body.firstName?.trim() || null;

  if (!firstName) {
    return NextResponse.json({ error: 'Le prénom est requis.' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse courriel invalide.' }, { status: 400 });
  }

  // Check for duplicate
  const { data: existingUser } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existingUser) {
    const { data: alreadyMember } = await admin.from('workspace_users').select('id').eq('workspace_id', workspaceId).eq('user_id', (existingUser as { id: string }).id).maybeSingle();
    if (alreadyMember) return NextResponse.json({ error: 'Cet utilisateur est déjà membre de l\'équipe.' }, { status: 400 });
  }

  // Create invitation
  const { data: invitation, error: invError } = await admin
    .from('team_invitations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ workspace_id: workspaceId, invited_by: user.id, email, first_name: firstName, role: 'collaborator' } as any)
    .select('token')
    .single();

  if (invError || !invitation) return NextResponse.json({ error: 'Erreur lors de la création de l\'invitation.' }, { status: 500 });

  const token = (invitation as { token: string }).token;
  const ownerName = (op?.first_name as string | null) ?? 'Le propriétaire';
  const workspaceName = (op?.business_name as string | null) ?? 'StudioGen';

  // Fire-and-forget — invite exists in DB even if email fails
  sendTeamInvitation({ toEmail: email, toFirstName: firstName ?? undefined, ownerName, workspaceName, token }).catch(console.error);

  return NextResponse.json({ ok: true }, { status: 201 });
}
