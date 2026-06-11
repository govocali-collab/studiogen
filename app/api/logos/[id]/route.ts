import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function getOwnedLogo(userId: string, id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('user_logos')
    .select('user_id, storage_path')
    .eq('id', id)
    .single();
  return data?.user_id === userId ? data : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const logo = await getOwnedLogo(user.id, id);
  if (!logo) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });

  const contentType = request.headers.get('content-type') ?? '';

  // Re-upload image after removeBg
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const imageFile = form.get('image') as File | null;
    if (!imageFile || imageFile.size === 0) return NextResponse.json({ error: 'Image manquante' }, { status: 400 });

    const newPath = `${user.id}/${crypto.randomUUID()}.png`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(newPath, arrayBuffer, { contentType: 'image/png', upsert: false });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    await supabase.storage.from('logos').remove([logo.storage_path]);
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(newPath);

    const admin = createAdminClient();
    await admin.from('user_logos').update({ storage_path: newPath, public_url: publicUrl }).eq('id', id);
    return NextResponse.json({ public_url: publicUrl });
  }

  // Metadata update (name, remembered_size, remembered_position)
  const body = await request.json();
  const allowed = ['name', 'remembered_size', 'remembered_position'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const admin = createAdminClient();
  const { error } = await admin.from('user_logos').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const logo = await getOwnedLogo(user.id, id);
  if (!logo) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });

  await supabase.storage.from('logos').remove([logo.storage_path]);
  const admin = createAdminClient();
  await admin.from('user_logos').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
