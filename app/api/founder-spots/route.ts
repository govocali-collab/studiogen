import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('app_config')
      .select('value')
      .eq('key', 'founder_spots_remaining')
      .single();
    const spots = data ? parseInt(data.value, 10) : 87;
    return NextResponse.json({ spots: isNaN(spots) ? 87 : spots });
  } catch {
    return NextResponse.json({ spots: 87 });
  }
}
