import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requirePro(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('subscription_tier, subscription_status').eq('id', userId).single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = data as any;
  return p?.subscription_status === 'trialing' || p?.subscription_tier === 'pro';
}

// GET /api/planned-content — list planned items for the authenticated user
export async function GET(request: NextRequest) {
  void request;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!await requirePro(user.id)) return NextResponse.json({ error: 'Plan Pro requis' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('planned_content')
    .select('*')
    .eq('user_id', user.id)
    .gte('suggested_date', sixMonthsAgo())
    .lte('suggested_date', sixMonthsFromNow())
    .order('suggested_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/planned-content — save a batch of generated plan items
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!await requirePro(user.id)) return NextResponse.json({ error: 'Plan Pro requis' }, { status: 403 });

  let body: { items: Array<{
    title: string;
    content_type: string;
    service_focus?: string | null;
    objective?: string | null;
    suggested_date: string;
    platform: string;
    requires_photo?: boolean;
  }> };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { items } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Aucun élément à enregistrer' }, { status: 400 });
  }

  const VALID_TYPES = ['formation', 'résultats clients', 'produit', 'engagement', 'éducatif', 'promo'];
  const VALID_PLATFORMS = ['fb', 'ig', 'both'];

  const admin = createAdminClient();
  const rows = items.map(item => {
    // Normalize content_type — lowercase and trim, fallback to 'engagement'
    const ct = (item.content_type ?? '').toLowerCase().trim();
    const contentType = VALID_TYPES.includes(ct) ? ct : 'engagement';

    // Normalize platform — fallback to 'both'
    const pl = (item.platform ?? '').toLowerCase().trim();
    const platform = VALID_PLATFORMS.includes(pl) ? pl : 'both';

    return {
      user_id: user.id,
      title: (item.title ?? '').slice(0, 200),
      content_type: contentType,
      service_focus: item.service_focus ?? null,
      objective: item.objective ?? null,
      suggested_date: item.suggested_date,
      platform,
      requires_photo: item.requires_photo ?? false,
      status: 'planned',
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('planned_content').insert(rows as any).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

function sixMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

function sixMonthsFromNow() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}
