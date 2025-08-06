import React, { useState, useEffect } from 'react';

const slides = [
  {
    title: "Rejoignez la communauté MatchMate",
    description: "Trouvez vos coéquipiers idéaux pour chaque partie.",
    image: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Classements et statistiques détaillés",
    description: "Suivez vos performances et améliorez votre jeu.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Créez ou rejoignez des équipes facilement",
    description: "Collaborer et gagnez avec vos amis.",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
  },
];

function Home() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-black text-white font-sans">

      {/* Hero / Slider */}
      <div className="relative h-96 overflow-hidden rounded-b-lg shadow-lg">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out transform
              ${index === current ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-110'}`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'transform 1s ease-in-out',
            }}
          >
            <div className="bg-black bg-opacity-50 h-full flex flex-col justify-center items-center px-6 text-center">
              <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">{slide.title}</h2>
              <p className="max-w-xl mx-auto text-lg drop-shadow">{slide.description}</p>
            </div>
          </div>
        ))}

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`w-4 h-4 rounded-full ${idx === current ? 'bg-indigo-500' : 'bg-gray-400'}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Info cards */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg hover:shadow-indigo-500 transition-shadow">
          <div className="text-indigo-400 text-4xl mb-4">🎮</div>
          <h3 className="text-xl font-bold mb-2">Matchmaking intelligent</h3>
          <p>Trouvez le meilleur coéquipier selon votre style et niveau.</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg hover:shadow-indigo-500 transition-shadow">
          <div className="text-indigo-400 text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2">Statistiques avancées</h3>
          <p>Analysez votre gameplay avec des données complètes et visuelles.</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg hover:shadow-indigo-500 transition-shadow">
          <div className="text-indigo-400 text-4xl mb-4">🤝</div>
          <h3 className="text-xl font-bold mb-2">Communauté active</h3>
          <p>Rejoignez des équipes, discutez et participez à des événements.</p>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-indigo-700 text-white py-16 text-center">
        <h2 className="text-3xl font-extrabold mb-6">Prêt à trouver vos partenaires de jeu ?</h2>
        <div className="space-x-6">
          <a
            href="/register"
            className="inline-block px-8 py-3 bg-indigo-900 rounded-full font-semibold hover:bg-indigo-800 transition"
          >
            Inscription gratuite
          </a>
          <a
            href="/login"
            className="inline-block px-8 py-3 border-2 border-white rounded-full font-semibold hover:bg-white hover:text-indigo-900 transition"
          >
            Connexion
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        © 2025 MatchMate. Tous droits réservés. |{' '}
        <a href="/legal" className="underline hover:text-white">
          Mentions légales
        </a>
      </footer>
    </div>
  );
}

export default Home;

