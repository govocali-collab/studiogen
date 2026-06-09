import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Politique de confidentialite',
  description: 'Politique de confidentialite de Studio Gen - Comment nous collectons, utilisons et protecons vos donnees personnelles.',
  robots: { index: true, follow: true },
};

export default function PolitiqueConfidentialitePage() {
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Politique de confidentialite</h1>
        <p className="text-sm text-gray-500 mb-12">Derniere mise a jour : 9 juin 2026</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Qui sommes-nous</h2>
            <p>
              Studio Gen est un produit de <strong>Astrova</strong>, une entreprise basee au Quebec, Canada.
              Studio Gen est un outil en ligne permettant aux professionnels de la beaute de creer des publications
              pour les reseaux sociaux Facebook et Instagram.
            </p>
            <p className="mt-2">
              Pour toute question relative a cette politique, vous pouvez nous contacter a{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Donnees que nous collectons</h2>
            <p>Lors de votre utilisation de Studio Gen, nous collectons les donnees suivantes :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Compte :</strong> adresse courriel et mot de passe (chiffre).</li>
              <li><strong>Profil entreprise :</strong> nom, prenom, nom de l entreprise, site internet et description des services. Ces informations sont utilisees par l IA pour personnaliser vos publications.</li>
              <li><strong>Photos :</strong> les images que vous importez dans le studio pour creer vos collages. Elles sont traitees localement dans votre navigateur et ne sont pas stockees sur nos serveurs.</li>
              <li><strong>Logos :</strong> les logos que vous ajoutez sont stockes localement dans votre navigateur (localStorage) et ne sont pas transmis a nos serveurs.</li>
              <li><strong>Paiement :</strong> les informations de paiement sont gerees exclusivement par Stripe. Nous ne stockons jamais vos numeros de carte.</li>
              <li><strong>Donnees d utilisation :</strong> nombre de generations utilisees, statut de l abonnement, date de creation du compte.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Comment nous utilisons vos donnees</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fournir et ameliorer le service Studio Gen.</li>
              <li>Personnaliser les publications generees par l IA a partir de votre description d entreprise.</li>
              <li>Gerer votre abonnement et votre facturation via Stripe.</li>
              <li>Vous contacter en cas de probleme lié a votre compte.</li>
              <li>Respecter nos obligations legales.</li>
            </ul>
            <p className="mt-3">
              Nous n utilisons pas vos donnees pour entrainer des modeles d intelligence artificielle, ni pour les revendre a des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Fournisseurs de services tiers</h2>
            <p>Nous faisons appel aux fournisseurs suivants pour operer notre service :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Supabase</strong> — hebergement de la base de donnees et authentification. Donnees stockees au Canada ou aux Etats-Unis.</li>
              <li><strong>Stripe</strong> — traitement des paiements. Stripe est certifie PCI DSS niveau 1.</li>
              <li><strong>Anthropic (Claude AI)</strong> — generation de textes pour vos publications. Seule la description de votre entreprise est transmise lors de la generation.</li>
              <li><strong>Vercel</strong> — hebergement de l application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Conservation des donnees</h2>
            <p>
              Vos donnees sont conservees tant que votre compte est actif. Si vous supprimez votre compte,
              vos informations personnelles sont effacees dans un delai de 30 jours, sauf obligation legale de conservation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Vos droits</h2>
            <p>Conformement aux lois en vigueur, vous avez le droit de :</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Acceder aux donnees personnelles que nous detenons sur vous.</li>
              <li>Corriger toute information inexacte.</li>
              <li>Demander la suppression de votre compte et de vos donnees.</li>
              <li>Retirer votre consentement en tout temps.</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, ecrivez-nous a{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Securite</h2>
            <p>
              Vos donnees sont protegees par des connexions chiffrees (HTTPS/TLS).
              Les mots de passe sont hasches et ne sont jamais stockes en clair.
              Nous appliquons des controles d acces stricts a notre base de donnees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialite a tout moment.
              En cas de changement important, nous vous en informerons par courriel ou via une notification dans l application.
              La version en vigueur est toujours disponible sur cette page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Contact</h2>
            <p>
              Pour toute question, ecrivez-nous a{' '}
              <a href="mailto:contact@studiogen.ca" className="text-violet-600 hover:underline">contact@studiogen.ca</a>
              {' '}ou visitez{' '}
              <Link href="/" className="text-violet-600 hover:underline">studiogen.ca</Link>.
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
