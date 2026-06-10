export const PRICING = {
  essentiel: {
    name: 'Essentiel',
    price: 47, // CAD, monthly
    trialGenerations: 10,
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIEL,
    description: 'Pour bien commencer',
    features: [
      '50 générations / mois',
      '1 logo',
      '4 formats de montage auto',
      'Post Facebook prêt à copier',
      'Montages photo automatiques (JPG 1080px)',
    ],
  },
  pro: {
    name: 'Pro',
    price: 97, // CAD, monthly
    trialGenerations: 10,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    description: 'Pour les équipes actives',
    features: [
      '150 générations / mois',
      'Logos illimités',
      'Tous les formats de montage',
      'Facebook + Instagram simultanément',
      'Historique des publications',
      'Montages photo automatiques (JPG 1080px)',
      'Priorité de support',
    ],
  },
} as const;

export type Tier = 'essentiel' | 'pro';
