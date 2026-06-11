import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/plan-content/single — generate one fresh idea for a given type/platform/date
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
    .select('subscription_tier, subscription_status, business_name, target_audience, services, priority_services, brand_voice, cta_style')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profileData as any;
  const tier = (p?.subscription_tier ?? 'essentiel') as string;
  const status = (p?.subscription_status ?? 'trialing') as string;
  if (status !== 'trialing' && tier !== 'pro') {
    return NextResponse.json({ error: 'Plan Pro requis' }, { status: 403 });
  }

  let body: { content_type: string; platform: string; suggested_date: string; exclude_title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { content_type, platform, suggested_date, exclude_title } = body;
  if (!content_type || !platform || !suggested_date) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const businessName = ((p?.business_name as string | null)?.trim()) || 'votre clinique';
  const targetAudience = p?.target_audience as string | null;
  const services = p?.services as string[] | null;
  const priorityServices = p?.priority_services as string[] | null;
  const brandVoice = p?.brand_voice as string[] | null;
  const ctaStyle = p?.cta_style as string | null;

  const audienceLine = targetAudience ? `Clientèle cible : ${targetAudience}` : '';
  const servicesLine = services?.length ? `Services offerts : ${services.join(', ')}` : '';
  const priorityLine = priorityServices?.length ? `Services à prioriser : ${priorityServices.join(', ')}` : '';
  const brandVoiceLine = brandVoice?.length ? `Voix de marque : ${brandVoice.join(', ')}` : '';
  const ctaLine = ctaStyle ? `Style de CTA préféré : ${ctaStyle}` : '';
  const excludeLine = exclude_title ? `Évite de proposer une idée similaire à : "${exclude_title}"` : '';

  const systemPrompt = `Tu es un stratège de contenu pour des professionnels de la beauté au Québec.
Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.`;

  const userPrompt = `Génère UNE SEULE nouvelle idée de publication ${platform.toUpperCase()} de type "${content_type}" pour ${businessName}.
Date suggérée : ${suggested_date}.
${audienceLine}
${servicesLine}
${priorityLine}
${brandVoiceLine}
${ctaLine}
${excludeLine}

Retourne UNIQUEMENT un objet JSON avec ces clés :
- "title": titre accrocheur (max 80 caractères, français québécois)
- "content_type": exactement "${content_type}"
- "service_focus": service spécifique à mettre en avant (string ou null)
- "objective": objectif en une phrase courte (string ou null)
- "suggested_date": "${suggested_date}"
- "platform": "${platform}"
- "requires_photo": true si une vraie photo est nécessaire, false sinon
- "tone": ton recommandé parmi exactement : "chaleureux" | "énergique" | "professionnel"
- "cta": appel à l'action suggéré en une phrase courte (string ou null)`;

  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ error: 'Réponse invalide du modèle' }, { status: 500 });
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
