import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const SEASONAL_CONTEXT: Record<number, string> = {
  0:  'Nouvelles résolutions beauté du Nouvel An, remise en forme, renouveau.',
  1:  'Saint-Valentin, amour de soi, soins romantiques.',
  2:  'Relâche scolaire, renouveau printanier, peau après l\'hiver.',
  3:  'Printemps, soins post-hiver, préparation à la belle saison.',
  4:  'Saison des graduations, look soigné pour les événements.',
  5:  'Saison des mariages, soins d\'été, soleil et protection.',
  6:  'Vacances d\'été, corps prêt pour la plage, entretien estival.',
  7:  'Fin de l\'été, préparation de la rentrée, soins de transition.',
  8:  'Retour à la routine, soins d\'automne, relook pour la saison.',
  9:  'Halloween, looks d\'automne, soins pour peau sèche.',
  10: 'Black Friday, offres spéciales, magasinage des fêtes.',
  11: 'Temps des fêtes, cadeaux beauté, looks de célébration.',
};

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const { data: profileData } = await admin
    .from('profiles')
    .select('subscription_tier, subscription_status, business_name, service_description, target_audience, brand_voice, services, priority_services, transformation_goals, content_preferences, cta_style, content_language')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profileData as any;
  const tier = (p?.subscription_tier ?? 'essentiel') as string;
  const status = (p?.subscription_status ?? 'trialing') as string;
  const isPro = status === 'trialing' || tier === 'pro';
  if (!isPro) return NextResponse.json({ error: 'Plan Pro requis', code: 'PRO_REQUIRED' }, { status: 403 });

  // ── Fetch planned content (calendar) ─────────────────────────────────────
  const { data: plannedData } = await admin
    .from('planned_content')
    .select('content_type, title, suggested_date, status')
    .eq('user_id', user.id)
    .order('suggested_date', { ascending: false })
    .limit(30);

  // ── Fetch recent post history ─────────────────────────────────────────────
  const { data: historyData } = await admin
    .from('post_history')
    .select('content_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // ── Build context ─────────────────────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const monthName = MOIS_FR[currentMonth];
  const seasonalNote = SEASONAL_CONTEXT[currentMonth];

  const businessName = (p?.business_name as string | null)?.trim() || 'ton entreprise';
  const serviceDesc = (p?.service_description as string | null) ?? '';
  const targetAudience = (p?.target_audience as string | null) ?? '';
  const brandVoice = (p?.brand_voice as string[] | null) ?? [];
  const services = (p?.services as string[] | null) ?? [];
  const priorityServices = (p?.priority_services as string[] | null) ?? [];
  const contentPrefs = (p?.content_preferences as string[] | null) ?? [];

  // Count content types in calendar
  const typeCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (plannedData ?? []).forEach((item: any) => {
    const ct = item.content_type as string;
    typeCounts[ct] = (typeCounts[ct] ?? 0) + 1;
  });

  // Count recent generated posts
  const recentTypeCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (historyData ?? []).forEach((item: any) => {
    const ct = item.content_type as string;
    recentTypeCounts[ct] = (recentTypeCounts[ct] ?? 0) + 1;
  });

  const calendarSummary = Object.entries(typeCounts).length > 0
    ? Object.entries(typeCounts).map(([k, v]) => `${k}: ${v}`).join(', ')
    : 'Aucune publication planifiée';

  const recentSummary = Object.entries(recentTypeCounts).length > 0
    ? Object.entries(recentTypeCounts).map(([k, v]) => `${k}: ${v}`).join(', ')
    : 'Aucune publication générée récemment';

  const contentLanguage = (p?.content_language as string | null) ?? 'fr_qc';
  const langNote = contentLanguage === 'en'
    ? 'This account creates content in English.'
    : contentLanguage === 'bilingual'
    ? 'This account creates bilingual content (French + English).'
    : '';

  // ── Build prompt ──────────────────────────────────────────────────────────
  const systemPrompt = `Tu es un stratège marketing expert spécialisé dans les entreprises de beauté au Québec.
Tu analyses le profil d'une entreprise et son historique de contenu pour générer des recommandations stratégiques ultra-personnalisées.
Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte avant ou après.`;

  const userPrompt = `Analyse cette entreprise et génère entre 3 et 5 suggestions de publications stratégiques.

ENTREPRISE : ${businessName}
${serviceDesc ? `Description : ${serviceDesc}` : ''}
${targetAudience ? `Clientèle cible : ${targetAudience}` : ''}
${services.length ? `Services : ${services.join(', ')}` : ''}
${priorityServices.length ? `Services prioritaires : ${priorityServices.join(', ')}` : ''}
${brandVoice.length ? `Voix de marque : ${brandVoice.join(', ')}` : ''}
${contentPrefs.length ? `Types de contenu préférés : ${contentPrefs.join(', ')}` : ''}
${langNote}

CONTEXTE CALENDRIER
Mois actuel : ${monthName}
Contexte saisonnier : ${seasonalNote}
Répartition du calendrier planifié : ${calendarSummary}
Publications récentes générées : ${recentSummary}

RÈGLES D'ANALYSE
- Détecte les déséquilibres dans le calendrier (trop de promos, manque d'engagement, etc.)
- Tiens compte de la saisonnalité du mois de ${monthName}
- Priorise les services prioritaires de l'entreprise
- Chaque suggestion doit être actionnable et spécifique à cette entreprise
- Varie les types de contenu suggérés

Retourne UNIQUEMENT un tableau JSON de 3 à 5 objets avec EXACTEMENT ces clés :
- "emoji": un seul emoji représentant le type de suggestion
- "headline": observation courte et directe sur le calendrier ou l'opportunité (max 80 caractères)
- "action": action recommandée spécifique à cette entreprise (max 100 caractères)
- "ct": type de contenu, exactement un de : "résultats clients" | "éducatif" | "engagement" | "promo" | "produit" | "formation"
- "tone": ton recommandé, exactement un de : "chaleureux" | "énergique" | "professionnel"
- "details": contexte pré-rempli pour le Studio (2-3 phrases décrivant le sujet précis, l'angle, le message clé — en français québécois naturel)`;

  try {
    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) return NextResponse.json({ error: 'Réponse invalide' }, { status: 500 });
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed)) return NextResponse.json({ error: 'Format inattendu' }, { status: 500 });

    return NextResponse.json(parsed, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
