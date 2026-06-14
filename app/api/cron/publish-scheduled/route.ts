import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

interface ScheduledPost {
  id: string;
  user_id: string;
  caption: string;
  image_url: string | null;
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
  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken }),
  });
  const container = await containerRes.json() as { id?: string; error?: { message: string } };
  if (!container.id) return container;

  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
  });
  return publishRes.json() as Promise<{ id?: string; error?: { message: string } }>;
}

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch all pending posts whose scheduled time has arrived
  const { data: posts, error } = await admin
    .from('scheduled_posts')
    .select('id, user_id, caption, image_url, platforms')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!posts?.length) return NextResponse.json({ published: 0 });

  const results = await Promise.all(
    posts.map(async (post: ScheduledPost) => {
      const { data: conn } = await admin
        .from('meta_connections')
        .select('facebook_page_id, facebook_page_access_token, instagram_business_id')
        .eq('user_id', post.user_id)
        .single();

      if (!conn) {
        await admin.from('scheduled_posts').update({ status: 'failed', error_message: 'No Meta connection' }).eq('id', post.id);
        return { id: post.id, status: 'failed' };
      }

      const { facebook_page_id, facebook_page_access_token, instagram_business_id } = conn as MetaConnection;
      const errors: string[] = [];

      if (post.platforms.includes('facebook')) {
        if (facebook_page_id && facebook_page_access_token && post.image_url) {
          const r = await publishToFacebook(facebook_page_id, facebook_page_access_token, post.image_url, post.caption);
          if (!r.id) errors.push(`FB: ${r.error?.message}`);
        } else {
          errors.push('FB: page ou image manquante');
        }
      }

      if (post.platforms.includes('instagram')) {
        if (instagram_business_id && facebook_page_access_token && post.image_url) {
          const r = await publishToInstagram(instagram_business_id, facebook_page_access_token, post.image_url, post.caption);
          if (!r.id) errors.push(`IG: ${r.error?.message}`);
        } else {
          errors.push('IG: compte ou image manquant');
        }
      }

      const status = errors.length === 0 ? 'published' : 'failed';
      await admin.from('scheduled_posts').update({
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        error_message: errors.length ? errors.join('; ') : null,
      }).eq('id', post.id);

      return { id: post.id, status };
    })
  );

  const published = results.filter(r => r.status === 'published').length;
  const failed = results.filter(r => r.status === 'failed').length;
  return NextResponse.json({ published, failed, total: posts.length });
}
