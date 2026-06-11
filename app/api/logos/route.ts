import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_logos')
    .select('id, name, public_url, remembered_size, remembered_position')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const form = await request.formData();
  const imageFile = form.get('image') as File | null;
  const name = (form.get('name') as string) || 'Logo';

  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ error: 'Image manquante' }, { status: 400 });
  }

  const ext = imageFile.type === 'image/png' ? 'png' : 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await imageFile.arrayBuffer();

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from('logos')
    .upload(path, arrayBuffer, { contentType: imageFile.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('logos').getPublicUrl(path);
  const { data, error } = await admin
    .from('user_logos')
    .insert({ user_id: user.id, name, storage_path: path, public_url: publicUrl })
    .select('id, name, public_url, remembered_size, remembered_position')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
