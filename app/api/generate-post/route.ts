import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTierLimits } from '@/lib/config/tier-limits';
import { PRICING } from '@/lib/config/pricing';
import { GeneratePostRequest } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface BrandProfile {
  businessName: string;
  website: string | null;
  city: string | null;
  province: string | null;
  businessSummary: string | null;
  targetAudience: string | null;
  brandVoice: string[] | null;
  services: string[] | null;
  favoritePhrases: string[] | null;
  avoidPhrases: string[] | null;
  ctaStyle: string | null;
}

const VOICE_LABELS: Record<string, string> = {
  chaleureux: 'chaleureux et proche',
  professionnel: 'professionnel et expert',
  luxueux: 'luxueux et exclusif',
  moderne: 'moderne et dynamique',
  éducatif: 'éducatif et informatif',
  inspirant: 'inspirant et motivant',
  familial: 'familial et accessible',
  haut_de_gamme: 'haut de gamme et raffiné',
};

function buildSystemPrompt(p: BrandProfile): string {
  const location = [p.city, p.province].filter(Boolean).join(', ');
  let prompt = `Tu es le rédacteur de contenu officiel de ${p.businessName}`;
  if (location) prompt += `, basé à ${location}`;
  if (p.website) prompt += ` (${p.website})`;
  prompt += '.\n';

  if (p.businessSummary?.trim()) {
    prompt += `\nDescription de l'entreprise :\n${p.businessSummary.trim()}\n`;
  }
  if (p.targetAudience?.trim()) {
    prompt += `\nClientèle cible : ${p.targetAudience.trim()}\n`;
  }
  if (p.brandVoice?.length) {
    const voices = p.brandVoice.map(v => VOICE_LABELS[v] ?? v).join(', ');
    prompt += `\nVoix de marque : ${voices}\n`;
  }
  if (p.services?.length) {
    prompt += `\nServices offerts : ${p.services.join(', ')}\n`;
  }
  if (p.favoritePhrases?.length) {
    prompt += `\nExpressions à utiliser naturellement : ${p.favoritePhrases.join(', ')}\n`;
  }
  if (p.avoidPhrases?.length) {
    prompt += `\nMots et expressions à ÉVITER absolument : ${p.avoidPhrases.join(', ')}\n`;
  }
  if (p.ctaStyle) {
    prompt += `\nAppel à l'action préféré : "${p.ctaStyle}"\n`;
  }

  prompt += `
Directives importantes :
- Écris toujours en français québécois naturel et authentique (pas du français européen)
- N'invente JAMAIS de statistiques, de chiffres précis, ni de faits non vérifiables
- Utilise les expressions favorites naturellement dans le texte
- N'utilise JAMAIS les mots/expressions à éviter
- Utilise le style de CTA préféré dans chaque publication
- Le contenu doit refléter exactement l'identité et les valeurs de ${p.businessName}
- Utilise des expressions québécoises naturelles
- Pour Instagram, utilise exactement 8 hashtags pertinents pour le Québec et le domaine de l'entreprise
- Respecte STRICTEMENT les longueurs de texte demandées

FORMATAGE OBLIGATOIRE — chaque paragraphe doit être séparé par une ligne vide (\\n\\n) :
- Facebook : accroche → ligne vide → 1-3 paragraphes de corps → ligne vide → CTA seul sur sa propre ligne
- Instagram : texte principal en 1-4 blocs courts → ligne vide → hashtags tous ensemble sur une seule ligne
- Le CTA Facebook doit TOUJOURS être sur sa propre ligne, séparé du corps par une ligne vide
- Ne jamais coller deux paragraphes ensemble sans ligne vide entre eux
- N'utilise JAMAIS le tiret long (—) dans les textes

Format de réponse : retourne UNIQUEMENT un objet JSON valide avec exactement ces deux clés :
{ "fb": "...", "ig": "..." }

Dans les valeurs JSON, représente les sauts de paragraphe avec \\n\\n (deux backslash-n).
Ne retourne rien d'autre que le JSON.`;

  return prompt;
}

