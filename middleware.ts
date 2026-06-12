import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/studio', '/billing', '/admin', '/settings', '/calendrier'];
// Success page validates via Stripe session_id + admin client — no auth needed
const UNPROTECTED = ['/billing/success'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect specific routes
  const isProtected = !UNPROTECTED.includes(pathname)
    && PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Skip auth if Supabase isn't configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect admins away from /studio to /admin
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes((user.email ?? '').toLowerCase());
  if (isAdmin && (pathname === '/studio' || pathname.startsWith('/studio/'))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Canceled or expired-trial users can only access /billing — redirect everything else
  const isBillingRoute = pathname === '/billing' || pathname.startsWith('/billing/');
  if (!isBillingRoute && !isAdmin) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription_status, created_at')
      .eq('id', user.id)
      .single();
    const p = profileData as { subscription_status?: string; created_at?: string } | null;
    const isCanceled = p?.subscription_status === 'canceled';
    const isTrialExpired = p?.subscription_status === 'trialing'
      && !!p.created_at
      && Date.now() - new Date(p.created_at).getTime() > 7 * 24 * 60 * 60 * 1000;
    if (isCanceled || isTrialExpired) {
      return NextResponse.redirect(new URL('/billing', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
