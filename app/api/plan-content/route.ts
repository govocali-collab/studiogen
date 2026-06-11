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
    .select('subscription_tier, subscription_status, business_name, city, province, target_audience, services, priority_services')
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

  const systemPrompt = `Tu es un stratège de contenu pour des professionnels de la beauté au Québec.
Tu crées des plans de contenu équilibrés et stratégiques pour Facebook et Instagram.
Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte avant ou après.`;

  const servicesLine = services?.length ? `Services offerts : ${services.join(', ')}` : '';
  const priorityLine = priorityServices?.length ? `Services à prioriser : ${priorityServices.join(', ')}` : '';
  const audienceLine = targetAudience ? `Clientèle cible : ${targetAudience}` : '';

  const userPrompt = `Crée un plan de ${count} publications pour ${businessName}${location ? ` (${location})` : ''}.

Période : du ${startDate} au ${endDateStr}.
${distribution}
Alterne entre "fb" et "ig".
Équilibre les types de contenu : formation, résultats clients, produit, engagement, éducatif, promo.
${audienceLine}
${servicesLine}
${priorityLine}

Retourne UNIQUEMENT un tableau JSON de exactement ${count} objets avec ces clés :
- "title": titre accrocheur de l'idée (max 80 caractères, français québécois)
- "content_type": exactement un de : "formation" | "résultats clients" | "produit" | "engagement" | "éducatif" | "promo"
- "service_focus": service spécifique à mettre en avant (string ou null)
- "objective": objectif en une phrase courte (string ou null)
- "suggested_date": date au format "YYYY-MM-DD" entre ${startDate} et ${endDateStr}
- "platform": "fb" ou "ig"
- "requires_photo": true si une vraie photo est nécessaire, false sinon`;

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
