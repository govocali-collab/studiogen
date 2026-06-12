import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { code: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'Code manquant' }, { status: 400 });

  try {
    const list = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ['data.promotion.coupon'],
    });

    if (!list.data.length) {
      return NextResponse.json({ valid: false, error: 'Code invalide ou expiré' }, { status: 404 });
    }

    const pc = list.data[0];
    const coupon = pc.promotion.coupon as Stripe.Coupon;

    const discountLabel = coupon.percent_off
      ? `-${coupon.percent_off}%`
      : `-${((coupon.amount_off ?? 0) / 100).toFixed(2)} $`;

    const durationLabel =
      coupon.duration === 'once' ? 'sur votre premier paiement' :
      coupon.duration === 'forever' ? 'pour toujours' :
      `pendant ${coupon.duration_in_months} mois`;

    const couponId = typeof coupon === 'string' ? coupon : coupon.id;

    return NextResponse.json({
      valid: true,
      promotionCodeId: pc.id,
      couponId,
      discountLabel,
      durationLabel,
      summary: `${discountLabel} ${durationLabel}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
