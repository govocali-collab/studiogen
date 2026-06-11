import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'StudioGen - Publications Facebook & Instagram pour professionnels de la beauté au Québec',
  description: 'StudioGen génère automatiquement tes publications Facebook et Instagram en français québécois. Conçu pour les professionnels de la beauté. Essai gratuit 7 jours, aucune carte requise.',
  alternates: {
    canonical: 'https://studiogen.ca',
  },
  openGraph: {
    title: 'Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux',
    description: 'StudioGen crée automatiquement des publications qui ressemblent à ton entreprise, sans Canva, sans agence et sans y passer tes soirées.',
    url: 'https://studiogen.ca',
    siteName: 'StudioGen',
    locale: 'fr_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux',
    description: 'StudioGen crée automatiquement des publications qui ressemblent à ton entreprise, sans Canva, sans agence et sans y passer tes soirées.',
  },
};

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'Rédaction IA en français québécois',
    desc: "L'IA génère du contenu authentique, adapté à ta clientèle locale. Ton ton, ta voix, tes expressions.",
    badge: null,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    title: 'Collages photo professionnels',
    desc: 'Crée des collages impeccables avec zoom, repositionnement et plusieurs mises en page optimisées.',
    badge: null,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    title: 'Formats optimisés pour chaque réseau',
    desc: 'Carré 1:1, Portrait 4:5, Paysage 16:9 et Story 9:16. Chaque format pixel-perfect, prêt à publier.',
    badge: null,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
    title: 'Gestion de logos et branding',
    desc: 'Ajoute ton logo sur chaque visuel. Position, taille et placement entièrement personnalisables.',
    badge: null,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    title: 'Modification manuelle du contenu',
    desc: "L'IA propose, tu décides. Modifie chaque publication directement avant de la copier.",
    badge: null,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3m-3 3.75h3" />
      </svg>
    ),
    title: 'Facebook + Instagram simultanément',
    desc: 'Génère les deux publications en un clic. Chaque plateforme a son format, sa longueur, ses hashtags.',
    badge: 'Pro',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Historique des publications',
    desc: "Retrouve toutes tes générations passées en un coup d'oeil. Réutilise, modifie, inspire-toi.",
    badge: 'Pro',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: 'Téléchargement JPG haute résolution',
    desc: 'Exporte tes visuels en 1080 px, prêts à être publiés directement sur toutes les plateformes.',
    badge: null,
  },
];

const painPoints = [
  {
    emoji: '⏰',
    title: 'Tu passes des heures sur ton contenu',
    desc: 'Chercher des idées, rédiger les textes, créer les visuels... tout ça pour 3 publications par semaine. Tu as mieux à faire.',
  },
  {
    emoji: '💸',
    title: "L'agence coûte trop cher",
    desc: "300 $ à 800 $ par mois pour de la gestion de réseaux sociaux ? Pour une clinique indépendante, c'est souvent injustifiable.",
  },
  {
    emoji: '😩',
    title: "Canva, c'est pas fait pour toi",
    desc: "Des dizaines de templates génériques, du texte à écrire soi-même, aucune compréhension du secteur beauté. Résultat : contenu banal.",
  },
];

const comparisonRows = [
  { label: 'Trouver des idées', studioGen: 'Automatique', manual: '30 à 60 min' },
  { label: 'Rédiger les textes', studioGen: 'Automatique', manual: '30 à 60 min' },
  { label: 'Créer les visuels', studioGen: 'Automatique', manual: '1 à 2 heures' },
  { label: 'Adapter pour Facebook', studioGen: 'Automatique', manual: '15 à 30 min' },
  { label: 'Adapter pour Instagram', studioGen: 'Automatique', manual: '15 à 30 min' },
  { label: 'Temps total', studioGen: '2 à 5 minutes', manual: '3 à 5 heures' },
];

const howItSavesTime = [
  { num: '01', title: 'Ajoute tes photos', desc: 'Photos de résultats, produits, formations ou réalisations.' },
  { num: '02', title: 'StudioGen comprend ton entreprise', desc: 'Ton ton, tes services, ta clientèle et ta région.' },
  { num: '03', title: 'Génère ton contenu', desc: 'Visuel + texte en français québécois adaptés à ton entreprise.' },
  { num: '04', title: 'Publie', desc: 'Télécharge et publie en quelques minutes.' },
];

