import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimiter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimitKey = `read_${slug}_${ip}`;
    
    // Limit to 60 page loads per minute per IP per surprise slug
    const { success } = await rateLimit(rateLimitKey, 60, 60);
    
    return NextResponse.json({ allowed: success });
  } catch (err: any) {
    console.error("Rate limit check error:", err);
    // Fail open to ensure dynamic pages load for real users even if database-backed rate-limiting fails
    return NextResponse.json({ allowed: true });
  }
}
