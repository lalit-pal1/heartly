import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  let next = searchParams.get('next') ?? '/dashboard';
  // Open redirect mitigation: ensure redirect url starts with '/' and not '//' or 'http'
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('http://') || next.startsWith('https://')) {
    next = '/dashboard';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to bind referral code if present in cookie
      try {
        const cookieStore = await cookies();
        const refCookie = cookieStore.get('heartly_ref')?.value;
        if (refCookie && user) {
          const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
          await adminSupabase.rpc('record_referral', {
            referred_id: user.id,
            ref_code: refCookie
          });
          // Remove cookie
          cookieStore.delete('heartly_ref');
        }
      } catch (refErr) {
        console.error('Callback referral binding error:', refErr);
      }

      // If logged-in user is admin, redirect to /admin instead of /dashboard
      if (user && user.email === 'pal929956@gmail.com') {
        next = '/admin';
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not exchange auth code for session`);
}
