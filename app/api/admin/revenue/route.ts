import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MOIS_LONG  = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Build 12 empty monthly buckets (oldest → newest)
  const now = new Date();
  const buckets: Record<string, { revenue: number; count: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { revenue: 0, count: 0 };
  }

  // Fetch all paid invoices from the last 12 months (paginated)
  const twelveMonthsAgo = Math.floor(
    new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime() / 1000
  );

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const page = await stripe.invoices.list({
      status: 'paid',
      limit: 100,
      created: { gte: twelveMonthsAgo },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const inv of page.data) {
      if (!inv.amount_paid || inv.amount_paid <= 0) continue;
      const paidAt = inv.status_transitions?.paid_at ?? inv.created;
      const d = new Date(paidAt * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets[key]) {
        buckets[key].revenue += inv.amount_paid;
        buckets[key].count += 1;
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
    else break;
  }

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const months = Object.entries(buckets).map(([key, { revenue, count }]) => {
    const [year, month] = key.split('-');
    const mi = parseInt(month) - 1;
    return {
      monthKey: key,
      monthLabel: `${MOIS_LONG[mi]} ${year}`,
      shortLabel: MOIS_COURT[mi],
      revenue: Math.round(revenue / 100),
      count,
      isCurrent: key === currentKey,
    };
  });

  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const currentRevenue = months.find(m => m.isCurrent)?.revenue ?? 0;
  const lastMonthRevenue = months[months.length - 2]?.revenue ?? 0;

  return NextResponse.json({ months, totalRevenue, currentRevenue, lastMonthRevenue });
}
