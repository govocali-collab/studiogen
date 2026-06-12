import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'StudioGen — Le système de contenu IA pour les professionnels de la beauté du Québec',
  description:
    'StudioGen génère automatiquement tes publications Facebook et Instagram en français québécois grâce à ton ADN de marque IA. Économisez 10 h/semaine. Essai gratuit 7 jours, aucune carte requise.',
  keywords: [
    'publications réseaux sociaux Québec',
    'intelligence artificielle marketing beauté',
    'contenu Facebook Instagram esthéticienne',
    'ADN de marque IA',
    'planification contenu automatique',
    'logiciel marketing salon beauté Québec',
  ],
  alternates: {
    canonical: 'https://studiogen.ca',
  },
  openGraph: {
    title: 'Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux',
    description:
      'StudioGen génère tes publications Facebook et Instagram en moins de 2 minutes grâce à ton ADN de marque IA. Conçu pour les professionnels de la beauté du Québec.',
    url: 'https://studiogen.ca',
    siteName: 'StudioGen',
    locale: 'fr_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux',
    description:
      'StudioGen génère tes publications Facebook et Instagram en moins de 2 minutes grâce à ton ADN de marque IA. Conçu pour les professionnels de la beauté du Québec.',
  },
};

const adnItems = [
  'Services offerts',
  'Services prioritaires',
  'Clientèle cible',
  'Ton de marque',
  'Expressions favorites',
  'Publications exemples',
  'Objectifs de transformation',
];

const painPoints = [
  {
    emoji: '🤯',
    title: 'Tu ne sais jamais quoi publier',
    desc: 'Trouver de nouvelles idées chaque semaine devient épuisant.',
  },
  {
    emoji: '💸',
    title: 'Les agences coûtent trop cher',
    desc: '300 $ à 800 $ par mois pour gérer les réseaux sociaux d\'une entreprise beauté.',
  },
  {
    emoji: '😩',
    title: 'Canva ne fait pas le travail à ta place',
    desc: 'Les modèles sont beaux, mais il faut encore trouver les idées, écrire les textes et planifier les publications.',
  },
];

const comparisonRows = [
  { label: 'Idées de contenu automatiques',               sg: true,  canva: false },
  { label: 'Planification mensuelle IA',                  sg: true,  canva: false },
  { label: 'ADN de marque IA',                            sg: true,  canva: false },
  { label: 'Conçu pour les professionnels de la beauté',  sg: true,  canva: false },
  { label: 'Calendrier marketing intégré',                sg: true,  canva: false },
  { label: 'Création rapide à partir de photos',          sg: true,  canva: true  },
];

const steps = [
  { num: '01', title: 'Complétez ton ADN de marque IA', desc: 'StudioGen apprend ton entreprise, ta clientèle et ta façon de communiquer.' },
  { num: '02', title: 'Planifiez ton contenu',          desc: "L'IA suggère automatiquement des idées adaptées à tes services et à tes objectifs." },
  { num: '03', title: 'Ajoutez tes photos et générez',    desc: 'StudioGen rédige le texte et adapte le contenu à ta marque.' },
];

const quebecAdvantages = [
  { icon: '✓', title: 'Français québécois naturel',       desc: 'Expressions, ton et style authentiquement québécois.' },
  { icon: '✓', title: 'Comprend ton secteur',           desc: 'Esthétique, soins, coiffure, PMU, cils, ongles, spas et plus.' },
  { icon: '✓', title: "S'adapte à ton style",             desc: "Ton ADN de marque IA apprend ta voix, tes services et ta clientèle." },
  { icon: '✓', title: 'Conçu pour le marché local',       desc: 'Pensé pour les professionnels de la beauté du Québec.' },
];

const aiPlanningSchedule = [
  { day: 'Lundi',    type: 'Éducatif' },
  { day: 'Mercredi', type: 'Résultat' },
  { day: 'Vendredi', type: 'Promotion' },
  { day: 'Dimanche', type: 'Engagement' },
];

