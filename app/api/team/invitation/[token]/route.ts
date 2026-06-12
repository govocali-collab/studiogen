import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/team/invitation/[token] — validate an invitation token (public, no auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: inv } = await admin
    .from('team_invitations')
    .select('id, email, first_name, role, expires_at, accepted_at, workspace_id')
    .eq('token', token)
    .single();

  if (!inv) return NextResponse.json({ error: 'Invitation introuvable ou invalide.' }, { status: 404 });

  const i = inv as {
    id: string; email: string; first_name: string | null; role: string;
    expires_at: string; accepted_at: string | null; workspace_id: string;
  };

  if (i.accepted_at) return NextResponse.json({ error: 'Cette invitation a déjà été utilisée.' }, { status: 410 });
  if (new Date(i.expires_at) < new Date()) return NextResponse.json({ error: 'Cette invitation a expiré.' }, { status: 410 });

  // Get owner info for the welcome page
  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('first_name, last_name, business_name')
    .eq('id', i.workspace_id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const op = ownerProfile as any;

  return NextResponse.json({
    email: i.email,
    firstName: i.first_name,
    role: i.role,
    ownerName: [op?.first_name, op?.last_name].filter(Boolean).join(' ') || 'Le propriétaire',
    workspaceName: (op?.business_name as string | null) ?? 'StudioGen',
  });
}
