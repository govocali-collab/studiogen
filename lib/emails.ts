import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@boutiquelsbestrie.com';
const APP_NAME = 'Studio Gen';

export async function sendSubscriptionConfirmation(email: string, tier: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Votre abonnement ${tier === 'pro' ? 'Pro' : 'Essentiel'} est activé ✨`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">${APP_NAME}</h1>
        <p style="color:#555;margin-bottom:24px">Merci pour votre abonnement !</p>
        <p>Votre plan <strong>${tier === 'pro' ? 'Pro' : 'Essentiel'}</strong> est maintenant actif.
        Vous pouvez dès maintenant accéder à toutes les fonctionnalités incluses dans votre abonnement.</p>
        <p style="margin-top:24px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}"
             style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Accéder au studio
          </a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#aaa">
          Pour gérer votre abonnement, visitez la page Facturation dans le studio.
        </p>
      </div>
    `,
  });
}

export async function sendTrialEndingReminder(email: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Ton essai ${APP_NAME} se termine dans 3 jours`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">${APP_NAME}</h1>
        <p style="color:#555;margin-bottom:24px">Ton essai gratuit se termine bientôt.</p>
        <p>Il te reste <strong>3 jours</strong> d'essai gratuit. Active ton abonnement maintenant
        pour continuer à créer du contenu professionnel pour tes réseaux sociaux sans interruption.</p>
        <p style="margin-top:24px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing"
             style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Activer mon abonnement →
          </a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#aaa">
          Si tu ne souhaites pas continuer, aucune action n'est requise — ton accès se terminera automatiquement.
        </p>
      </div>
    `,
  });
}

export async function sendPaymentFailedWarning(email: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Action requise — Problème de paiement pour votre abonnement`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">${APP_NAME}</h1>
        <p style="color:#c00;font-weight:600;margin-bottom:16px">⚠️ Paiement échoué</p>
        <p>Nous n'avons pas pu traiter le paiement pour votre abonnement.
        Veuillez mettre à jour votre méthode de paiement dans les 3 prochains jours
        pour éviter la suspension de votre compte.</p>
        <p style="margin-top:24px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing"
             style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Mettre à jour le paiement
          </a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#aaa">
          Si vous pensez que c'est une erreur, contactez-nous à ${FROM}.
        </p>
      </div>
    `,
  });
}
