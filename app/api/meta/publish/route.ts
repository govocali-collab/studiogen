import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

interface PublishBody {
  caption: string;
  imageUrl: string;         // publicly accessible URL (Supabase Storage public URL)
  platforms: ('facebook' | 'instagram')[];
}

interface MetaConnection {
  facebook_page_id: string | null;
  facebook_page_access_token: string | null;
  instagram_business_id: string | null;
}

async function publishToFacebook(pageId: string, pageToken: string, imageUrl: string, caption: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl, message: caption, access_token: pageToken }),
  });
  return res.json() as Promise<{ id?: string; error?: { message: string } }>;
}

async function publishToInstagram(igId: string, pageToken: string, imageUrl: string, caption: string) {
  // Step 1: Create media container
  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken }),
  });
  const container = await containerRes.json() as { id?: string; error?: { message: string } };
  if (!container.id) return container;

  // Step 2: Publish the container
  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
  });
  return publishRes.json() as Promise<{ id?: string; error?: { message: string } }>;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json() as PublishBody;
  const { caption, imageUrl, platforms } = body;

  if (!caption || !imageUrl || !platforms?.length) {
    return NextResponse.json({ error: 'Paramètres manquants (caption, imageUrl, platforms)' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('meta_connections')
    .select('facebook_page_id, facebook_page_access_token, instagram_business_id')
    .eq('user_id', user.id)
    .single();

  if (!conn) {
    return NextResponse.json({ error: 'Aucun compte Meta connecté. Va dans Paramètres → Connexions.' }, { status: 400 });
  }

  const { facebook_page_id, facebook_page_access_token, instagram_business_id } = conn as MetaConnection;

  const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

  if (platforms.includes('facebook')) {
    if (!facebook_page_id || !facebook_page_access_token) {
      results.facebook = { success: false, error: 'Aucune Page Facebook connectée.' };
    } else {
      const r = await publishToFacebook(facebook_page_id, facebook_page_access_token, imageUrl, caption);
      results.facebook = r.id ? { success: true, id: r.id } : { success: false, error: r.error?.message };
    }
  }

  if (platforms.includes('instagram')) {
    if (!instagram_business_id || !facebook_page_access_token) {
      results.instagram = { success: false, error: 'Aucun compte Instagram Business connecté.' };
    } else {
      const r = await publishToInstagram(instagram_business_id, facebook_page_access_token, imageUrl, caption);
      results.instagram = r.id ? { success: true, id: r.id } : { success: false, error: r.error?.message };
    }
  }

  const allFailed = Object.values(results).every(r => !r.success);
  return NextResponse.json({ results }, { status: allFailed ? 500 : 200 });
}
