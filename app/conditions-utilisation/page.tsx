import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Conditions d'utilisation — StudioGen",
  description:
    "Conditions d'utilisation de StudioGen — Les règles qui encadrent l'utilisation du service d'Astrova pour les professionnels de la beauté du Québec.",
  alternates: { canonical: 'https://studiogen.ca/conditions-utilisation' },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Conditions d'utilisation — StudioGen",
    description: "Les règles qui encadrent l'utilisation de StudioGen par les professionnels de la beauté du Québec.",
    url: 'https://studiogen.ca/conditions-utilisation',
    siteName: 'StudioGen',
    locale: 'fr_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Conditions d'utilisation — StudioGen",
    description: "Les règles qui encadrent l'utilisation de StudioGen par les professionnels de la beauté du Québec.",
  },
};

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo-black.png" alt="StudioGen" width={180} height={36} className="h-9 w-auto" priority />
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Retour au site
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{"Conditions d'utilisation"}</h1>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : 12 juin 2026</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptation des conditions</h2>
            <p>
              En créant un compte et en utilisant StudioGen, vous acceptez les présentes conditions d&apos;utilisation.
              StudioGen est un produit de <strong>Astrova</strong>, entreprise basée au Québec, Canada.
              Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Description du service</h2>
            <p>
              StudioGen est le système de contenu IA conçu pour les professionnels de la beauté du Québec.
              Le service inclut notamment :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>La création de collages photo automatiques et la gestion de logos.</li>
              <li>La rédaction de textes par IA en français québécois adaptés à votre entreprise.</li>
              <li>L&apos;ADN de marque IA — profil personnalisé qui apprend votre ton, vos services, votre clientèle et vos objectifs.</li>
              <li>L&apos;analyse de votre site web pour enrichir votre ADN de marque IA.</li>
              <li>Le calendrier de contenu pour planifier et programmer vos publications.</li>
              <li>La planification automatique de semaines ou de mois de contenu (plan Pro).</li>
              <li>Le téléchargement de visuels en haute résolution prêts à publier.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Compte et accès</h2>
            <p>
              Vous devez créer un compte avec une adresse courriel valide. Vous êtes responsable de la
              confidentialité de votre mot de passe et de toute activité effectuée sous votre compte.
              Un seul compte par personne est autorisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Essai gratuit</h2>
            <p>
              Lors de votre inscription, vous bénéficiez d&apos;un essai gratuit de <strong>7 jours</strong>,
              sans carte de crédit requise. L&apos;essai inclut un accès complet à toutes les fonctionnalités
              du plan Pro, avec un maximum de <strong>7 publications</strong>. À l&apos;expiration de l&apos;essai,
              vous devez souscrire à un plan payant pour continuer à utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Abonnements et paiement</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Les abonnements sont mensuels et se renouvellent automatiquement.</li>
              <li>Les paiements sont traités en dollars canadiens (CAD) via Stripe. La facturation apparaît sous le nom <strong>Astrova</strong> sur votre relevé bancaire.</li>
              <li>Vous pouvez annuler votre abonnement en tout temps depuis la page Abonnement. Votre accès reste actif jusqu&apos;à la fin de la période payée.</li>
              <li>Nous ne remboursons pas les périodes déjà écoulées, sauf erreur de facturation de notre part.</li>
              <li>Les prix peuvent changer. Vous serez avisé par courriel au moins 30 jours avant toute modification tarifaire.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Limites d&apos;utilisation</h2>
            <p>Chaque plan inclut un nombre mensuel de publications :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Essai gratuit :</strong> 7 publications maximum sur 7 jours.</li>
              <li><strong>Plan Essentiel :</strong> 20 publications par mois.</li>
              <li><strong>Plan Pro :</strong> 150 publications par mois.</li>
            </ul>
            <p className="mt-3">
              Les publications non utilisées au cours d&apos;un mois ne sont pas reportées au mois suivant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Utilisation acceptable</h2>
            <p>En utilisant StudioGen, vous vous engagez à ne pas :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Utiliser le service à des fins illégales ou frauduleuses.</li>
              <li>Importer des images dont vous ne détenez pas les droits.</li>
              <li>Tenter de contourner les limites de publications ou d&apos;accès.</li>
              <li>Reproduire, copier ou revendre le service sans autorisation écrite.</li>
              <li>Publier du contenu haineux, diffamatoire ou portant atteinte à des tiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Propriété intellectuelle</h2>
            <p>
              Le code, le design, les algorithmes et la marque StudioGen sont la propriété exclusive d&apos;Astrova.
              Les publications générées à partir de vos informations vous appartiennent entièrement.
              Vous conservez tous les droits sur les photos que vous importez dans le service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Disponibilité du service</h2>
            <p>
              Nous faisons tout notre possible pour maintenir StudioGen accessible en permanence.
              Toutefois, des interruptions de service peuvent survenir pour maintenance, mises à jour ou
              raisons techniques. Nous ne garantissons pas une disponibilité ininterrompue.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Limitation de responsabilité</h2>
            <p>
              StudioGen est fourni &ldquo;tel quel&rdquo;. Dans les limites permises par la loi, Astrova ne peut être
              tenu responsable des dommages indirects, pertes de revenus ou interruptions d&apos;activité
              découlant de l&apos;utilisation du service. Notre responsabilité totale est limitée au montant
              payé pour le mois en cours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Résiliation</h2>
            <p>
              Vous pouvez fermer votre compte en tout temps en nous écrivant à{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
              Nous nous réservons le droit de suspendre ou de résilier votre accès en cas de violation
              de ces conditions, sans préavis ni remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Droit applicable</h2>
            <p>
              Les présentes conditions sont régies par les lois de la province de Québec et les lois fédérales
              du Canada applicables. Tout litige sera soumis aux tribunaux compétents du Québec.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">13. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions à tout moment. En cas de changement important,
              vous serez avisé par courriel. La version en vigueur est toujours disponible sur cette page.
              La poursuite de l&apos;utilisation du service après notification constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">14. Contact</h2>
            <p>
              Pour toute question relative à ces conditions, écrivez-nous à{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 px-6 mt-16">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Astrova. Tous droits réservés.</span>
          <div className="flex gap-6">
            <Link href="/politique-confidentialite" className="hover:text-gray-900 transition-colors">Confidentialité</Link>
            <Link href="/conditions-utilisation" className="hover:text-gray-900 transition-colors">Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
