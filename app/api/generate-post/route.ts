import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTierLimits } from '@/lib/config/tier-limits';
import { PRICING } from '@/lib/config/pricing';
import { GeneratePostRequest } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ContentLanguage = 'fr_qc' | 'en' | 'bilingual';

interface BrandProfile {
  businessName: string;
  website: string | null;
  city: string | null;
  province: string | null;
  businessSummary: string | null;
  targetAudience: string | null;
  brandVoice: string[] | null;
  services: string[] | null;
  priorityServices: string[] | null;
  transformationGoals: string[] | null;
  brandExamples: string[] | null;
  favoritePhrases: string[] | null;
  avoidPhrases: string[] | null;
  ctaStyle: string | null;
  contentLanguage: ContentLanguage;
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
  const voices = p.brandVoice?.length
    ? p.brandVoice.map(v => VOICE_LABELS[v] ?? v).join(', ')
    : null;

  const lines: string[] = [];

  // ── Identity ──────────────────────────────────────────────────────────────
  lines.push(`Tu es le rédacteur de contenu officiel de ${p.businessName}${location ? `, basé à ${location}` : ''}${p.website ? ` (${p.website})` : ''}.`);
  lines.push('');
  lines.push('Ton seul rôle est de produire des publications qui ressemblent EXACTEMENT à cette entreprise. Deux entreprises différentes doivent donner deux contenus visuellement et stylistiquement distincts.');
  lines.push('');

  // ── Brand Profile ─────────────────────────────────────────────────────────
  lines.push('============================');
  lines.push('PROFIL DE L\'ENTREPRISE');
  lines.push('============================');
  lines.push('');
  if (p.businessSummary?.trim()) {
    lines.push(p.businessSummary.trim());
    lines.push('');
  }
  if (p.targetAudience?.trim()) {
    lines.push(`Clientèle cible : ${p.targetAudience.trim()}`);
  }
  if (voices) {
    lines.push(`Voix de marque : ${voices}`);
  }
  lines.push('');

  // ── Services ──────────────────────────────────────────────────────────────
  if (p.services?.length || p.priorityServices?.length) {
    lines.push('============================');
    lines.push('SERVICES');
    lines.push('============================');
    lines.push('');
    if (p.services?.length) {
      lines.push(`Tous les services : ${p.services.join(', ')}`);
    }
    if (p.priorityServices?.length) {
      lines.push('');
      lines.push('Services PRIORITAIRES — mentionne-les plus fréquemment que les autres :');
      p.priorityServices.forEach(s => lines.push(`  • ${s}`));
    }
    lines.push('');
  }

  // ── Transformation Goals ──────────────────────────────────────────────────
  lines.push('============================');
  lines.push('TRANSFORMATION ET RÉSULTATS');
  lines.push('============================');
  lines.push('');
  lines.push('Règle absolue : quand tu mentionnes un service, exprime toujours le bénéfice pour la cliente, jamais uniquement le service en soi.');
  lines.push('');
  lines.push('  À éviter : "Découvrez notre HydraFacial."');
  lines.push('  Correct   : "Retrouvez une peau plus lumineuse grâce à notre HydraFacial."');
  lines.push('');
  if (p.transformationGoals?.length) {
    lines.push('Résultats et transformations à mettre de l\'avant :');
    p.transformationGoals.forEach(g => lines.push(`  • ${g}`));
    lines.push('');
  }

  // ── Vocabulary ────────────────────────────────────────────────────────────
  lines.push('============================');
  lines.push('VOCABULAIRE ET STYLE');
  lines.push('============================');
  lines.push('');
  if (p.favoritePhrases?.length) {
    lines.push(`Expressions à intégrer naturellement dans le texte : ${p.favoritePhrases.join(', ')}`);
  }
  if (p.avoidPhrases?.length) {
    lines.push(`Mots et expressions à NE JAMAIS utiliser : ${p.avoidPhrases.join(', ')}`);
  }
  if (p.ctaStyle) {
    lines.push(`Style de CTA préféré : "${p.ctaStyle}" — utilise ce style dans chaque publication.`);
  } else {
    lines.push(`Ne termine PAS la publication avec un appel à l'action (CTA). Pas de "Réservez maintenant", "Contactez-nous" ou équivalent.`);
  }
  lines.push('');

  // ── Brand Examples (strongest influence) ─────────────────────────────────
  if (p.brandExamples?.length) {
    lines.push('============================');
    lines.push('EXEMPLES DE PUBLICATIONS RÉELLES — INFLUENCE LA PLUS FORTE');
    lines.push('============================');
    lines.push('');
    lines.push(`Ces publications ont été rédigées pour ${p.businessName}. Elles définissent :`);
    lines.push('  • Le vocabulaire exact utilisé');
    lines.push('  • La longueur et le rythme des phrases');
    lines.push('  • L\'usage des émojis (fréquence, type, placement)');
    lines.push('  • Le niveau de formalité et le ton');
    lines.push('  • La structure et le style des appels à l\'action');
    lines.push('');
    lines.push('Tes nouvelles publications doivent ressembler à ces exemples. C\'est la référence la plus importante.');
    lines.push('');
    p.brandExamples.forEach((ex, i) => {
      lines.push(`--- Exemple ${i + 1} ---`);
      lines.push(ex.trim());
      lines.push('');
    });
  }

