import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractText(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .single();

  const tier = (profile as { subscription_tier?: string } | null)?.subscription_tier ?? 'essentiel';
  const status = (profile as { subscription_status?: string } | null)?.subscription_status ?? 'trialing';
  const effectiveTier = status === 'trialing' ? 'pro' : tier;

  if (effectiveTier !== 'pro') {
    return NextResponse.json({ error: 'Fonctionnalité réservée au plan Pro.' }, { status: 403 });
  }

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { url } = body;
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Protocol invalide');
  } catch {
    return NextResponse.json({ error: 'URL invalide. Assurez-vous d\'inclure https://' }, { status: 400 });
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Le site a retourné une erreur ${response.status}`);
    html = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur de connexion';
    if (msg.includes('aborted') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Le site a pris trop de temps à répondre.' }, { status: 408 });
    }
    return NextResponse.json({ error: `Impossible d'accéder au site : ${msg}` }, { status: 400 });
  }

  const text = extractText(html).slice(0, 7000);

  if (text.length < 80) {
    return NextResponse.json({ error: 'Le contenu du site est insuffisant pour générer une description.' }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `Voici le contenu textuel extrait du site web d'une entreprise. À partir de ces informations, génère une description d'entreprise en français québécois naturel et authentique. Cette description sera utilisée par une IA pour créer des publications de médias sociaux qui reflètent l'identité de l'entreprise.

La description doit inclure (si l'information est disponible) : les services offerts, la clientèle cible, le style et les valeurs, et la localisation. Vise 120-200 mots. Écris UNIQUEMENT la description, sans titre, sans commentaire, sans mention du site web.

N'utilise JAMAIS le tiret long (—). Utilise des expressions québécoises naturelles.

Contenu du site :
${text}`,
      }],
    });

    const description = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    if (!description) throw new Error('Réponse vide du modèle');
    return NextResponse.json({ description });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
