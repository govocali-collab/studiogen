import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { pageId } = await request.json() as { pageId: string };

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('meta_connections')
    .select('available_pages')
    .eq('user_id', user.id)
    .single();

  if (!conn) return NextResponse.json({ error: 'Aucune connexion trouvée' }, { status: 404 });

  const pages = JSON.parse(conn.available_pages as string) as {
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string; username: string };
  }[];

  const page = pages.find(p => p.id === pageId);
  if (!page) return NextResponse.json({ error: 'Page introuvable' }, { status: 404 });

  await admin.from('meta_connections').update({
    facebook_page_id: page.id,
    facebook_page_name: page.name,
    facebook_page_access_token: page.access_token,
    instagram_business_id: page.instagram_business_account?.id ?? null,
    instagram_username: page.instagram_business_account?.username ?? null,
  }).eq('user_id', user.id);

  return NextResponse.json({ ok: true, page: { id: page.id, name: page.name } });
}
