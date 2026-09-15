import { NextRequest, NextResponse } from 'next/server';
import { comprarPaseSalaAction } from '@/actions/salas.actions';

/**
 * POST /api/webhooks/stripe
 * Asynchronous webhook handler for Stripe payments (Pases de Sala & Súper-Anfitrión).
 * Automatically inserts the 4.99 € room pass as a shared expense where the purchaser is sole payer.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.type || 'checkout.session.completed';
    const metadata = body?.data?.object?.metadata || body?.metadata || {};

    const passType = metadata.passType || 'pase_sala';
    const salaId = metadata.salaId || 'cenas-viernes';
    const buyerId = metadata.buyerId || 'user-carlos';

    if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
      if (passType === 'pase_sala') {
        // Accounting insertion:
        await comprarPaseSalaAction(salaId, buyerId);
      }
      // Super-host pass activation can also be handled here
    }

    return NextResponse.json({ received: true, eventType });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error processing Stripe webhook' },
      { status: 400 }
    );
  }
}
