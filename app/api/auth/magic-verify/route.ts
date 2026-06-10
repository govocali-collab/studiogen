import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const type = (searchParams.get('type') ?? 'magiclink') as
    | 'signup'
    | 'magiclink'
    | 'recovery'
    | 'email'
    | 'email_change';

  if (!token || !email) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid', request.url));
  }

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

  const { error } = await supabase.auth.verifyOtp({ email, token, type });

  if (error) {
    console.error('Magic verify failed — type:', type, '| error:', error.message, '| status:', error.status);
    return NextResponse.redirect(new URL('/auth/login?error=link_invalid', request.url));
  }

  return response;
}
