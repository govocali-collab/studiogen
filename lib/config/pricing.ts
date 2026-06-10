export const PRICING = {
  essentiel: {
    name: 'Essentiel',
    price: 57, // CAD, monthly
    trialGenerations: 7,
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIEL,
    description: 'Pour bien commencer',
    features: [
      '50 posts / mois',
      'Accès complet à toutes les fonctionnalités',
      'Toutes les mises en page',
      'Facebook + Instagram simultanément',
      'Logos illimités',
      'Montages photo automatiques (JPG 1080px)',
    ],
  },
  pro: {
    name: 'Pro',
    price: 127, // CAD, monthly
    trialGenerations: 7,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    description: 'Pour les salons actifs',
    features: [
      '150 posts / mois',
      'Accès complet à toutes les fonctionnalités',
      'Toutes les mises en page',
      'Facebook + Instagram simultanément',
      'Logos illimités',
      'Montages photo automatiques (JPG 1080px)',
      'Priorité de support',
    ],
  },
} as const;

export type Tier = 'essentiel' | 'pro';
