import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/team/accept — create account and join workspace
export async function POST(request: NextRequest) {
  const { token, password } = await request.json() as { token: string; password: string };

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Token et mot de passe (8 caractères min) requis.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Validate token
  const { data: inv } = await admin
    .from('team_invitations')
    .select('id, email, first_name, role, expires_at, accepted_at, workspace_id, invited_by')
    .eq('token', token)
    .single();

  if (!inv) return NextResponse.json({ error: 'Invitation introuvable ou invalide.' }, { status: 404 });

  const i = inv as {
    id: string; email: string; first_name: string | null; role: string;
    expires_at: string; accepted_at: string | null; workspace_id: string; invited_by: string;
  };

  if (i.accepted_at) return NextResponse.json({ error: 'Cette invitation a déjà été utilisée.' }, { status: 410 });
  if (new Date(i.expires_at) < new Date()) return NextResponse.json({ error: 'Cette invitation a expiré.' }, { status: 410 });

  // Check if account already exists for this email
  const { data: existing } = await admin.from('profiles').select('id').eq('email', i.email).maybeSingle();
  if (existing) return NextResponse.json({ error: 'Un compte existe déjà pour cette adresse courriel.' }, { status: 400 });

  // Create Supabase auth user (email confirmed immediately — invitation already proves ownership)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: i.email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erreur lors de la création du compte.' }, { status: 500 });
  }

  const newUserId = authData.user.id;

  // Create profile for the new collaborator
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await admin.from('profiles').insert({
    id: newUserId,
    email: i.email,
    first_name: i.first_name ?? null,
    workspace_id: i.workspace_id,
    role: 'collaborator',
    subscription_tier: 'pro',    // inherits owner's context; generation limits enforced on owner
    subscription_status: 'active',
  } as any);

  // Create workspace_users record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await admin.from('workspace_users').insert({
    workspace_id: i.workspace_id,
    user_id: newUserId,
    role: 'collaborator',
    invited_by: i.invited_by,
    invited_at: new Date().toISOString(),
  } as any);

  // Mark invitation as accepted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await admin.from('team_invitations').update({ accepted_at: new Date().toISOString() } as any).eq('id', i.id);

  return NextResponse.json({ ok: true, email: i.email });
}