const steps = [
  { num: '01', title: 'Importe tes photos', desc: "Glisse-dépose tes photos de résultats, produits ou formations directement dans le studio." },
  { num: '02', title: 'Décris ton contenu', desc: "Choisis le type de publication, le ton et ajoute quelques détails. L'IA fait le reste." },
  { num: '03', title: 'Télécharge et publie', desc: 'Copie tes textes, télécharge ton visuel JPG. Prêt à publier en moins de 2 minutes.' },
];

const quebecAdvantages = [
  { icon: '✓', title: 'Français québécois naturel', desc: 'Expressions, ton et style authentiquement québécois.' },
  { icon: '✓', title: 'Comprend ton secteur', desc: 'Esthétique, médico-esthétique, soins, beauté et bien-être.' },
  { icon: '✓', title: "S'adapte à ton ton", desc: "Ton profil IA apprend ta voix, tes services et ta clientèle." },
  { icon: '✓', title: 'Conçu pour le marché local', desc: 'Pensé pour les professionnels de la beauté du Québec.' },
];

const faqs = [
  {
    q: 'Est-ce que je dois avoir des compétences en design ou en rédaction ?',
    a: "Non, aucune. StudioGen gère le design et les textes automatiquement. Tu importes tes photos, tu choisis ton type de publication, et l'IA s'occupe du reste.",
  },
  {
    q: 'En combien de temps je peux créer et publier un post ?',
    a: "En moins de 2 minutes. Importe tes photos, génère ton contenu, télécharge le visuel JPG et copie ton texte. Terminé.",
  },
  {
    q: 'Quelle est la différence entre le plan Essentiel et le plan Pro ?',
    a: "Essentiel inclut 50 posts par mois avec accès complet à toutes les fonctionnalités. Pro offre 150 posts par mois avec priorité de support.",
  },
  {
    q: 'Puis-je annuler mon abonnement en tout temps ?',
    a: "Oui, sans pénalité ni frais cachés. Tu peux annuler depuis la page Abonnement à n'importe quel moment. Ton accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: 'Mes photos et mon contenu sont-ils confidentiels ?',
    a: "Oui. Tes photos et tes publications restent privées. Elles ne sont jamais partagées ni utilisées pour entraîner des modèles d'IA.",
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'StudioGen',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://studiogen.ca',
  description: 'Générateur de publications Facebook et Instagram pour professionnels de la beauté au Québec. Montages photo automatiques et textes rédigés par IA en français québécois.',
  offers: [
    { '@type': 'Offer', name: 'Essentiel', price: '57', priceCurrency: 'CAD', billingIncrement: 'P1M' },
    { '@type': 'Offer', name: 'Pro', price: '127', priceCurrency: 'CAD', billingIncrement: 'P1M' },
  ],
  publisher: { '@type': 'Organization', name: 'Astrova', url: 'https://astrova.ca' },
};

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isActive = !!session?.user;
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/logo-black.png" alt="StudioGen" width={200} height={40} className="h-10 w-auto" priority />
          <div className="flex items-center gap-3">
            {isActive ? (
              <Link href="/studio" className="text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-colors">
                Accéder au studio →
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:inline text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5">
                  Connexion
                </Link>
                <Link href="/auth/signup" className="hidden sm:inline text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-colors">
                  Essai gratuit →
                </Link>
                <Link href="/auth/login" className="sm:hidden text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-colors">
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-100 rounded-full blur-[120px] opacity-40" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-fuchsia-100 rounded-full blur-[100px] opacity-30" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-pink-100 rounded-full blur-[130px] opacity-30" />
        </div>
        <div className="absolute inset-0 pointer-events-none sm:hidden" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #fff0f6 50%, #fff 100%)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 max-w-full">
            <Image src="/fav.png" alt="" width={16} height={16} className="w-4 h-4 rounded-sm flex-shrink-0" />
            <span className="truncate sm:whitespace-normal">Propulsé par Astrova · Pour les professionnels de la beauté du Québec</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Récupère jusqu'à
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              10 heures par semaine
            </span>
            <br />
            sur tes réseaux sociaux.
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            StudioGen crée automatiquement des publications qui ressemblent à ton entreprise, sans Canva, sans agence et sans y passer tes soirées.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isActive ? (
              <Link
                href="/studio"
                className="w-full sm:w-auto text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-violet-200"
              >
                Accéder au studio →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="w-full sm:w-auto text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-violet-200"
                >
                  Créer mes 7 premières publications gratuitement
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto text-base font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-8 py-3.5 rounded-2xl transition-colors"
                >
                  J'ai déjà un compte
                </Link>
              </>
            )}
          </div>

          {!isActive && <p className="text-xs text-gray-500 mt-4">Aucune carte de crédit requise · Annulation en tout temps</p>}
        </div>

        {/* App preview mockup */}
        <div className="relative max-w-5xl mx-auto mt-16 hidden sm:block">
          <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100 border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-400">
                app.studiogen.ca/studio
              </div>
            </div>
            <div className="bg-gray-50 p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Format</div>
                    <div className="flex gap-1.5">
                      {['1:1','4:5','16:9'].map((f, i) => (
                        <div key={f} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium text-center ${i === 0 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{f}</div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Mise en page</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-10 rounded-lg ${i === 0 ? 'bg-violet-600' : 'bg-gray-100'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Photos</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['bg-violet-200','bg-fuchsia-200','bg-pink-200'].map((c) => (
                        <div key={c} className={`${c} rounded-lg h-12`} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-3 aspect-square flex items-center justify-center">
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-violet-200 via-fuchsia-100 to-pink-200" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Publication IA</div>
                  <div className="space-y-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-2 rounded bg-gray-100 ${i === 4 ? 'w-2/3' : 'w-full'}`} />
                    ))}
                  </div>
                  <div className="pt-1 space-y-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`h-2 rounded bg-gray-100 ${i === 2 ? 'w-1/2' : 'w-full'}`} />
                    ))}
                  </div>
                  <div className="pt-2">
                    <div className="bg-violet-600 rounded-lg py-2 text-[10px] text-white font-semibold text-center">
                      ⚡ Générer le contenu
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment StudioGen te fait gagner du temps ─────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Simple et rapide</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Comment StudioGen te fait gagner du temps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItSavesTime.map((s) => (
              <div key={s.num} className="relative">
                <div className="text-5xl font-black text-violet-100 mb-4 leading-none">{s.num}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain ─────────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div className="absolute -top-20 right-0 w-[450px] h-[450px] bg-pink-100 rounded-full blur-[120px] opacity-20" />
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tu te reconnais là-dedans ?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              La plupart des professionnels de la beauté vivent les mêmes frustrations. StudioGen a été conçu pour les éliminer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div key={p.title} className="rounded-2xl border border-red-100 bg-red-50 p-6">
                <div className="text-3xl mb-4">{p.emoji}</div>
                <h3 className="text-sm font-bold text-red-800 mb-2">{p.title}</h3>
                <p className="text-sm text-red-700/80 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Québec ───────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fdf4ff 50%, #fff5f7 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Fait pour le Québec</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Conçu pour les professionnels de la beauté du Québec
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Esthétique, médico-esthétique, soins, coiffure, PMU, cils... StudioGen comprend ton secteur et parle la même langue que ta clientèle.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quebecAdvantages.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl border border-violet-100 p-6 hover:shadow-md hover:border-violet-200 transition-all">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-base mb-4">
                  {a.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-pink-100 rounded-full blur-[140px] opacity-20" />
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Fonctionnalités</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tout ce qu'il te faut pour briller en ligne
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              StudioGen combine création visuelle et rédaction IA dans un seul outil pensé pour les professionnels de la beauté.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-violet-200 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    {f.icon}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Comment ça marche</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Prêt à publier en moins de 2 minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <div className="text-5xl font-black text-violet-100 mb-4 leading-none">{s.num}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Comparaison</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              StudioGen vs le faire soi-même
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Chaque publication créée manuellement te coûte entre 30 minutes et 2 heures. StudioGen fait tout en quelques minutes.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest border-b border-gray-100">
              <div className="py-3 sm:py-4 px-3 sm:px-4 text-left text-gray-500">Tâche</div>
              <div className="py-3 sm:py-4 px-3 sm:px-4 bg-violet-600 text-white">StudioGen</div>
              <div className="py-3 sm:py-4 px-3 sm:px-4 text-gray-500">Faire soi-même</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 text-center text-xs sm:text-sm items-center ${i < comparisonRows.length - 1 ? 'border-b border-gray-100' : ''} ${i === comparisonRows.length - 1 ? 'font-semibold' : ''}`}
              >
                <div className="py-3 sm:py-3.5 px-3 sm:px-4 text-left text-gray-600 leading-snug">{row.label}</div>
                <div className="py-3 sm:py-3.5 px-3 sm:px-4 bg-violet-50 text-violet-700 font-semibold">
                  {row.studioGen}
                </div>
                <div className="py-3 sm:py-3.5 px-3 sm:px-4 text-gray-400">
                  {row.manual}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff 0%, #fff5f7 50%, #fff 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Témoignages</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Ce que disent nos clientes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-pink-50/70 rounded-2xl border border-pink-100 p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                "Avant StudioGen, je passais mon dimanche soir à préparer mes publications. Maintenant, je crée ma semaine de contenu en moins de 15 minutes."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-200 flex items-center justify-center text-sm font-bold text-violet-700">M</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Marie-Pier T.</div>
                  <div className="text-xs text-gray-500">Clinique esthétique, Sherbrooke</div>
                </div>
              </div>
            </div>
            <div className="bg-pink-50/70 rounded-2xl border border-pink-100 p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                "Le contenu ressemble enfin à notre clinique. Je n'ai plus besoin de passer par Canva ou une agence."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-fuchsia-200 flex items-center justify-center text-sm font-bold text-fuchsia-700">S</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Stéphanie B.</div>
                  <div className="text-xs text-gray-500">Clinique esthétique, Québec</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50" id="tarifs">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Tarifs</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple et transparent
            </h2>
            <p className="text-gray-500">7 jours d'essai gratuit · Aucune carte requise · Annulation en tout temps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl gap-6 mx-auto">
            {/* Essentiel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
              <div className="text-xl font-bold text-gray-800 mb-1">Essentiel</div>
              <div className="text-sm text-gray-400 mb-4">Parfait pour les travailleurs autonomes</div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black text-gray-900">57 $</span>
                <span className="text-gray-500 mb-1">CA / mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['50 posts / mois', 'Accès complet à toutes les fonctionnalités', 'Toutes les mises en page', 'Facebook + Instagram simultanément', 'Logos illimités', 'Montages photo automatiques (JPG 1080px)'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-violet-400 hover:text-violet-600 transition-colors mt-auto">
                Démarrer l'essai →
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-fuchsia-950 to-violet-950 rounded-2xl border border-fuchsia-900/40 p-8 relative overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Recommandé
              </div>
              <div className="text-xl font-bold text-gray-300 mb-1">Pro</div>
              <div className="text-sm text-gray-500 mb-4">Parfait pour les cliniques et professionnels actifs</div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black text-white">127 $</span>
                <span className="text-gray-400 mb-1">CA / mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['150 posts / mois', 'Accès complet à toutes les fonctionnalités', 'Toutes les mises en page', 'Facebook + Instagram simultanément', 'Logos illimités', 'Montages photo automatiques (JPG 1080px)', 'Priorité de support'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              {isActive ? (
                <Link href="/billing" className="block w-full text-center py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-900/50 mt-auto">
                  Passer au Pro →
                </Link>
              ) : (
                <Link href="/auth/signup" className="block w-full text-center py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-900/50 mt-auto">
                  Démarrer l'essai →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div className="absolute top-1/2 -translate-y-1/2 -left-20 w-[400px] h-[400px] bg-pink-100 rounded-full blur-[120px] opacity-15" />
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">FAQ</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-sm text-gray-900 hover:text-violet-700 transition-colors">
                  {item.q}
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden" style={{ background: 'linear-gradient(160deg, #fff 0%, #fff0f4 40%, #fdf4ff 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image src="/fav.png" alt="StudioGen" width={56} height={56} className="w-14 h-14 rounded-2xl shadow-lg shadow-violet-200" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Prêt à transformer ta présence en ligne ?
          </h2>
          <p className="text-gray-500 mb-8">
            Rejoins les professionnels de la beauté qui publient du contenu professionnel chaque semaine, sans agence, sans stress.
          </p>
          {isActive ? (
            <Link href="/studio" className="inline-flex items-center gap-2 text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-2xl transition-colors shadow-xl shadow-violet-200">
              Accéder au studio
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-2xl transition-colors shadow-xl shadow-violet-200">
                Créer mes 7 premières publications gratuitement
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="text-xs text-gray-500 mt-3">Aucune carte de crédit requise · Annulation en tout temps</p>
            </>
          )}
        </div>
      </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-gradient-to-br from-fuchsia-950 via-violet-950 to-fuchsia-950 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo-white.png" alt="StudioGen" width={180} height={36} className="h-9 w-auto" />
            <span className="text-gray-500 text-sm">par Astrova</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/auth/login" className="hover:text-gray-300 transition-colors">Connexion</Link>
            <Link href="/auth/signup" className="hover:text-gray-300 transition-colors">S'inscrire</Link>
            <Link href="#tarifs" className="hover:text-gray-300 transition-colors">Tarifs</Link>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/politique-confidentialite" className="hover:text-gray-400 transition-colors">Confidentialite</Link>
            <Link href="/conditions-utilisation" className="hover:text-gray-400 transition-colors">Conditions</Link>
            <span>© {new Date().getFullYear()} Astrova.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
