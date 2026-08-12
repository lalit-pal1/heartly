import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
    }

    const bodyText = await request.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Razorpay webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(bodyText);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const eventData = JSON.parse(bodyText);
    const event = eventData.event;
    
    const adminSupabase = createAdminClient();

    if (event === 'order.paid' || event === 'payment.captured') {
      const payment = eventData.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Update database order record using direct DB links to avoid notes tampering
      if (orderId) {
        const { data: orderRecord, error: orderFetchError } = await adminSupabase
          .from('orders')
          .select('surprise_id, user_id')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();

        if (!orderFetchError && orderRecord) {
          const dbSurpriseId = orderRecord.surprise_id;

          await adminSupabase
            .from('orders')
            .update({
              payment_status: 'captured',
              razorpay_payment_id: paymentId
            })
            .eq('razorpay_order_id', orderId);

          await adminSupabase
            .from('surprises')
            .update({
              status: 'active'
            })
            .eq('id', dbSurpriseId);

          if (orderRecord.user_id) {
            await adminSupabase.from('drafts').delete().eq('user_id', orderRecord.user_id);
          }
        }
      }
    } else if (event === 'payment.failed') {
      const payment = eventData.payload.payment.entity;
      const orderId = payment.order_id;

      if (orderId) {
        await adminSupabase
          .from('orders')
          .update({
            payment_status: 'failed'
          })
          .eq('razorpay_order_id', orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: 'Something went wrong 💔 Please try again.' }, { status: 500 });
  }
}
