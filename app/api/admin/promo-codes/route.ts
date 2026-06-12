import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) return null;
  return user;
}

// GET — list all promotion codes from Stripe
export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // expand: ['data.promotion.coupon'] in v22
  const codes = await stripe.promotionCodes.list({
    limit: 100,
    expand: ['data.promotion.coupon'],
  });

  const mapped = codes.data.map(pc => {
    const coupon = pc.promotion.coupon as Stripe.Coupon;
    const discountLabel = coupon.percent_off
      ? `-${coupon.percent_off}%`
      : coupon.amount_off
      ? `-${(coupon.amount_off / 100).toFixed(2)} $`
      : '?';
    const durationLabel =
      coupon.duration === 'once' ? 'Une fois' :
      coupon.duration === 'forever' ? 'Pour toujours' :
      `${coupon.duration_in_months} mois`;

    return {
      id: pc.id,
      code: pc.code,
      active: pc.active,
      discountLabel,
      percentOff: coupon.percent_off ?? null,
      amountOff: coupon.amount_off ?? null,
      duration: coupon.duration,
      durationInMonths: coupon.duration_in_months ?? null,
      maxRedemptions: pc.max_redemptions ?? coupon.max_redemptions ?? null,
      timesRedeemed: pc.times_redeemed,
      expiresAt: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
      couponId: typeof coupon === 'string' ? coupon : coupon.id,
      durationLabel,
      createdAt: new Date(pc.created * 1000).toISOString(),
    };
  });

  return NextResponse.json({ codes: mapped });
}

interface CreateBody {
  code: string;
  percentOff: number;
  duration: 'once' | 'repeating' | 'forever';
  durationMonths?: number;
  maxRedemptions?: number;
  expiresAt?: string;
}

// POST — create a coupon + promotion code in Stripe
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { code, percentOff, duration, durationMonths, maxRedemptions, expiresAt } = body;

  if (!code || !percentOff || !duration) {
    return NextResponse.json({ error: 'Champs manquants (code, percentOff, duration)' }, { status: 400 });
  }
  if (percentOff < 1 || percentOff > 100) {
    return NextResponse.json({ error: 'La réduction doit être entre 1 et 100 %' }, { status: 400 });
  }
  if (duration === 'repeating' && (!durationMonths || durationMonths < 1)) {
    return NextResponse.json({ error: 'durationMonths requis pour durée récurrente' }, { status: 400 });
  }

  try {
    const couponParams: Stripe.CouponCreateParams = {
      percent_off: percentOff,
      duration,
      name: code,
    };
    if (duration === 'repeating' && durationMonths) {
      couponParams.duration_in_months = durationMonths;
    }
    if (maxRedemptions) {
      couponParams.max_redemptions = maxRedemptions;
    }

    const coupon = await stripe.coupons.create(couponParams);

    // v22: PromotionCodeCreateParams uses `promotion: { type, coupon }` instead of top-level `coupon`
    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { type: 'coupon', coupon: coupon.id },
      code: code.toUpperCase(),
    };
    if (maxRedemptions) promoParams.max_redemptions = maxRedemptions;
    if (expiresAt) promoParams.expires_at = Math.floor(new Date(expiresAt).getTime() / 1000);

    const promoCode = await stripe.promotionCodes.create(promoParams);

    return NextResponse.json({ id: promoCode.id, code: promoCode.code });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
