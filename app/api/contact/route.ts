import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendContactNotification, sendContactConfirmation } from '@/lib/emails';
import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit: max 3 submissions per user per 24h
const rateLimitMap = new Map<string, number[]>();
const MAX_PER_DAY = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) ?? []).filter(t => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_PER_DAY) return true;
  rateLimitMap.set(userId, [...timestamps, now]);
  return false;
}

const MAX_FILE_MB = 5;
const MAX_FILES = 3;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    if (isRateLimited(user.id)) {
      return NextResponse.json(
        { error: 'Limite atteinte. Tu peux envoyer au maximum 3 messages par 24 heures.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();

    // Honeypot check — bots fill this invisible field
    const honeypot = formData.get('_hp') as string | null;
    if (honeypot) return NextResponse.json({ ok: true }); // silently drop

    const subject = (formData.get('subject') as string | null)?.trim();
    const message = (formData.get('message') as string | null)?.trim();
    const firstName = (formData.get('firstName') as string | null)?.trim() ?? '';
    const lastName = (formData.get('lastName') as string | null)?.trim() ?? '';
    const businessName = (formData.get('businessName') as string | null)?.trim() ?? '';

    if (!subject || !message) {
      return NextResponse.json({ error: 'Sujet et message requis.' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message trop long (max 5000 caractères).' }, { status: 400 });
    }

    // Process attachments
    interface Attachment { filename: string; content: Buffer; content_type: string; }
    const attachments: Attachment[] = [];
    const rawFiles = formData.getAll('files');
    let fileCount = 0;
    for (const entry of rawFiles) {
      if (!(entry instanceof File) || !entry.type.startsWith('image/')) continue;
      if (entry.size > MAX_FILE_MB * 1024 * 1024) continue;
      if (fileCount >= MAX_FILES) break;
      const buffer = Buffer.from(await entry.arrayBuffer());
      attachments.push({ filename: entry.name, content: buffer, content_type: entry.type });
      fileCount++;
    }

    await sendContactNotification({
      from: { firstName, lastName, businessName, email: user.email! },
      subject,
      message,
      attachments,
    });

    await sendContactConfirmation(user.email!, firstName);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[contact]', msg);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessaie dans quelques instants.' }, { status: 500 });
  }
}
