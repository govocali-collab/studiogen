import { NextResponse } from 'next/server';

// TEMPORARY DEBUG ENDPOINT — remove after confirming price IDs
export async function GET() {
  return NextResponse.json({
    STRIPE_PRICE_ESSENTIEL: process.env.STRIPE_PRICE_ESSENTIEL ?? '(not set)',
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO ?? '(not set)',
    STRIPE_SECRET_KEY_PREFIX: (process.env.STRIPE_SECRET_KEY ?? '').slice(0, 8) + '...',
  });
}
