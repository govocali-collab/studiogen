import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL!));

  const appId = process.env.META_APP_ID;
  if (!appId) return NextResponse.json({ error: 'META_APP_ID non configuré' }, { status: 500 });

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`;
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = Buffer.from(JSON.stringify({ userId: user.id, nonce })).toString('base64url');

  const scope = [
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'instagram_basic',
    'instagram_content_publish',
  ].join(',');

  const oauthUrl =
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code` +
    `&state=${state}`;

  const res = NextResponse.redirect(oauthUrl);
  res.cookies.set('meta_oauth_state', state, {
    httpOnly: true,
    secure: true,
    maxAge: 600, // 10 min
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
