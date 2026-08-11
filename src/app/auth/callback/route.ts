import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/dashboard';
  
  // Open redirect mitigation: ensure redirect url starts with '/' and not '//' or 'http'
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('http://') || next.startsWith('https://')) {
    next = '/dashboard';
  }

  if (code) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    // Determine the base domain for final redirection
    let redirectUrl = `${origin}${next}`;
    if (!isLocalEnv && forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    }

    // Initialize redirect response first so we can inject cookies directly onto it
    const response = NextResponse.redirect(redirectUrl);
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Exchange code for active session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('OAuth code exchange failed:', exchangeError);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
    }

    // Auth succeeded! Fetch user to process post-auth database migrations or referral bindings
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Try to bind referral code if present in cookie
      try {
        const refCookie = request.cookies.get('heartly_ref')?.value;
        if (refCookie) {
          const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
          await adminSupabase.rpc('record_referral', {
            referred_id: user.id,
            ref_code: refCookie
          });
          // Remove cookie in the response to clean up browser
          response.cookies.set('heartly_ref', '', { maxAge: 0, path: '/' });
        }
      } catch (refErr) {
        console.error('Callback referral binding error:', refErr);
      }

      // If logged-in user is admin, redirect to admin panel
      if (user.email === 'pal929956@gmail.com') {
        const adminRedirectUrl = isLocalEnv 
          ? `${origin}/admin` 
          : `https://${forwardedHost ?? new URL(origin).host}/admin`;
        response.headers.set('Location', adminRedirectUrl);
      }
    }

    return response;
  }

  return NextResponse.redirect(`${origin}/login?error=No code parameter provided`);
}