const faqs = [
  {
    q: 'À qui s\'adresse StudioGen ?',
    a: 'StudioGen est conçu pour les professionnels de la beauté du Québec : esthétique, médico-esthétique, coiffure, PMU, extensions de cils, ongles, spas et soins spécialisés.',
  },
  {
    q: 'Qu\'est-ce que l\'ADN de marque IA ?',
    a: 'L\'ADN de marque IA permet à StudioGen de comprendre ton entreprise, ta clientèle, ton ton et ton style afin de créer un contenu beaucoup plus personnalisé.',
  },
  {
    q: 'Pourquoi le plan Pro produit-il de meilleurs résultats ?',
    a: 'Le plan Pro utilise ton ADN de marque IA pour planifier automatiquement ton contenu et suggérer quoi publier chaque semaine ou chaque mois.',
  },
  {
    q: 'Que se passe-t-il après mon essai gratuit ?',
    a: 'Tu conserves ton compte et choisissez ensuite le forfait qui convient à tes besoins.',
  },
  {
    q: 'Puis-je créer du contenu en anglais ?',
    a: 'Oui. StudioGen peut générer du contenu en français québécois, en anglais ou dans les deux langues selon ta clientèle. Tu choisis la langue dans tes paramètres ADN de marque IA.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const softwareLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'StudioGen',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Social Media Marketing',
  operatingSystem: 'Web, iOS, Android',
  url: 'https://studiogen.ca',
  inLanguage: 'fr-CA',
  description:
    'Le système de contenu IA conçu pour les professionnels de la beauté du Québec. Planification automatique, ADN de marque IA, publications Facebook et Instagram en français québécois.',
  featureList: [
    'ADN de marque IA personnalisé',
    'Génération de publications Facebook et Instagram',
    'Calendrier de contenu mensuel',
    'Planification automatique IA (semaine / mois)',
    'Collages photo professionnels',
    'Rédaction en français québécois',
  ],
  availableOnDevice: 'Desktop, Mobile',
  areaServed: { '@type': 'AdministrativeArea', name: 'Québec, Canada' },
  audience: {
    '@type': 'BusinessAudience',
    audienceType: 'Professionnels de la beauté',
    geographicArea: { '@type': 'AdministrativeArea', name: 'Québec, Canada' },
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Essai gratuit',
      price: '0.00',
      priceCurrency: 'CAD',
      description: "7 jours d'essai gratuit, 7 publications, aucune carte de crédit requise.",
      eligibleDuration: { '@type': 'QuantitativeValue', value: 7, unitCode: 'DAY' },
    },
    {
      '@type': 'Offer',
      name: 'Essentiel',
      price: '57.00',
      priceCurrency: 'CAD',
      description: '20 publications par mois, ADN de marque IA complet, calendrier de contenu, Facebook + Instagram.',
      eligibleQuantity: { '@type': 'QuantitativeValue', value: 20, unitText: 'publications/mois' },
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '127.00',
      priceCurrency: 'CAD',
      description: '150 publications par mois, planification IA automatique de semaines et mois, suggestions stratégiques, support prioritaire.',
      eligibleQuantity: { '@type': 'QuantitativeValue', value: 150, unitText: 'publications/mois' },
    },
  ],
  brand: { '@type': 'Organization', name: 'Astrova', url: 'https://astrova.ca' },
  publisher: { '@type': 'Organization', name: 'Astrova', url: 'https://astrova.ca' },
};

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isActive = !!session?.user;
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

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
                <Link href="/auth/signup" className="text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-colors">
                  Essai gratuit →
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
            <span className="sm:hidden text-center leading-snug">Conçu pour les professionnels<br />de la beauté du Québec</span>
            <span className="hidden sm:inline">Conçu pour les professionnels de la beauté du Québec</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Récupère jusqu&apos;à
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              10 heures par semaine
            </span>
            <br />
            sur tes réseaux sociaux.
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-3 leading-relaxed">
            StudioGen planifie ton contenu, génère tes publications et s&apos;adapte à ton entreprise grâce à ton ADN de marque IA.
          </p>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Que tu sois esthéticienne, coiffeuse, technicienne en cils, artiste PMU, propriétaire de spa ou spécialiste en soins, StudioGen crée du contenu qui te ressemble.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isActive ? (
              <Link href="/studio" className="w-full sm:w-auto text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-violet-200">
                Accéder au studio →
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" className="w-full sm:w-auto text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-violet-200">
                  Essayer gratuitement pendant 7 jours
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto text-base font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-8 py-3.5 rounded-2xl transition-colors">
                  J&apos;ai déjà un compte
                </Link>
              </>
            )}
          </div>

          {!isActive && <p className="text-xs text-gray-500 mt-4">Accès complet pendant 7 jours · 7 publications incluses · Aucune carte requise</p>}
        </div>

        {/* App preview mockup */}
        <div className="relative max-w-5xl mx-auto mt-16 hidden sm:block">
          <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100 border border-gray-200 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-400">
                app.studiogen.ca/studio
              </div>
            </div>

            {/* Nav bar */}
            <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-violet-600 rounded-lg" />
                <span className="text-xs font-bold text-gray-800">StudioGen</span>
                <span className="text-[10px] text-gray-400 ml-1">par Astrova</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">⚡ PRO</div>
                <div className="bg-violet-600 text-white text-[10px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Calendrier
                </div>
              </div>
            </div>

            {/* Studio body */}
            <div className="bg-gray-50 p-4">
              <div className="grid grid-cols-[200px_1fr_240px] gap-3">

                {/* Col 1 — Format + Mise en page */}
                <div className="space-y-3">
                  {/* Format */}
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Format</div>
                    <div className="flex gap-1.5">
                      {[
                        { label: 'Carré 1:1', w: 'w-8', h: 'h-8' },
                        { label: 'Portrait 4:5', w: 'w-6', h: 'h-8' },
                        { label: 'Story 9:16', w: 'w-4', h: 'h-8' },
                      ].map((f, i) => (
                        <div key={f.label} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border ${i === 0 ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white'}`}>
                          <div className={`${f.w} ${f.h} rounded-sm ${i === 0 ? 'bg-violet-600' : 'bg-gray-200'}`} />
                          <span className={`text-[8px] font-semibold leading-none text-center ${i === 0 ? 'text-violet-700' : 'text-gray-400'}`}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Mise en page */}
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mise en page</div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { bg: 'bg-violet-600' },
                        { lines: 2 },
                        { lines: 3 },
                        { lines: 4 },
                        { grid: '2x2' },
                        { grid: '2x3' },
                        { hero: true },
                        { grid: '3x3' },
                      ].map((layout, i) => (
                        <div key={i} className={`h-8 rounded-lg overflow-hidden border ${i === 0 ? 'border-violet-400' : 'border-gray-100'} ${layout.bg ?? 'bg-gray-50'} flex flex-col justify-center items-center gap-0.5 p-1`}>
                          {layout.lines && [...Array(layout.lines)].map((_, j) => (
                            <div key={j} className="w-full h-px bg-gray-300" />
                          ))}
                          {layout.grid === '2x2' && <div className="grid grid-cols-2 gap-px w-full h-full"><div className="bg-gray-200 rounded-sm" /><div className="bg-gray-200 rounded-sm" /><div className="bg-gray-200 rounded-sm" /><div className="bg-gray-200 rounded-sm" /></div>}
                          {layout.grid === '2x3' && <div className="grid grid-cols-3 gap-px w-full h-full"><div className="col-span-2 bg-gray-200 rounded-sm" /><div className="bg-gray-200 rounded-sm" /><div className="bg-gray-200 rounded-sm" /><div className="col-span-2 bg-gray-200 rounded-sm" /></div>}
                          {layout.hero && <div className="grid grid-rows-2 gap-px w-full h-full"><div className="bg-gray-200 rounded-sm" /><div className="grid grid-cols-3 gap-px"><div className="bg-gray-200 rounded-sm" /><div className="bg-gray-200 rounded-sm" /><div className="bg-gray-200 rounded-sm" /></div></div>}
                          {layout.grid === '3x3' && <div className="grid grid-cols-3 gap-px w-full h-full">{[...Array(9)].map((_, k) => <div key={k} className="bg-gray-200 rounded-sm" />)}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Col 2 — Photos + Aperçu */}
                <div className="space-y-3">
                  {/* Photos */}
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Photos</div>
                      <div className="text-[9px] text-gray-400">0/6</div>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg py-3 flex flex-col items-center gap-1">
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <div className="text-[9px] font-semibold text-gray-500">Glissez tes photos ici</div>
                      <div className="text-[8px] text-gray-400">JPG, PNG, WebP</div>
                    </div>
                  </div>
                  {/* Aperçu */}
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Aperçu</div>
                      <div className="flex items-center gap-1.5">
                        <div className="text-[8px] text-gray-400">1080 × 1080 px</div>
                        <div className="bg-violet-50 border border-violet-200 text-violet-700 text-[8px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                          <span>+</span> Texte
                        </div>
                        <div className="bg-violet-600 text-white text-[8px] font-semibold px-2 py-0.5 rounded-lg">⬇ Télécharger</div>
                      </div>
                    </div>
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400 font-medium">Ajoutez des photos</div>
                        <div className="text-[9px] text-gray-300">pour créer ton collage</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 3 — Logo + Générer */}
                <div className="space-y-3">
                  {/* Logo */}
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Logo</div>
                      <div className="text-[9px] font-semibold text-violet-600">+ Ajouter</div>
                    </div>
                    <div className="border-2 border-violet-500 bg-violet-50 rounded-lg px-2.5 py-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">∅</span>
                      <span className="text-[10px] font-medium text-violet-700 flex-1">Sans logo</span>
                      <div className="w-3.5 h-3.5 bg-violet-600 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Générer */}
                  <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Générer les publications</div>

                    <div>
                      <div className="text-[9px] font-semibold text-gray-600 mb-1.5">Type de contenu</div>
                      <div className="grid grid-cols-3 gap-1">
                        {['Formation','Résultats','Produit','Engagement','Éducatif','Promo'].map((t, i) => (
                          <div key={t} className={`text-center text-[8px] font-semibold py-1 rounded-lg border ${i === 1 ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t}</div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-semibold text-gray-600 mb-1.5">Ton</div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: 'Chaleureux', icon: '🌸' },
                          { label: 'Énergique', icon: '⚡' },
                          { label: 'Pro', icon: '💎' },
                        ].map((t, i) => (
                          <div key={t.label} className={`flex flex-col items-center py-1.5 rounded-lg border text-[7px] font-semibold ${i === 0 ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-500'}`}>
                            <span className="text-base leading-none mb-0.5">{t.icon}</span>
                            {t.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-semibold text-gray-600 mb-1.5">Longueur</div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: 'Court', sub: '~75 mots' },
                          { label: 'Moyen', sub: '~180 mots' },
                          { label: 'Long', sub: '~350 mots' },
                        ].map((l, i) => (
                          <div key={l.label} className={`text-center py-1.5 rounded-lg border ${i === 1 ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                            <div className="text-[8px] font-bold leading-none">{l.label}</div>
                            <div className={`text-[7px] mt-0.5 ${i === 1 ? 'text-violet-200' : 'text-gray-400'}`}>{l.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg px-2.5 py-2 h-10 flex items-start">
                      <span className="text-[8px] text-gray-400">Ex. : Nouveau soin visage au collagène…</span>
                    </div>

                    <div className="bg-violet-600 rounded-xl py-2.5 text-center text-[9px] text-white font-bold">
                      ✦ Générer les publications
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ADN de marque IA ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">ADN de marque IA</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                StudioGen apprend à connaître ton entreprise
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Plus ton ADN de marque IA est complet, plus StudioGen crée du contenu qui te ressemble.
              </p>
              <ul className="space-y-3 mb-6">
                {adnItems.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-violet-700">
                Ton ADN de marque IA devient le cerveau marketing de ton entreprise.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Exemple de profil</div>
              {[
                { label: 'Services prioritaires', value: 'Épilation laser · Soins du visage' },
                { label: 'Clientèle cible',        value: 'Femmes 25–45 ans, professionnelles' },
                { label: 'Ton de marque',           value: 'Chaleureux et professionnel' },
                { label: 'Expressions favorites',   value: 'Peau lumineuse · Résultats naturels' },
              ].map(row => (
                <div key={row.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{row.label}</div>
                  <div className="text-sm text-gray-700">{row.value}</div>
                </div>
              ))}
            </div>
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
                <p className="text-sm text-red-700 leading-relaxed">{p.desc}</p>
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
              Esthétique, soins, coiffure, PMU, cils, ongles, spas… StudioGen comprend ton secteur et parle la même langue que ta clientèle.
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
                <div className="text-5xl font-black text-violet-100 mb-4 leading-none" aria-hidden="true">{s.num}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planification IA ─────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-pink-100 rounded-full blur-[140px] opacity-20" />
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Planification IA</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                L&apos;IA t&apos;aide à savoir quoi publier
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Basé sur ton ADN de marque IA, tes services et ta clientèle, StudioGen peut suggérer automatiquement ta semaine ou ton mois de contenu.
              </p>
              <ul className="space-y-2 mb-6">
                {['tes services prioritaires', 'ta clientèle', 'ton ton', 'tes objectifs'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="text-violet-600 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mb-5">
                Tu choisis ensuite tes photos et créez la publication en un clic.
              </p>
              <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                ✨ Exclusif au plan Pro
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Exemple de semaine générée</div>
              {aiPlanningSchedule.map(({ day, type }) => (
                <div key={day} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{day}</span>
                  <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Comparaison</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              StudioGen vs Canva
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Canva t&apos;aide à créer de beaux visuels. StudioGen pense, planifie et rédige à ta place.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-[3fr_1fr_1fr] text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest border-b border-gray-100">
              <div className="py-3 sm:py-4 px-3 sm:px-4 text-left text-gray-500">Fonctionnalité</div>
              <div className="py-3 sm:py-4 px-3 sm:px-4 bg-violet-600 text-white">StudioGen</div>
              <div className="py-3 sm:py-4 px-3 sm:px-4 text-gray-500">Canva</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[3fr_1fr_1fr] text-center text-xs sm:text-sm items-center ${i < comparisonRows.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="py-3 sm:py-3.5 px-3 sm:px-4 text-left text-gray-600 leading-snug">{row.label}</div>
                <div className="py-3 sm:py-3.5 px-3 sm:px-4 bg-violet-50">
                  <span className="text-violet-600 font-bold text-base">{row.sg ? '✓' : '✗'}</span>
                </div>
                <div className="py-3 sm:py-3.5 px-3 sm:px-4">
                  <span className={`font-bold text-base ${row.canva ? 'text-gray-500' : 'text-gray-300'}`}>{row.canva ? '✓' : '✗'}</span>
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
                &quot;Avant StudioGen, je passais mon dimanche soir à préparer mes publications. Maintenant, je crée ma semaine de contenu en moins de 15 minutes.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-200 flex items-center justify-center text-sm font-bold text-violet-700">M</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Marie-Pier T.</div>
                  <div className="text-xs text-gray-500">Esthéticienne, Sherbrooke</div>
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
                &quot;Le contenu ressemble enfin à mon entreprise. Je n&apos;ai plus besoin de passer par Canva ou une agence.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-fuchsia-200 flex items-center justify-center text-sm font-bold text-fuchsia-700">S</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Stéphanie B.</div>
                  <div className="text-xs text-gray-500">Technicienne en soins esthétiques, Québec</div>
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
            <p className="text-gray-500">7 jours d&apos;essai gratuit · Aucune carte requise · Annulation en tout temps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl gap-6 mx-auto">
            {/* Essentiel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
              <div className="text-xl font-bold text-gray-800 mb-1">Essentiel</div>
              <div className="text-sm text-gray-500 mb-4 font-medium">Pour les professionnels qui savent déjà quoi publier.</div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black text-gray-900">57 $</span>
                <span className="text-gray-500 mb-1">CA / mois</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  '20 publications / mois',
                  'Studio complet',
                  'ADN de marque IA',
                  'Calendrier de contenu',
                  'Tous les formats',
                  'Génération IA de publications',
                  'Historique des publications',
                  'Analyse du site web',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
                {[
                  'Planifier ma semaine',
                  'Planifier mon mois',
                  'Suggestions stratégiques automatiques',
                  'Collaboration d\'équipe',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-violet-400 hover:text-violet-600 transition-colors mt-auto">
                Commencer avec Essentiel
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-fuchsia-950 to-violet-950 rounded-2xl border border-fuchsia-900/40 p-8 relative overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Recommandé
              </div>
              <div className="text-xl font-bold text-gray-300 mb-1">Pro</div>
              <div className="text-sm text-gray-400 mb-4 font-medium">Pour ceux qui veulent que l&apos;IA planifie leur stratégie de contenu.</div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black text-white">127 $</span>
                <span className="text-gray-400 mb-1">CA / mois</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  '150 publications / mois',
                  'Tout ce qui est inclus dans Essentiel',
                  'Planifier ma semaine avec l\'IA',
                  'Planifier mon mois avec l\'IA',
                  'Suggestions stratégiques automatiques',
                  'Suggestions adaptées à ta saison',
                  'Priorisation automatique des services',
                  'Collaboration d\'équipe — jusqu\'à 3 utilisateurs',
                ].map(item => (
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
                  Passer au Pro →
                </Link>
              )}
            </div>
          </div>

          {/* Pourquoi choisir Pro */}
          <div className="max-w-3xl mx-auto mt-12 bg-white rounded-2xl border border-violet-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Pourquoi choisir Pro ?</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Le plan Pro ne se contente pas de créer du contenu.
              Il analyse ton ADN de marque IA et te suggère automatiquement quoi publier chaque semaine afin de maintenir une présence cohérente sur Facebook et Instagram.
            </p>
            <ul className="space-y-2">
              {[
                'Plus jamais de page blanche',
                'Des idées adaptées à ton entreprise',
                'Une stratégie de contenu sans agence marketing',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="text-violet-600 font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Définition extractable (featured snippet / GEO) ──────────────── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Qu&apos;est-ce que StudioGen ?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            StudioGen est le système de contenu IA conçu pour les professionnels de la beauté du Québec. Il planifie automatiquement ton contenu, génère tes publications Facebook et Instagram et s&apos;adapte à ton entreprise grâce à ton ADN de marque IA. En moins de 2 minutes, tu obtiens un montage photo professionnel et un texte personnalisé en français québécois, sans formation en design ni en rédaction. StudioGen est conçu pour les esthéticiennes, coiffeuses, techniciennes en cils, artistes PMU, propriétaires de spas et tous les professionnels de la beauté du Québec.
          </p>
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
              <details key={item.q} className="group bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-sm text-gray-900 hover:text-violet-700 transition-colors">
                  {item.q}
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            Rejoignez les professionnels de la beauté qui publient du contenu professionnel chaque semaine, sans agence, sans stress.
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
                Essayer gratuitement pendant 7 jours
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="text-xs text-gray-500 mt-3">Accès complet pendant 7 jours · 7 publications incluses · Aucune carte requise</p>
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
            <Link href="/auth/signup" className="hover:text-gray-300 transition-colors">S&apos;inscrire</Link>
            <Link href="#tarifs" className="hover:text-gray-300 transition-colors">Tarifs</Link>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/politique-confidentialite" className="hover:text-gray-400 transition-colors">Confidentialité</Link>
            <Link href="/conditions-utilisation" className="hover:text-gray-400 transition-colors">Conditions</Link>
            <span>© {new Date().getFullYear()} Astrova.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
