import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('meta_connections')
    .select('facebook_page_id, facebook_page_name, instagram_business_id, instagram_username, token_expires_at, available_pages, connected_at')
    .eq('user_id', user.id)
    .single();

  if (!data) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    facebookPageId: data.facebook_page_id,
    facebookPageName: data.facebook_page_name,
    instagramId: data.instagram_business_id,
    instagramUsername: data.instagram_username,
    tokenExpiresAt: data.token_expires_at,
    connectedAt: data.connected_at,
    availablePages: data.available_pages ? JSON.parse(data.available_pages as string) : [],
  });
}
