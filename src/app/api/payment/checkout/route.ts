import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rateLimiter';

const PLAN_PRICES: Record<string, number> = {
  basic: 39,
  premium: 79,
  luxury: 149
};

function sanitize(text: string): string {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { surpriseId, planName, useCredit } = await request.json();
    if (!surpriseId || !planName) {
      return NextResponse.json({ error: 'Missing surpriseId or planName' }, { status: 400 });
    }

    const sanitizedSurpriseId = sanitize(surpriseId);
    const sanitizedPlanName = sanitize(planName);

    const lowerPlan = sanitizedPlanName.toLowerCase();
    const price = PLAN_PRICES[lowerPlan];
    if (price === undefined) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Rate limiting (5 checkout creations per minute per user/IP)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimitKey = `checkout_${user.id}_${ip}`;
    const { success } = await rateLimit(rateLimitKey, 5, 60);
    if (!success) {
      return NextResponse.json({ error: 'Too many checkout requests 💔 Please wait a moment.' }, { status: 429 });
    }

    // Admin client fallback to user client if key is missing during development
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    // Verify surprise exists and belongs to the authenticated user
    const { data: surprise, error: surpriseError } = await adminSupabase
      .from('surprises')
      .select('user_id, surprise_slug')
      .eq('id', sanitizedSurpriseId)
      .maybeSingle();

    if (surpriseError || !surprise) {
      return NextResponse.json({ error: 'Surprise not found' }, { status: 404 });
    }

    if (surprise.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to this surprise configuration' }, { status: 403 });
    }

    // Handle Secure server-side basic credit redemption
    if (useCredit) {
      if (lowerPlan !== 'basic') {
        return NextResponse.json({ error: 'Credits are only redeemable for Basic surprises' }, { status: 400 });
      }

      const { data: isRedeemed, error: redeemError } = await adminSupabase.rpc('redeem_basic_credit', {
        u_id: user.id,
        s_id: sanitizedSurpriseId
      });

      if (redeemError || !isRedeemed) {
        console.error('Credit redemption failed:', redeemError?.message || 'No credits remaining');
        return NextResponse.json({ error: 'Insufficient credits or invalid surprise configuration' }, { status: 400 });
      }

      // Delete draft after successful redemption
      await adminSupabase.from('drafts').delete().eq('user_id', user.id);

      return NextResponse.json({
        success: true,
        isCreditRedeemed: true,
        slug: surprise.surprise_slug
      });
    }

    // Auto-Simulate Payment Success for localhost/development
    const host = request.headers.get('host') || '';
    const isDev = process.env.NODE_ENV === 'development' || host.includes('localhost') || host.includes('127.0.0.1');

    if (isDev) {
      console.log("Local development environment detected. Auto-simulating successful payment.");
      
      // Update/Upsert order record in database with status 'captured'
      const { error: orderError } = await adminSupabase
        .from('orders')
        .upsert({
          user_id: user.id,
          surprise_id: sanitizedSurpriseId,
          amount: price,
          currency: 'INR',
          payment_status: 'captured',
          razorpay_payment_id: 'test_success'
        }, { onConflict: 'surprise_id' });

      if (orderError) {
        console.error('Failed to record dev sandbox order:', orderError.message);
        return NextResponse.json({ error: `Failed to record dev sandbox order: ${orderError.message}` }, { status: 500 });
      }

      // Map plan name casing to match db foreign keys
      const planCasingMap: Record<string, string> = {
        free: 'Free',
        basic: 'Basic',
        premium: 'Premium',
        luxury: 'Luxury'
      };
      const dbPlanName = planCasingMap[sanitizedPlanName.toLowerCase()] || sanitizedPlanName;

      // Activate surprise directly
      const { error: activateError } = await adminSupabase
        .from('surprises')
        .update({
          status: 'active',
          plan_type: dbPlanName
        })
        .eq('id', sanitizedSurpriseId);

      if (activateError) {
        console.error('Failed to activate surprise in dev mode:', activateError.message);
        return NextResponse.json({ error: `Failed to activate surprise: ${activateError.message}` }, { status: 500 });
      }

      // Discard active draft
      await adminSupabase.from('drafts').delete().eq('user_id', user.id);

      return NextResponse.json({
        success: true,
        isDevelopment: true,
        slug: surprise.surprise_slug
      });
    }

    // Retrieve Razorpay keys from environment
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Sandbox fallback if credentials are not set or set to dummy values
    if (!keyId || !keySecret || keyId === 'rzp_test_mock' || keyId.startsWith('mock')) {
      console.warn("Razorpay credentials missing or set to mock. Initializing Sandbox Order.");
      
      const mockOrderId = `order_sandbox_${Math.random().toString(36).substring(2, 15)}`;
      
      // Insert order record into database with status pending
      const { error: orderError } = await adminSupabase
        .from('orders')
        .upsert({
          user_id: user.id,
          surprise_id: sanitizedSurpriseId,
          amount: price,
          currency: 'INR',
          payment_status: 'pending',
          razorpay_order_id: mockOrderId
        }, { onConflict: 'surprise_id' });

      if (orderError) {
        console.error('Failed to record pending sandbox database order:', orderError.message);
        return NextResponse.json({ error: `Failed to record pending sandbox order: ${orderError.message}` }, { status: 500 });
      }

      return NextResponse.json({
        orderId: mockOrderId,
        amount: price * 100, // in paise
        currency: 'INR',
        keyId: 'sandbox',
        isSandbox: true
      });
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    // Create Razorpay Order
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        amount: price * 100, // Amount in paise
        currency: 'INR',
        receipt: sanitizedSurpriseId,
        notes: {
          userId: user.id,
          surpriseId: sanitizedSurpriseId,
          planName: sanitizedPlanName
        }
      })
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay order creation failed response:', errorText);
      return NextResponse.json({ error: `Razorpay order creation failed: ${errorText}` }, { status: 500 });
    }

    const razorpayOrder = await razorpayResponse.json();

    // Insert order record into database with status pending
    const { error: orderError } = await adminSupabase
      .from('orders')
      .upsert({
        user_id: user.id,
        surprise_id: sanitizedSurpriseId,
        amount: price,
        currency: 'INR',
        payment_status: 'pending',
        razorpay_order_id: razorpayOrder.id
      }, { onConflict: 'surprise_id' });

    if (orderError) {
      console.error('Failed to record pending database order:', orderError.message);
      return NextResponse.json({ error: `Failed to record pending database order: ${orderError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId
    });
  } catch (err: any) {
    console.error("Payment checkout endpoint error:", err);
    return NextResponse.json({ error: `Checkout endpoint error: ${err.message || err}` }, { status: 500 });
  }
}
