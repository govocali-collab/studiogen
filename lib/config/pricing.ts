export const PRICING = {
  essentiel: {
    name: 'Essentiel',
    price: 57, // CAD, monthly
    trialGenerations: 7,
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIEL,
    description: "L'IA écrit comme votre entreprise.",
    features: [
      '50 publications / mois',
      'Studio complet + Brand Brain',
      'Analyse du site web',
      'Voix de marque, ton et services',
      'Calendrier de contenu',
      'Programmation des publications',
      'Facebook + Instagram simultanément',
    ],
  },
  pro: {
    name: 'Pro',
    price: 127, // CAD, monthly
    trialGenerations: 7,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    description: "L'IA pense comme votre coordonnatrice marketing.",
    features: [
      '150 publications / mois',
      'Tout ce qui est inclus dans Essentiel',
      'Planifier ma semaine avec l\'IA',
      'Planifier mon mois avec l\'IA',
      'Calendrier généré automatiquement',
      'Suggestions stratégiques basées sur votre Brand Brain',
      'Régénération intelligente d\'idées',
      'Priorité de support',
    ],
  },
} as const;

export type Tier = 'essentiel' | 'pro';
