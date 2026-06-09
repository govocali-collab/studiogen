import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions d'utilisation de Studio Gen - Les regles qui encadrent l'utilisation de notre service.",
  robots: { index: true, follow: true },
};

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo-black.png" alt="Studio Gen" width={180} height={36} className="h-9 w-auto" priority />
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Retour au site
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{"Conditions d'utilisation"}</h1>
        <p className="text-sm text-gray-500 mb-12">Derniere mise a jour : 9 juin 2026</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptation des conditions</h2>
            <p>
              En creant un compte et en utilisant Studio Gen, vous acceptez les presentes conditions d utilisation.
              Studio Gen est un produit de <strong>Astrova</strong>, entreprise basee au Quebec, Canada.
              Si vous n acceptez pas ces conditions, veuillez ne pas utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Description du service</h2>
            <p>
              Studio Gen est une application web qui permet aux professionnels de creer des publications
              pour Facebook et Instagram a l aide de l intelligence artificielle. Le service inclut :
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>La creation de collages photo automatiques.</li>
              <li>La redaction de textes par IA en francais quebecois.</li>
              <li>La gestion de logos et de formats visuels.</li>
              <li>Le telechargement de visuels en haute resolution.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Compte et acces</h2>
            <p>
              Vous devez creer un compte avec une adresse courriel valide. Vous etes responsable de la
              confidentialite de votre mot de passe et de toute activite effectuee sous votre compte.
              Un seul compte par personne est autorise.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Essai gratuit</h2>
            <p>
              Lors de votre inscription, vous beneficiez d un essai gratuit de <strong>7 jours</strong>,
              sans carte de credit requise. L essai inclut un nombre limite de generations tel qu indique
              sur la page de tarification. A l expiration de l essai, vous devez souscrire a un plan
              payant pour continuer a utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Abonnements et paiement</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Les abonnements sont mensuels et se renouvellent automatiquement.</li>
              <li>Les paiements sont traites en dollars canadiens (CAD) via Stripe.</li>
              <li>Vous pouvez annuler votre abonnement en tout temps depuis la page de facturation. Votre acces reste actif jusqu a la fin de la periode payee.</li>
              <li>Nous ne remboursons pas les periodes deja ecoulees, sauf erreur de facturation de notre part.</li>
              <li>Les prix peuvent changer. Vous serez avise par courriel au moins 30 jours avant toute modification tarifaire.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Utilisation acceptable</h2>
            <p>En utilisant Studio Gen, vous vous engagez a ne pas :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Utiliser le service a des fins illegales ou frauduleuses.</li>
              <li>Importer des images dont vous ne detenez pas les droits.</li>
              <li>Tenter de contourner les limites de generations ou d acces.</li>
              <li>Reproduire, copier ou revendre le service sans autorisation ecrite.</li>
              <li>Publier du contenu haineux, diffamatoire ou portant atteinte a des tiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Propriete intellectuelle</h2>
            <p>
              Le code, le design, les algorithmes et la marque Studio Gen sont la propriete exclusive d Astrova.
              Les publications generees a partir de vos informations vous appartiennent entierement.
              Vous conservez tous les droits sur les photos que vous importez dans le service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Disponibilite du service</h2>
            <p>
              Nous faisons tout notre possible pour maintenir Studio Gen accessible en permanence.
              Toutefois, des interruptions de service peuvent survenir pour maintenance, mises a jour ou
              raisons techniques. Nous ne garantissons pas une disponibilite ininterrompue.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation de responsabilite</h2>
            <p>
              Studio Gen est fourni "tel quel". Dans les limites permises par la loi, Astrova ne peut etre
              tenu responsable des dommages indirects, pertes de revenus ou interruptions d activite
              decoulant de l utilisation du service. Notre responsabilite totale est limitee au montant
              paye pour le mois en cours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Resiliation</h2>
            <p>
              Vous pouvez fermer votre compte en tout temps en nous ecrivant a{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
              Nous nous reservons le droit de suspendre ou de resilier votre acces en cas de violation
              de ces conditions, sans preavis ni remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Droit applicable</h2>
            <p>
              Les presentes conditions sont regies par les lois de la province de Quebec et les lois federales
              du Canada applicables. Tout litige sera soumis aux tribunaux competents du Quebec.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions a tout moment. En cas de changement important,
              vous serez avise par courriel. La version en vigueur est toujours disponible sur cette page.
              La poursuite de l utilisation du service apres notification constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">13. Contact</h2>
            <p>
              Pour toute question relative a ces conditions, ecrivez-nous a{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 px-6 mt-16">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Astrova. Tous droits reserves.</span>
          <div className="flex gap-6">
            <Link href="/politique-confidentialite" className="hover:text-gray-900 transition-colors">Confidentialite</Link>
            <Link href="/conditions-utilisation" className="hover:text-gray-900 transition-colors">Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
