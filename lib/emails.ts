import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'support@studiogen.ca';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiogen.ca';
const LOGO_URL = 'https://studiogen.ca/logo-black.png';

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

        <!-- Header -->
        <tr><td style="background:#ffffff;border-radius:16px 16px 0 0;padding:24px 40px;text-align:center;border-bottom:1px solid #e5e7eb">
          <img src="${LOGO_URL}" alt="StudioGen" height="32" style="height:32px;width:auto;display:inline-block" />
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">
            StudioGen · Propulsé par <a href="https://astrova.ca" style="color:#7c3aed;text-decoration:none">Astrova</a>
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#d1d5db">
            Tu reçois ce courriel car tu as un compte StudioGen.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function primaryButton(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#c026d3,#7c3aed);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:24px">${label}</a>`;
}

export async function addToAudience(email: string, firstName?: string, lastName?: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) return;
  await resend.contacts.create({
    audienceId,
    email,
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    unsubscribed: false,
  });
}

export async function sendWelcomeEmail(email: string, firstName?: string) {
  const name = firstName ? `, ${firstName}` : '';
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenue sur StudioGen ! Ton studio est prêt ✨',
    html: baseTemplate(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f0a1e">Bienvenue${name} ! 👋</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280">Ton compte StudioGen est activé. Tu as <strong style="color:#7c3aed">7 jours d'essai gratuit</strong> pour explorer toutes les fonctionnalités.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border-radius:12px;padding:20px;margin-bottom:24px">
        <tr>
          <td style="padding:8px 12px">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.05em">Avec ton essai gratuit</p>
            ${['Crée des publications adaptées à ton entreprise', 'Génère des montages photo professionnels', 'Ajoute ton logo en un clic', 'Textes rédigés en français québécois par l\'IA'].map(f => `
            <p style="margin:0 0 8px;font-size:14px;color:#374151">
              <span style="color:#7c3aed;font-weight:700;margin-right:8px">✓</span>${f}
            </p>`).join('')}
          </td>
        </tr>
      </table>

      <div style="text-align:center">
        ${primaryButton(`${APP_URL}/studio`, 'Ouvrir mon studio →')}
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:24px">
        Des questions ? Réponds directement à ce courriel, on est là pour t'aider.
      </p>
    `),
  });
}

export async function sendSubscriptionConfirmation(email: string, tier: string) {
  const planName = tier === 'pro' ? 'Pro' : 'Essentiel';
  const planPrice = tier === 'pro' ? '127 $' : '57 $';
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Ton abonnement ${planName} est actif ✨`,
    html: baseTemplate(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f0a1e">Abonnement activé !</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280">Merci pour ta confiance. Ton plan est maintenant actif.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e0a3c,#2e1065);border-radius:12px;padding:24px;margin-bottom:24px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#a78bfa;text-transform:uppercase;letter-spacing:0.05em">Plan actif</p>
          <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#fff">StudioGen ${planName}</p>
          <p style="margin:0;font-size:16px;color:#c4b5fd">${planPrice} CA / mois</p>
        </td></tr>
      </table>

      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#374151">Ce qui est inclus :</p>
      ${(tier === 'pro'
        ? ['150 posts / mois', 'Accès complet à toutes les fonctionnalités', 'Facebook + Instagram simultanément', 'Logos illimités', 'Priorité de support']
        : ['20 publications / mois', 'Accès complet à toutes les fonctionnalités', 'Facebook + Instagram simultanément', 'Logos illimités']
      ).map(f => `<p style="margin:0 0 8px;font-size:14px;color:#374151"><span style="color:#7c3aed;font-weight:700;margin-right:8px">✓</span>${f}</p>`).join('')}

      <div style="text-align:center">
        ${primaryButton(`${APP_URL}/studio`, 'Accéder au studio →')}
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:24px">
        Pour gérer ton abonnement, visite la page <a href="${APP_URL}/billing" style="color:#7c3aed">Abonnement</a> dans le studio.
        La facturation apparaîtra sous le nom <strong>Astrova</strong> sur ton relevé bancaire.
      </p>
    `),
  });
}

export async function sendTrialEndingReminder(email: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Ton essai StudioGen se termine dans 3 jours',
    html: baseTemplate(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f0a1e">Ton essai se termine bientôt ⏳</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280">Il te reste <strong style="color:#7c3aed">3 jours</strong> d'essai gratuit. Active ton abonnement pour continuer sans interruption.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border-radius:12px;padding:20px;margin-bottom:24px">
        <tr><td>
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.05em">Choisis ton plan</p>
          <p style="margin:0 0 6px;font-size:14px;color:#374151"><strong>Essentiel — 57 $ / mois</strong> · 20 publications / mois</p>
          <p style="margin:0;font-size:14px;color:#374151"><strong>Pro — 127 $ / mois</strong> · 150 posts / mois + priorité de support</p>
        </td></tr>
      </table>

      <div style="text-align:center">
        ${primaryButton(`${APP_URL}/billing`, 'Activer mon abonnement →')}
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:24px">
        Si tu ne souhaites pas continuer, aucune action n'est requise — ton accès se terminera automatiquement.
      </p>
    `),
  });
}

export async function sendPaymentFailedWarning(email: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Action requise — Problème de paiement sur ton abonnement',
    html: baseTemplate(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f0a1e">Paiement échoué ⚠️</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280">Nous n'avons pas pu traiter le paiement pour ton abonnement StudioGen.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px">
        <tr><td>
          <p style="margin:0 0 8px;font-size:14px;color:#dc2626;font-weight:700">Que se passe-t-il si je ne mets pas à jour ?</p>
          <p style="margin:0;font-size:14px;color:#374151">Ton accès au studio sera suspendu dans <strong>3 jours</strong>. Mets à jour ta méthode de paiement pour éviter toute interruption.</p>
        </td></tr>
      </table>

      <div style="text-align:center">
        ${primaryButton(`${APP_URL}/billing`, 'Mettre à jour le paiement →')}
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:24px">
        Tu penses que c'est une erreur ? Réponds à ce courriel et on réglera ça rapidement.
      </p>
    `),
  });
}
