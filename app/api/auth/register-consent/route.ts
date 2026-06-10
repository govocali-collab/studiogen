import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { email: string; first_name?: string; last_name?: string; phone?: string; email_consent: boolean; sms_consent: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { email, first_name, last_name, phone, email_consent, sms_consent } = body;
  if (!email) return NextResponse.json({ error: 'Courriel requis' }, { status: 400 });

  const admin = createAdminClient();

  const { data: user, error: lookupError } = await admin.auth.admin.getUserByEmail(email);
  if (lookupError || !user?.user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  const update: Record<string, unknown> = {
    email_consent: !!email_consent,
    sms_consent: !!sms_consent,
    consent_at: new Date().toISOString(),
  };
  if (first_name?.trim()) update.first_name = first_name.trim();
  if (last_name?.trim()) update.last_name = last_name.trim();
  if (phone?.trim()) update.phone = phone.trim();

  const { error } = await admin
    .from('profiles')
    .update(update)
    .eq('id', user.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
