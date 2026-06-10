import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/studio';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
  }

  // Exchange the code server-side using the Supabase token endpoint directly.
  // Admin-generated magic link codes do not require a PKCE verifier.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
    },
    body: JSON.stringify({ auth_code: code, code_verifier: '' }),
  });

  if (!tokenRes.ok) {
    console.error('Token exchange failed:', await tokenRes.text());
    return NextResponse.redirect(new URL('/auth/login?error=link_invalid', request.url));
  }

  const { access_token, refresh_token } = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
  };

  const response = NextResponse.redirect(new URL(next, request.url));

  const maxAge = 60 * 60 * 24 * 365;
  const cookieOpts = { path: '/', maxAge, sameSite: 'lax' as const, httpOnly: true, secure: process.env.NODE_ENV === 'production' };

  response.cookies.set('sb-access-token', access_token, cookieOpts);
  response.cookies.set('sb-refresh-token', refresh_token, cookieOpts);

  // Also set the Supabase SSR cookies via the standard client
  const { createServerClient } = await import('@supabase/ssr');
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.setSession({ access_token, refresh_token });

  return response;
}
