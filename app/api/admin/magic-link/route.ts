import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { email } = await request.json() as { email: string };
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  const admin = createAdminClient();
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = (data as any)?.properties;
  const hashedToken = props?.hashed_token
    ?? new URL(props?.action_link ?? 'http://x').searchParams.get('token');

  if (!hashedToken) return NextResponse.json({ error: 'Token introuvable' }, { status: 500 });

  // Build our own proxy link — session is established server-side, no PKCE needed
  const link = `${origin}/api/auth/magic-verify?token=${encodeURIComponent(hashedToken)}&email=${encodeURIComponent(email)}`;
  return NextResponse.json({ link });
}
