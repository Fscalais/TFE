function Legal() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-900 font-sans">
      <h1 className="text-3xl font-bold mb-6">Mentions légales & Conditions d’utilisation</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Propriété du site</h2>
        <p>Le site MatchMate est édité par Florian Scalais.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Collecte et traitement des données personnelles</h2>
        <p>
          Nous collectons uniquement les données nécessaires au bon fonctionnement du site et à l'amélioration de nos services, notamment : pseudo, email, préférences de jeu, niveau, etc.
          Ces données sont utilisées dans le respect du RGPD (Règlement Général sur la Protection des Données).
        </p>
        <p>
          Vous avez un droit d'accès, de rectification, d'effacement et de portabilité de vos données, ainsi que le droit de limiter leur traitement. Pour exercer ces droits, contactez-nous à l’adresse : contact@matchmate.com
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Sécurité des données</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données contre tout accès non autorisé, altération ou divulgation.
          Le site utilise le protocole HTTPS pour garantir un chiffrement sécurisé des échanges entre votre navigateur et notre serveur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Responsabilités</h2>
        <p>
          MatchMate ne peut être tenu responsable des éventuels dysfonctionnements liés à des facteurs externes, ni des dommages directs ou indirects résultant de l’utilisation du site.
          Nous nous efforçons de maintenir le site disponible et sécurisé, mais certains risques résiduels peuvent exister.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. Cookies</h2>
        <p>
          Le site utilise des cookies pour améliorer votre expérience utilisateur et réaliser des statistiques anonymes.
          Vous pouvez configurer votre navigateur pour refuser les cookies, cependant certaines fonctionnalités pourraient ne plus fonctionner correctement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
        <p>
          Pour toute question relative à la protection des données ou aux présentes mentions, contactez-nous à : contact@matchmate.com
        </p>
      </section>
    </div>
  );
}

export default Legal;