const LENGTH_SPECS: Record<string, { fb: string; ig: string; maxTokens: number }> = {
  court: {
    fb: 'Facebook COURT : 60-90 mots. Structure : accroche (1 phrase) + \\n\\n + corps (1-2 phrases) + \\n\\n + CTA (1 phrase seule).',
    ig: 'Instagram COURT : accroche percutante (1-2 phrases) + \\n\\n + exactement 8 hashtags sur une seule ligne.',
    maxTokens: 512,
  },
  moyen: {
    fb: 'Facebook MOYEN : 150-220 mots. Structure : accroche + \\n\\n + paragraphe 1 + \\n\\n + paragraphe 2 + \\n\\n + CTA seul. Chaque section séparée par une ligne vide.',
    ig: 'Instagram MOYEN : 2-3 blocs courts (1-2 phrases chacun) séparés par \\n\\n + \\n\\n + exactement 8 hashtags sur une seule ligne.',
    maxTokens: 900,
  },
  long: {
    fb: 'Facebook LONG : 300-400 mots. Structure : accroche + \\n\\n + paragraphe 1 + \\n\\n + paragraphe 2 + \\n\\n + paragraphe 3 + \\n\\n + CTA fort seul. Storytelling, chaque paragraphe séparé par une ligne vide.',
    ig: 'Instagram LONG : 4-5 blocs narratifs courts séparés par \\n\\n + \\n\\n + exactement 8 hashtags sur une seule ligne.',
    maxTokens: 1400,
  },
};

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Clé API Anthropic manquante. Configurez ANTHROPIC_API_KEY dans .env.local' },
      { status: 500 },
    );
  }

  // ── Auth check ───────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // ── Load profile ─────────────────────────────────────────────────────────
  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from('profiles')
    .select('subscription_tier, subscription_status, generations_used, trial_generations_used, business_name, website, service_description, city, province, target_audience, brand_voice, services, favorite_phrases, avoid_phrases, content_preferences, cta_style, created_at')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as any;
  const tier = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
  const status = profile?.subscription_status ?? 'trialing';
  const generationsUsed = (profile?.generations_used ?? 0) as number;
  const trialGenerationsUsed = (profile?.trial_generations_used ?? 0) as number;
  const businessName = (profile?.business_name as string | null)?.trim() || 'votre entreprise';
  const businessWebsite = (profile?.website as string | null) ?? null;
  const serviceDescription = (profile?.service_description as string | null) ?? null;
  const city = (profile?.city as string | null) ?? null;
  const province = (profile?.province as string | null) ?? null;
  const targetAudience = (profile?.target_audience as string | null) ?? null;
  const brandVoice = (profile?.brand_voice as string[] | null) ?? null;
  const servicesList = (profile?.services as string[] | null) ?? null;
  const favoritePhrases = (profile?.favorite_phrases as string[] | null) ?? null;
  const avoidPhrases = (profile?.avoid_phrases as string[] | null) ?? null;
  const ctaStyle = (profile?.cta_style as string | null) ?? null;

  // ── Trial expiration (7 days from account creation) ──────────────────────
  if (status === 'trialing' && profile?.created_at) {
    const trialEnd = new Date(new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
    if (new Date() > trialEnd) {
      return NextResponse.json(
        { error: "Ton essai gratuit de 7 jours est terminé. Active ton abonnement pour continuer.", code: 'TRIAL_EXPIRED' },
        { status: 402 },
      );
    }
  }

  // ── Subscription gate: canceled accounts can't generate ──────────────────
  if (status === 'canceled') {
    return NextResponse.json(
      { error: 'Abonnement annulé. Renouvelez votre abonnement pour continuer.', code: 'CANCELED' },
      { status: 403 },
    );
  }

  // ── Trial limit ───────────────────────────────────────────────────────────
  const trialLimit = PRICING[tier].trialGenerations;
  if (status === 'trialing' && trialGenerationsUsed >= trialLimit) {
    return NextResponse.json(
      { error: `Limite d'essai atteinte. Activez votre abonnement pour continuer.`, code: 'TRIAL_LIMIT_REACHED' },
      { status: 402 },
    );
  }

  // ── Monthly limit (active subscriptions only) ─────────────────────────────
  const limits = getTierLimits(tier);

  if (status === 'active' && generationsUsed >= limits.generationsPerMonth) {
    const msg = tier === 'essentiel'
      ? `Limite atteinte : ${limits.generationsPerMonth} générations par mois pour le plan Essentiel. Passez au plan Pro pour continuer.`
      : `Limite atteinte : ${limits.generationsPerMonth} générations par mois pour le plan Pro.`;
    return NextResponse.json({ error: msg, code: 'LIMIT_REACHED' }, { status: 403 });
  }

  // ── Parse request body ────────────────────────────────────────────────────
  let body: GeneratePostRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { contentType, tone, details, length = 'moyen' } = body;
  if (!contentType || !tone) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const toneLabels: Record<string, string> = {
    chaleureux: 'chaleureux et proche de la communauté',
    énergique: 'énergique et enthousiaste',
    professionnel: 'professionnel et expert',
  };

  const contentLabels: Record<string, string> = {
    formation: 'formation / éducation professionnelle',
    'résultats clients': 'résultats et transformations de clients',
    produit: 'mise en valeur de produit',
    engagement: 'engagement et interaction avec la communauté',
    éducatif: 'contenu éducatif beauté / conseils',
    promo: 'promotion spéciale ou offre',
  };

  const spec = LENGTH_SPECS[length] ?? LENGTH_SPECS.moyen;

  // Essentiel only gets Facebook
  const igInstruction = tier === 'essentiel'
    ? '- Instagram : retourne une chaîne vide "" pour la clé "ig".'
    : `- ${spec.ig}`;

  const userPrompt = `Crée deux publications pour ${businessName}.

Type de contenu : ${contentLabels[contentType] ?? contentType}
Ton souhaité : ${toneLabels[tone] ?? tone}
Détails / contexte fournis par l'équipe :
${details || '(aucun détail supplémentaire)'}

Longueurs requises :
- ${spec.fb}
${igInstruction}

Rappel : retourne UNIQUEMENT le JSON avec les clés "fb" et "ig".`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: spec.maxTokens,
      system: buildSystemPrompt({
        businessName,
        website: businessWebsite,
        city,
        province,
        businessSummary: serviceDescription,
        targetAudience,
        brandVoice,
        services: servicesList,
        favoritePhrases,
        avoidPhrases,
        ctaStyle,
      }),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: { fb: string; ig: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: 'Réponse invalide du modèle', raw: text }, { status: 500 });
      }
      parsed = JSON.parse(match[0]);
    }

    // ── Increment generation counter ────────────────────────────────────────
    const newTrialUsed = trialGenerationsUsed + 1;
    const newUsed = generationsUsed + 1;
    if (status === 'trialing') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await admin.from('profiles').update({ trial_generations_used: newTrialUsed } as any).eq('id', user.id);
      if (updateError) console.error('[generate-post] trial counter update failed:', updateError);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await admin.from('profiles').update({ generations_used: newUsed } as any).eq('id', user.id);
      if (updateError) console.error('[generate-post] counter update failed:', updateError);
    }

    // ── Save to history (Pro only) ───────────────────────────────────────────
    if (tier === 'pro' && limits.postHistory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await admin.from('post_history').insert({
        user_id: user.id,
        fb_content: parsed.fb,
        ig_content: parsed.ig || null,
        content_type: contentType,
        tone,
        length,
        details: details || null,
      } as any);
    }

    return NextResponse.json({
      ...parsed,
      tier,
      generations_used: status === 'trialing' ? trialGenerationsUsed : newUsed,
      trial_generations_used: status === 'trialing' ? newTrialUsed : trialGenerationsUsed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
