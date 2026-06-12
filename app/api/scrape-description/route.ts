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

// ── HTML helpers ──────────────────────────────────────────────────────────────

function extractText(html: string): string {
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

// Discover internal navigation links that look like about/services/contact pages
function extractNavLinks(html: string, origin: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  const linkRe = /href=["']([^"'#?]+)["']/gi;
  const PRIORITY_RE = /\/(about|a-propos|apropos|qui-sommes|qui-nous-sommes|equipe|services|soins|traitements|soin|offres|contact|nous-joindre|nous-contacter|notre-histoire|histoire|expertise|approche)\b/i;

  let match;
  while ((match = linkRe.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href) continue;
    try {
      const url = new URL(href, origin);
      if (url.origin !== origin) continue;
      const path = url.pathname.replace(/\/$/, '') || '/';
      if (path === '/') continue;
      if (PRIORITY_RE.test(path) && !seen.has(path)) {
        seen.add(path);
        results.push(origin + path);
        if (results.length >= 6) break;
      }
    } catch { continue; }
  }
  return results;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchPageFull(url: string): Promise<{ text: string; html: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url, { signal: controller.signal, headers: FETCH_HEADERS });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const text = extractText(html);
    return text.length > 80 ? { text: text.slice(0, 6000), html } : null;
  } catch {
    return null;
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url, { signal: controller.signal, headers: FETCH_HEADERS });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const text = extractText(html);
    return text.length > 80 ? text.slice(0, 6000) : null;
  } catch {
    return null;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

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

  // ── Step 1: Fetch homepage (need raw HTML for link discovery) ─────────────
  const homepageResult = await fetchPageFull(origin + '/');
  if (!homepageResult) {
    return NextResponse.json({ error: 'Impossible de lire le contenu du site.' }, { status: 400 });
  }

  // ── Step 2: Discover nav links from homepage HTML ─────────────────────────
  const discoveredLinks = extractNavLinks(homepageResult.html, origin);

  // ── Step 3: Build URL list — discovered links + common fallbacks, deduped ──
  const FALLBACK_PATHS = [
    '/a-propos', '/about', '/qui-sommes-nous', '/services', '/soins',
    '/contact', '/nous-joindre', '/notre-histoire',
  ];
  const seenUrls = new Set<string>([origin + '/']);
  const urlsToFetch: string[] = [];

  // Discovered links first (they're real, prioritize them)
  for (const link of discoveredLinks) {
    if (!seenUrls.has(link)) { seenUrls.add(link); urlsToFetch.push(link); }
  }
  // Fallbacks for pages not discovered
  for (const path of FALLBACK_PATHS) {
    const full = origin + path;
    if (!seenUrls.has(full)) { seenUrls.add(full); urlsToFetch.push(full); }
  }

  // ── Step 4: Fetch all additional pages in parallel ────────────────────────
  const additionalTexts = await Promise.all(urlsToFetch.slice(0, 8).map(u => fetchPage(u)));

  // ── Step 5: Combine all content ───────────────────────────────────────────
  const pageTexts: string[] = [homepageResult.text];
  const crawledUrls: string[] = [origin + '/'];

  urlsToFetch.slice(0, 8).forEach((u, i) => {
    if (additionalTexts[i]) {
      pageTexts.push(additionalTexts[i]!);
      crawledUrls.push(u);
    }
  });

  const combinedText = pageTexts.join('\n\n---PAGE---\n\n').slice(0, 18000);
  const pagesCrawled = pageTexts.length;

  // ── Step 6: AI extraction ─────────────────────────────────────────────────
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Analyse ce contenu extrait du site web d'une entreprise au Québec et génère un profil de marque complet.

Retourne UNIQUEMENT un objet JSON valide avec exactement ces clés (sans texte avant ou après) :
{
  "business_name": "nom exact de l'entreprise tel qu'il apparaît sur le site (null si impossible à déterminer)",
  "business_summary": "résumé de 80-120 mots de l'entreprise en français québécois naturel. Décris ce qu'elle fait, pour qui, et ce qui la distingue. N'utilise jamais le tiret long (—).",
  "city": "ville où l'entreprise est basée (null si inconnue)",
  "province": "province canadienne, généralement Québec (null si inconnue)",
  "target_audience": "description concise de la clientèle cible, ex: Femmes 28-55 ans qui s'intéressent aux soins esthétiques et au bien-être",
  "brand_voice": ["tableau de 1-4 valeurs parmi exactement: chaleureux, professionnel, luxueux, moderne, éducatif, inspirant, familial, haut_de_gamme"],
  "services": ["liste des services ou soins principaux, maximum 8 items courts"],
  "priority_services": ["1 à 3 services les plus souvent mis en avant ou qui semblent les plus importants sur le site"],
  "transformation_goals": ["3 à 5 résultats ou transformations promis aux clientes, formulés du point de vue de la cliente, ex: Peau plus lumineuse, Confiance en soi retrouvée, Résultats visibles dès la 1ère séance"],
  "favorite_phrases": ["2-4 expressions, slogans ou formulations récurrentes détectés sur le site"],
  "avoid_phrases": [],
  "content_preferences": ["1-3 valeurs parmi exactement: résultats, avant_apres, éducatif, promo, produits, témoignages, formations, astuces"],
  "cta_style": "une valeur parmi exactement: réservez maintenant, contactez-nous, écrivez-nous, demandez une consultation, appelez-nous",
  "suggested_content_language": "détecte la langue principale du site et retourne exactement une valeur parmi: 'fr_qc' (site majoritairement en français), 'en' (site majoritairement en anglais), 'bilingual' (site clairement bilingue avec contenu substantiel dans les deux langues)"
}

Contenu extrait de ${pagesCrawled} page(s) du site :
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

    // Attach crawl metadata for the summary card
    parsed._pages_crawled = pagesCrawled;
    parsed._crawled_urls = crawledUrls;

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
