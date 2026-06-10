import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid', request.url));
  }

  // Call Supabase verify endpoint directly — returns tokens as JSON, no PKCE needed
  const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ token, type: 'magiclink', email }),
  });

  if (!verifyRes.ok) {
    console.error('Magic verify failed:', await verifyRes.text());
    return NextResponse.redirect(new URL('/auth/login?error=link_invalid', request.url));
  }

  const { access_token, refresh_token } = await verifyRes.json() as {
    access_token: string;
    refresh_token: string;
  };

  const response = NextResponse.redirect(new URL('/studio', request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.setSession({ access_token, refresh_token });

  return response;
}
