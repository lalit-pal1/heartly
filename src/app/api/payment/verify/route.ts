import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rateLimiter';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      surpriseId,
      planName
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !surpriseId || !planName) {
      return NextResponse.json({ error: 'Missing payment verification parameters' }, { status: 400 });
    }

    // Rate limiting (10 verification attempts per minute per user/IP)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimitKey = `verify_${user.id}_${ip}`;
    const { success } = await rateLimit(rateLimitKey, 10, 60);
    if (!success) {
      return NextResponse.json({ error: 'Too many verification attempts 💔 Please wait a moment.' }, { status: 429 });
    }

    const isSandbox = razorpay_order_id.startsWith('order_sandbox_');

    // Admin client fallback to user client if key is missing during development
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    // Fetch original order and surprise configurations
    const { data: orderRecord, error: orderFetchError } = await adminSupabase
      .from('orders')
      .select('razorpay_order_id, payment_status, user_id')
      .eq('surprise_id', surpriseId)
      .maybeSingle();

    if (orderFetchError || !orderRecord) {
      return NextResponse.json({ error: 'Order details not found' }, { status: 404 });
    }

    if (orderRecord.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to this order' }, { status: 403 });
    }

    if (orderRecord.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Invalid checkout order ID' }, { status: 400 });
    }

    if (orderRecord.payment_status === 'captured') {
      return NextResponse.json({ error: 'Payment has already been processed' }, { status: 400 });
    }

    if (!isSandbox) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
      if (!keySecret) {
        return NextResponse.json({ error: 'Razorpay secret key configuration missing' }, { status: 500 });
      }

      // Compute Hmac SHA256 signature
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpay_signature) {
        // Mark database order status as failed
        await adminSupabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('surprise_id', surpriseId);
        
        return NextResponse.json({ error: 'Payment verification failed: Signature mismatch' }, { status: 400 });
      }
    }

    // Update order status in DB to captured
    const { error: orderError } = await adminSupabase
      .from('orders')
      .update({
        payment_status: 'captured',
        razorpay_payment_id
      })
      .eq('surprise_id', surpriseId);

    if (orderError) {
      console.error('Failed to update database order status:', orderError.message);
      return NextResponse.json({ error: 'Failed to record payment verification' }, { status: 500 });
    }

    // Map plan name casing to match db foreign keys
    const planCasingMap: Record<string, string> = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      luxury: 'Luxury'
    };
    const dbPlanName = planCasingMap[planName.toLowerCase()] || planName;

    // Activate the surprise
    const { data: surprise, error: surpriseError } = await adminSupabase
      .from('surprises')
      .update({
        status: 'active',
        plan_type: dbPlanName
      })
      .eq('id', surpriseId)
      .select('surprise_slug')
      .single();

    if (surpriseError || !surprise) {
      console.error('Failed to activate surprise:', surpriseError?.message);
      return NextResponse.json({ error: 'Failed to publish surprise. Please contact support.' }, { status: 500 });
    }

    // Discard active draft
    await adminSupabase.from('drafts').delete().eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      slug: surprise.surprise_slug
    });
  } catch (err: any) {
    console.error("Payment verification endpoint error:", err);
    return NextResponse.json({ error: 'Something went wrong 💔 Please try again.' }, { status: 500 });
  }
}
