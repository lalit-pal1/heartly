import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_EMAIL = 'pal929956@gmail.com';
const HASHED_PASSWORDS = [
  'e40c7bc250b4c059d36d7f670a2ee581f28a7923b3f6477ad223d9bbdd4286e4', // (262007k)
  '966d62cf37e0908909199056f5d78bbcdf2d0a10803aa980aec311be84cf49db'  // 262007k
];

const SECURE_TOKEN = 'heartly-admin-secure-auth-token-2026';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (!HASHED_PASSWORDS.includes(hash)) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Set secure HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', SECURE_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return response;
  } catch (err: any) {
    console.error('Admin login API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