  // ── Writing Rules ─────────────────────────────────────────────────────────
  lines.push('============================');
  lines.push('RÈGLES DE RÉDACTION');
  lines.push('============================');
  lines.push('');

  if (p.contentLanguage === 'fr_qc') {
    lines.push('- Écris toujours en français québécois naturel et authentique (pas du français européen)');
    lines.push('- Utilise des tournures typiquement québécoises, jamais du français international');
  } else if (p.contentLanguage === 'en') {
    lines.push('- Write exclusively in natural North American English');
    lines.push('- Avoid British or European English expressions');
    lines.push('- Use English hashtags relevant to the North American market');
  } else {
    // bilingual
    lines.push('- Generate TWO complete versions for EACH post (fb and ig)');
    lines.push('- First version: French québécois (natural, authentic, not European French)');
    lines.push('- Second version: North American English');
    lines.push('- Separate the two versions with exactly this separator on its own line: ── ── ──');
    lines.push('- Both versions must be complete standalone posts, not translations of each other');
  }

  lines.push('- N\'invente JAMAIS de statistiques, de chiffres précis, ni de faits non vérifiables');
  lines.push('- N\'utilise JAMAIS le tiret long (—) dans les textes');

  if (p.contentLanguage === 'fr_qc') {
    lines.push('- Pour Instagram : utilise exactement 8 hashtags pertinents pour le Québec et le domaine');
  } else if (p.contentLanguage === 'en') {
    lines.push('- For Instagram: use exactly 8 relevant hashtags for the North American market');
  } else {
    lines.push('- French Instagram version: 8 hashtags in French for Quebec market');
    lines.push('- English Instagram version: 8 hashtags in English for North American market');
  }

  lines.push('- Respecte STRICTEMENT les longueurs de texte demandées');
  lines.push('');

  if (p.contentLanguage === 'bilingual') {
    lines.push('FORMATAGE OBLIGATOIRE pour chaque version :');
    lines.push('- Facebook version FR : accroche → \\n\\n → corps → \\n\\n → CTA seul');
    lines.push('- Facebook version EN : hook → \\n\\n → body → \\n\\n → CTA alone');
    lines.push('- Instagram : texte → \\n\\n → hashtags sur une seule ligne');
    lines.push('- Sépare les deux versions par : ── ── ──');
  } else {
    lines.push('FORMATAGE OBLIGATOIRE — chaque paragraphe doit être séparé par une ligne vide (\\n\\n) :');
    lines.push('- Facebook : accroche → ligne vide → 1-3 paragraphes de corps → ligne vide → CTA seul sur sa propre ligne');
    lines.push('- Instagram : texte principal en 1-4 blocs courts → ligne vide → hashtags tous ensemble sur une seule ligne');
    lines.push('- Le CTA Facebook doit TOUJOURS être sur sa propre ligne, séparé du corps par une ligne vide');
  }

  lines.push('');
  lines.push('Format de réponse : retourne UNIQUEMENT un objet JSON valide avec exactement ces deux clés :');
  lines.push('{ "fb": "...", "ig": "..." }');
  lines.push('');
  lines.push('Dans les valeurs JSON, représente les sauts de paragraphe avec \\n\\n (deux backslash-n).');
  lines.push('Ne retourne rien d\'autre que le JSON.');

