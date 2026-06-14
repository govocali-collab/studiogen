export const PRICING = {
  essentiel: {
    name: 'Essentiel',
    price: 29, // CAD, monthly
    officialPrice: 57, // original price before founder offer
    trialGenerations: 7,
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIEL,
    description: 'Pour les professionnels qui créent du contenu.',
    features: [
      '20 publications / mois',
      'Studio complet',
      'Calendrier de contenu',
      'Tous les formats (Carré, Portrait, Story)',
      'Génération IA de publications',
      'Logos illimités',
      'Historique des publications',
      'Publication en français ou en anglais',
      'Planification manuelle du calendrier',
    ],
  },
  pro: {
    name: 'Pro',
    price: 79, // CAD, monthly
    officialPrice: 127, // original price before founder offer
    trialGenerations: 7,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    description: "L'IA pense comme ta coordonnatrice marketing.",
    features: [
      '150 publications / mois',
      'Tout ce qui est inclus dans Essentiel',
      'ADN de marque IA complet',
      'Analyse automatique du site web',
      'Services prioritaires',
      'Publications exemples',
      'Objectifs de transformation',
      'Planifier ma semaine avec l\'IA',
      'Planifier mon mois avec l\'IA',
      'Suggestions stratégiques automatiques',
      'Suggestions adaptées à la saison',
      'Priorisation automatique des services',
      'Collaboration d\'équipe (jusqu\'à 3 utilisateurs)',
      'Contenu ultra personnalisé',
    ],
  },
} as const;

export type Tier = 'essentiel' | 'pro';
