import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8',
};

function extractText(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, headers: FETCH_HEADERS });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const text = extractText(html);
    return text.length > 100 ? text.slice(0, 3000) : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', session.user.id)
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
    return NextResponse.json({ error: "URL invalide. Assurez-vous d'inclure https://" }, { status: 400 });
  }

  const origin = parsedUrl.origin;
  const pathsToTry = ['/', '/about', '/a-propos', '/apropos', '/services', '/contact', '/notre-histoire'];
  const pageFetches = pathsToTry.map(p => fetchPage(origin + p));
  const results = await Promise.all(pageFetches);

  const texts = results.filter(Boolean) as string[];
  if (texts.length === 0) {
    return NextResponse.json({ error: 'Impossible de lire le contenu du site.' }, { status: 400 });
  }

  const combinedText = texts.join('\n\n---\n\n').slice(0, 10000);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Analyse ce contenu extrait du site web d'une entreprise au Québec et génère un profil de marque structuré.

Retourne UNIQUEMENT un objet JSON valide avec exactement ces clés (sans texte avant ou après):
{
  "business_summary": "résumé de 80-120 mots de l'entreprise en français québécois naturel, sans em dash",
  "city": "ville (null si inconnue)",
  "province": "province canadienne (généralement Québec, null si inconnue)",
  "target_audience": "description courte de la clientèle cible (ex: femmes 25-55 ans, entrepreneurs locaux)",
  "brand_voice": ["tableau de 1-4 valeurs parmi exactement: chaleureux, professionnel, luxueux, moderne, éducatif, inspirant, familial, haut_de_gamme"],
  "services": ["liste des services ou produits principaux, maximum 8 items"],
  "favorite_phrases": ["2-4 expressions ou formulations qui reflètent leur style de communication"],
  "avoid_phrases": [],
  "content_preferences": ["1-3 valeurs parmi exactement: résultats, avant_apres, éducatif, promo, produits, témoignages, formations, astuces"],
  "cta_style": "une valeur parmi exactement: réservez maintenant, contactez-nous, écrivez-nous, demandez une consultation, appelez-nous"
}

Contenu du site :
${combinedText}`,
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Réponse invalide du modèle');
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
