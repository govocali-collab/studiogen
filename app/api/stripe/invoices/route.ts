import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', session.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any;
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ invoices: [] });
  }

  const list = await stripe.invoices.list({
    customer: profile.stripe_customer_id,
    limit: 24,
    status: 'paid',
  });

  const invoices = list.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    date: inv.created,
    amount: inv.amount_paid,
    currency: inv.currency,
    pdf: inv.invoice_pdf,
    url: inv.hosted_invoice_url,
  }));

  return NextResponse.json({ invoices });
}