  return lines.join('\n');
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
    .select('subscription_tier, subscription_status, generations_used, trial_generations_used, business_name, website, service_description, city, province, target_audience, brand_voice, services, priority_services, transformation_goals, brand_examples, favorite_phrases, avoid_phrases, content_preferences, cta_style, content_language, created_at')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as any;
  const tier = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
  const status = profile?.subscription_status ?? 'trialing';
  const effectiveTier: 'essentiel' | 'pro' = status === 'trialing' ? 'pro' : tier;
  const generationsUsed = (profile?.generations_used ?? 0) as number;
  const trialGenerationsUsed = (profile?.trial_generations_used ?? 0) as number;
  const businessName = (profile?.business_name as string | null)?.trim() || 'ton entreprise';
  const businessWebsite = (profile?.website as string | null) ?? null;
  const serviceDescription = (profile?.service_description as string | null) ?? null;
  const city = (profile?.city as string | null) ?? null;
  const province = (profile?.province as string | null) ?? null;
  const targetAudience = (profile?.target_audience as string | null) ?? null;
  const brandVoice = (profile?.brand_voice as string[] | null) ?? null;
  const servicesList = (profile?.services as string[] | null) ?? null;
  const priorityServices = (profile?.priority_services as string[] | null) ?? null;
  const transformationGoals = (profile?.transformation_goals as string[] | null) ?? null;
  const brandExamples = (profile?.brand_examples as string[] | null) ?? null;
  const favoritePhrases = (profile?.favorite_phrases as string[] | null) ?? null;
  const avoidPhrases = (profile?.avoid_phrases as string[] | null) ?? null;
  const ctaStyle = (profile?.cta_style as string | null) ?? null;
  const contentLanguage = ((profile?.content_language as ContentLanguage | null) ?? 'fr_qc') as ContentLanguage;

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
      { error: 'Abonnement annulé. Renouvelez ton abonnement pour continuer.', code: 'CANCELED' },
      { status: 403 },
    );
  }

  // ── Trial limit ───────────────────────────────────────────────────────────
  const trialLimit = PRICING[tier].trialGenerations;
  if (status === 'trialing' && trialGenerationsUsed >= trialLimit) {
    return NextResponse.json(
      { error: `Limite d'essai atteinte. Activez ton abonnement pour continuer.`, code: 'TRIAL_LIMIT_REACHED' },
      { status: 402 },
    );
  }

  // ── Monthly limit (active subscriptions only) ─────────────────────────────
  const limits = getTierLimits(effectiveTier);
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

  const isBilingual = contentLanguage === 'bilingual';
  const isEnglish = contentLanguage === 'en';

  const toneLabels: Record<string, string> = isEnglish || isBilingual ? {
    chaleureux: 'warm and community-oriented',
    énergique: 'energetic and enthusiastic',
    professionnel: 'professional and expert',
  } : {
    chaleureux: 'chaleureux et proche de la communauté',
    énergique: 'énergique et enthousiaste',
    professionnel: 'professionnel et expert',
  };

  const contentLabels: Record<string, string> = isEnglish || isBilingual ? {
    formation: 'professional training / education',
    'résultats clients': 'client results and transformations',
    produit: 'product showcase',
    engagement: 'community engagement and interaction',
    éducatif: 'educational beauty content / tips',
    promo: 'special promotion or offer',
  } : {
    formation: 'formation / éducation professionnelle',
    'résultats clients': 'résultats et transformations de clients',
    produit: 'mise en valeur de produit',
    engagement: 'engagement et interaction avec la communauté',
    éducatif: 'contenu éducatif beauté / conseils',
    promo: 'promotion spéciale ou offre',
  };

  const spec = LENGTH_SPECS[length] ?? LENGTH_SPECS.moyen;

  const igInstruction = effectiveTier === 'essentiel'
    ? (isEnglish || isBilingual ? '- Instagram: return an empty string "" for the "ig" key.' : '- Instagram : retourne une chaîne vide "" pour la clé "ig".')
    : `- ${spec.ig}`;

  const bilingualNote = isBilingual
    ? '\n\nIMPORTANT — BILINGUAL MODE: For each platform (fb and ig), generate TWO complete versions separated by exactly this line: ── ── ──\nFirst the French québécois version, then the English North American version.'
    : '';

  const userPrompt = isBilingual
    ? `Create bilingual posts for ${businessName}.

Content type: ${contentLabels[contentType] ?? contentType}
Desired tone: ${toneLabels[tone] ?? tone}
Details / context:
${details || '(no additional details)'}

Required lengths:
- ${spec.fb}
${igInstruction}
${bilingualNote}

Return ONLY the JSON with keys "fb" and "ig". Each value must contain both versions separated by ── ── ──`
    : `${isEnglish ? 'Create' : 'Crée'} ${isEnglish ? 'two posts for' : 'deux publications pour'} ${businessName}.

${isEnglish ? 'Content type' : 'Type de contenu'} : ${contentLabels[contentType] ?? contentType}
${isEnglish ? 'Desired tone' : 'Ton souhaité'} : ${toneLabels[tone] ?? tone}
${isEnglish ? 'Details / context' : 'Détails / contexte fournis par l\'équipe'} :
${details || (isEnglish ? '(no additional details)' : '(aucun détail supplémentaire)')}

${isEnglish ? 'Required lengths' : 'Longueurs requises'} :
- ${spec.fb}
${igInstruction}

${isEnglish ? 'Return ONLY the JSON with keys "fb" and "ig".' : 'Rappel : retourne UNIQUEMENT le JSON avec les clés "fb" et "ig".'}`;

  const systemPrompt = buildSystemPrompt({
    businessName,
    website: businessWebsite,
    city,
    province,
    businessSummary: serviceDescription,
    targetAudience,
    brandVoice,
    services: servicesList,
    priorityServices,
    transformationGoals,
    brandExamples,
    favoritePhrases,
    avoidPhrases,
    ctaStyle,
    contentLanguage,
  });

  // Log the full prompt to the server console for debugging
  console.log('\n[Brand Brain] ── System Prompt ──────────────────────────────\n');
  console.log(systemPrompt);
  console.log('\n[Brand Brain] ── User Prompt ────────────────────────────────\n');
  console.log(userPrompt);
  console.log('\n[Brand Brain] ─────────────────────────────────────────────\n');

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: spec.maxTokens,
      system: systemPrompt,
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
    if (effectiveTier === 'pro' && limits.postHistory) {
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
