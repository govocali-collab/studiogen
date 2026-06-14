import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

function settingsRedirect(path: string, req: NextRequest) {
  return NextResponse.redirect(new URL(path, req.url));
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return settingsRedirect('/auth/login', request);

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const storedState = request.cookies.get('meta_oauth_state')?.value;

  if (errorParam) {
    return settingsRedirect(`/settings?tab=connexions&meta_error=${encodeURIComponent(errorParam)}`, request);
  }
  if (!code || !stateParam) {
    return settingsRedirect('/settings?tab=connexions&meta_error=missing_params', request);
  }
  // CSRF check
  if (!storedState || storedState !== stateParam) {
    return settingsRedirect('/settings?tab=connexions&meta_error=state_mismatch', request);
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${APP_URL}/api/meta/callback`;

  // 1. Exchange code for short-lived token
  const shortRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_secret=${appSecret}` +
    `&code=${code}`,
  );
  const shortData = await shortRes.json() as { access_token?: string; error?: { message: string } };
  if (!shortData.access_token) {
    const msg = shortData.error?.message ?? 'token_exchange_failed';
    return settingsRedirect(`/settings?tab=connexions&meta_error=${encodeURIComponent(msg)}`, request);
  }

  // 2. Exchange for long-lived user token (~60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${shortData.access_token}`,
  );
  const longData = await longRes.json() as { access_token?: string; expires_in?: number };
  const userToken = longData.access_token ?? shortData.access_token;
  const expiresAt = longData.expires_in
    ? new Date(Date.now() + longData.expires_in * 1000).toISOString()
    : null;

  // 3. Fetch user's Pages + linked Instagram accounts
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts` +
    `?fields=id,name,access_token,instagram_business_account{id,username}` +
    `&access_token=${userToken}`,
  );
  const pagesData = await pagesRes.json() as {
    data?: {
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string; username: string };
    }[];
  };

  const pages = pagesData.data ?? [];

  // Auto-pick first page (user can reconnect to choose a different one later)
  const firstPage = pages[0];

  const admin = createAdminClient();
  await admin.from('meta_connections').upsert({
    user_id: user.id,
    user_access_token: userToken,
    token_expires_at: expiresAt,
    facebook_page_id: firstPage?.id ?? null,
    facebook_page_name: firstPage?.name ?? null,
    facebook_page_access_token: firstPage?.access_token ?? null,
    instagram_business_id: firstPage?.instagram_business_account?.id ?? null,
    instagram_username: firstPage?.instagram_business_account?.username ?? null,
    available_pages: JSON.stringify(pages),
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  const res = settingsRedirect('/settings?tab=connexions&meta_success=1', request);
  res.cookies.delete('meta_oauth_state');
  return res;
}
