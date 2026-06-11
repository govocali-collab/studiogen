import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — StudioGen',
  description: 'Politique de confidentialité de StudioGen — Comment nous collectons, utilisons et protégeons vos données personnelles.',
  robots: { index: true, follow: true },
};

export default function PolitiqueConfidentialitePage() {
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : 11 juin 2026</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Qui sommes-nous</h2>
            <p>
              StudioGen est un produit de <strong>Astrova</strong>, une entreprise basée au Québec, Canada.
              StudioGen est un outil en ligne permettant aux professionnels de la beauté de créer des publications
              pour les réseaux sociaux Facebook et Instagram.
            </p>
            <p className="mt-2">
              Pour toute question relative à cette politique, vous pouvez nous contacter à{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Données que nous collectons</h2>
            <p>Lors de votre utilisation de StudioGen, nous collectons les données suivantes :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Compte :</strong> adresse courriel et mot de passe (chiffré).</li>
              <li><strong>Profil entreprise :</strong> nom, prénom, nom de l&apos;entreprise, site internet et description des services. Ces informations sont utilisées par l&apos;IA pour personnaliser vos publications.</li>
              <li><strong>Photos :</strong> les images que vous importez dans le studio pour créer vos collages. Elles sont traitées localement dans votre navigateur et ne sont pas stockées sur nos serveurs.</li>
              <li><strong>Logos :</strong> les logos que vous ajoutez sont stockés localement dans votre navigateur (localStorage) et ne sont pas transmis à nos serveurs.</li>
              <li><strong>Images planifiées :</strong> les visuels que vous planifiez dans le calendrier de contenu sont stockés sur nos serveurs afin d&apos;être accessibles ultérieurement.</li>
              <li><strong>Paiement :</strong> les informations de paiement sont gérées exclusivement par Stripe. Nous ne stockons jamais vos numéros de carte.</li>
              <li><strong>Données d&apos;utilisation :</strong> nombre de générations utilisées, statut de l&apos;abonnement, date de création du compte.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Comment nous utilisons vos données</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fournir et améliorer le service StudioGen.</li>
              <li>Personnaliser les publications générées par l&apos;IA à partir de votre description d&apos;entreprise.</li>
              <li>Gérer votre abonnement et votre facturation via Stripe.</li>
              <li>Vous contacter en cas de problème lié à votre compte.</li>
              <li>Respecter nos obligations légales.</li>
            </ul>
            <p className="mt-3">
              Nous n&apos;utilisons pas vos données pour entraîner des modèles d&apos;intelligence artificielle, ni pour les revendre à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Fournisseurs de services tiers</h2>
            <p>Nous faisons appel aux fournisseurs suivants pour opérer notre service :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Supabase</strong> — hébergement de la base de données, authentification et stockage des images. Données stockées au Canada ou aux États-Unis.</li>
              <li><strong>Stripe</strong> — traitement des paiements. Stripe est certifié PCI DSS niveau 1. La facturation apparaît sous le nom <strong>Astrova</strong> sur votre relevé bancaire.</li>
              <li><strong>Moteur IA</strong> — génération de textes pour vos publications. Seule la description de votre entreprise est transmise lors de la génération.</li>
              <li><strong>Vercel</strong> — hébergement de l&apos;application web.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Conservation des données</h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre compte,
              vos informations personnelles sont effacées dans un délai de 30 jours, sauf obligation légale de conservation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Vos droits</h2>
            <p>Conformément aux lois en vigueur (dont la Loi 25 au Québec), vous avez le droit de :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Accéder aux données personnelles que nous détenons sur vous.</li>
              <li>Corriger toute information inexacte.</li>
              <li>Demander la suppression de votre compte et de vos données.</li>
              <li>Retirer votre consentement en tout temps.</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, écrivez-nous à{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Sécurité</h2>
            <p>
              Vos données sont protégées par des connexions chiffrées (HTTPS/TLS).
              Les mots de passe sont hachés et ne sont jamais stockés en clair.
              Nous appliquons des contrôles d&apos;accès stricts à notre base de données.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Témoins (cookies)</h2>
            <p>
              StudioGen utilise uniquement les témoins strictement nécessaires au fonctionnement du service,
              notamment pour maintenir votre session de connexion. Nous n&apos;utilisons pas de témoins à des fins
              publicitaires ou de traçage tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout moment.
              En cas de changement important, nous vous en informerons par courriel ou via une notification dans l&apos;application.
              La version en vigueur est toujours disponible sur cette page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact</h2>
            <p>
              Pour toute question, écrivez-nous à{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>
              {' '}ou visitez{' '}
              <Link href="/" className="text-violet-600 hover:underline">studiogen.ca</Link>.
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
