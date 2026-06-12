import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from('profiles')
    .select('subscription_tier, subscription_status, business_name, city, province, target_audience, services, priority_services, brand_voice, cta_style, content_language')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profileData as any;
  const tier = (p?.subscription_tier ?? 'essentiel') as string;
  const status = (p?.subscription_status ?? 'trialing') as string;
  const isPro = status === 'trialing' || tier === 'pro';
  if (!isPro) return NextResponse.json({ error: 'Plan Pro requis' }, { status: 403 });

  let body: { mode: 'week' | 'month'; startDate: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { mode, startDate } = body;
  if (!mode || !startDate) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

  const businessName = ((p?.business_name as string | null)?.trim()) || 'votre clinique';
  const city = p?.city as string | null;
  const province = p?.province as string | null;
  const targetAudience = p?.target_audience as string | null;
  const services = p?.services as string[] | null;
  const priorityServices = p?.priority_services as string[] | null;
  const brandVoice = p?.brand_voice as string[] | null;
  const ctaStyle = p?.cta_style as string | null;
  const contentLanguage = (p?.content_language as 'fr_qc' | 'en' | 'bilingual' | null) ?? 'fr_qc';
  const isEnglish = contentLanguage === 'en';
  const isBilingual = contentLanguage === 'bilingual';

  const location = [city, province].filter(Boolean).join(', ');
  const count = mode === 'week' ? 4 : 14;

  // Compute end date for the prompt
  const start = new Date(startDate + 'T00:00:00');
  const endDate = new Date(start);
  if (mode === 'week') endDate.setDate(start.getDate() + 6);
  else endDate.setMonth(start.getMonth() + 1, 0); // last day of month
  const endDateStr = endDate.toISOString().slice(0, 10);

  const distribution = mode === 'week'
    ? 'Répartis sur lundi, mercredi, vendredi et samedi (4 publications).'
    : 'Répartis uniformément sur 4 semaines (3-4 publications par semaine pour un total de 14).';

  const systemPrompt = isEnglish || isBilingual
    ? `You are a content strategist for beauty professionals in Quebec.
You create balanced, strategic content plans for Facebook and Instagram.
${isBilingual ? 'This account is BILINGUAL. Alternate titles between French québécois and English across the plan.' : 'This account creates content in English for their clients.'}
Reply ONLY with a valid JSON array, no text before or after.`
    : `Tu es un stratège de contenu pour des professionnels de la beauté au Québec.
Tu crées des plans de contenu équilibrés et stratégiques pour Facebook et Instagram.
Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte avant ou après.`;

  const servicesLine = services?.length
    ? (isEnglish || isBilingual ? `Services offered: ${services.join(', ')}` : `Services offerts : ${services.join(', ')}`)
    : '';
  const priorityLine = priorityServices?.length
    ? (isEnglish || isBilingual ? `Priority services: ${priorityServices.join(', ')}` : `Services à prioriser : ${priorityServices.join(', ')}`)
    : '';
  const audienceLine = targetAudience
    ? (isEnglish || isBilingual ? `Target audience: ${targetAudience}` : `Clientèle cible : ${targetAudience}`)
    : '';
  const brandVoiceLine = brandVoice?.length
    ? (isEnglish || isBilingual ? `Brand voice: ${brandVoice.join(', ')}` : `Voix de marque : ${brandVoice.join(', ')}`)
    : '';
  const ctaLine = ctaStyle
    ? (isEnglish || isBilingual ? `Preferred CTA style: ${ctaStyle}` : `Style de CTA préféré : ${ctaStyle}`)
    : '';

  const distributionEn = mode === 'week'
    ? 'Distribute across Monday, Wednesday, Friday and Saturday (4 posts).'
    : 'Distribute evenly across 4 weeks (3-4 posts per week for a total of 14).';

  const titleLangNote = isBilingual
    ? '\n- "title": catchy post idea title (max 80 chars) — alternate between French québécois and English across the plan'
    : isEnglish
    ? '\n- "title": catchy post idea title (max 80 chars, natural North American English)'
    : '\n- "title": titre accrocheur de l\'idée (max 80 caractères, français québécois)';

  const userPrompt = isEnglish || isBilingual
    ? `Create a ${count}-post plan for ${businessName}${location ? ` (${location})` : ''}.

Period: from ${startDate} to ${endDateStr}.
${distributionEn}
Alternate between "fb" and "ig".
Balance content types: formation, résultats clients, produit, engagement, éducatif, promo.
${audienceLine}
${servicesLine}
${priorityLine}
${brandVoiceLine}
${ctaLine}

Return ONLY a JSON array of exactly ${count} objects with these keys:
${titleLangNote}
- "content_type": exactly one of: "formation" | "résultats clients" | "produit" | "engagement" | "éducatif" | "promo"
- "service_focus": specific service to highlight (string or null)
- "objective": objective in one short sentence (string or null)
- "suggested_date": date in format "YYYY-MM-DD" between ${startDate} and ${endDateStr}
- "platform": "fb" or "ig"
- "requires_photo": true if a real photo is needed, false otherwise
- "tone": recommended tone, exactly one of: "chaleureux" | "énergique" | "professionnel"
- "cta": suggested call-to-action in one short sentence (string or null)`
    : `Crée un plan de ${count} publications pour ${businessName}${location ? ` (${location})` : ''}.

Période : du ${startDate} au ${endDateStr}.
${distribution}
Alterne entre "fb" et "ig".
Équilibre les types de contenu : formation, résultats clients, produit, engagement, éducatif, promo.
${audienceLine}
${servicesLine}
${priorityLine}
${brandVoiceLine}
${ctaLine}

Retourne UNIQUEMENT un tableau JSON de exactement ${count} objets avec ces clés :
- "title": titre accrocheur de l'idée (max 80 caractères, français québécois)
- "content_type": exactement un de : "formation" | "résultats clients" | "produit" | "engagement" | "éducatif" | "promo"
- "service_focus": service spécifique à mettre en avant (string ou null)
- "objective": objectif en une phrase courte (string ou null)
- "suggested_date": date au format "YYYY-MM-DD" entre ${startDate} et ${endDateStr}
- "platform": "fb" ou "ig"
- "requires_photo": true si une vraie photo est nécessaire, false sinon
- "tone": ton recommandé parmi exactement : "chaleureux" | "énergique" | "professionnel"
- "cta": appel à l'action suggéré en une phrase courte adaptée au style de la professionnelle (string ou null)`;

  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) return NextResponse.json({ error: 'Réponse invalide du modèle', raw: text }, { status: 500 });
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Format de réponse inattendu' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
