import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SECURE_TOKEN = 'heartly-admin-secure-auth-token-2026';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (token === SECURE_TOKEN) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false });
  } catch (err) {
    console.error('Verify session API error:', err);
    return NextResponse.json({ authenticated: false });
  }
}
