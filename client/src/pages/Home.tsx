import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    title: "Trouvez vos mates en 2 clics",
    description: "Matchmaking intelligent par rôle, rang et dispo.",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "Scrims organisés, niveau garanti",
    description: "Planifiez des scrims BO1/BO3/BO5, filtrez par rang minimum.",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "Stats propres. Progrès visibles.",
    description: "Suivez vos perfs, champions et historique des matchs.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "Créez votre team. Devenez une référence.",
    description: "Construisez votre identité, recrutez et grimpez la scène.",
    image:
      "https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?auto=format&fit=crop&w=1920&q=80",
  },
];

export default function Home() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(interval);
  }, []);

  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);
  const next = () => setCurrent((p) => (p + 1) % slides.length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1029] via-[#111739] to-[#0b1029] text-slate-100">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,.15),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,.12),transparent_35%)]" />

        <div className="mx-auto max-w-7xl px-6 pt-10 pb-14">
          <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            {slides.map((s, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === current ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <h2 className="text-3xl md:text-4xl font-semibold">
                    <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                      {s.title}
                    </span>
                  </h2>
                  <p className="mt-2 text-slate-200/90 md:text-lg">{s.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to="/match"
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
                    >
                      Lancer un match
                    </Link>
                    <Link
                      to="/scrims"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      Voir les scrims
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={prev}
              aria-label="Précédent"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur hover:bg-black/60"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Suivant"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur hover:bg-black/60"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 w-2 rounded-full ${i === current ? "bg-white" : "bg-white/40"}`}
                  aria-label={`Aller au slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <h3 className="mb-6 text-center text-2xl font-semibold">Contenu</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              title: "Matchmaking intelligent",
              desc: "Rôles, rangs, serveurs et dispo : on filtre pour toi.",
              emoji: "",
            },
            {
              title: "Scrims organisés",
              desc: "BO1/BO3/BO5, rang minimum, demandes, tout au même endroit.",
              emoji: "",
            },
            {
              title: "Stats & historique",
              desc: "K/D/A, champions, durée, vision… tout est suivi.",
              emoji: "",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="text-3xl">{f.emoji}</div>
              <h4 className="mt-2 text-lg font-medium">{f.title}</h4>
              <p className="mt-1 text-sm text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h3 className="text-center text-2xl font-semibold">Comment ça marche</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4">
            {[
              { step: 1, title: "Crée ton profil", text: "Ajoute ton rôle, ton rang et tes dispos." },
              { step: 2, title: "Trouve des mates", text: "Matchmaking affiné selon ton style." },
              { step: 3, title: "Monte une équipe", text: "Invitations, gestion, notifs intégrées." },
              { step: 4, title: "Lance un scrim", text: "Planifie, filtre par rang et joue !" },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold">
                  {s.step}
                </div>
                <h4 className="mt-2 text-base font-medium">{s.title}</h4>
                <p className="mt-1 text-sm text-slate-300">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 p-8 text-center md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-semibold">Prêt à jouer sérieux ?</h3>
            <p className="text-sm text-slate-300">Rejoins la communauté et trouve les bons teammates.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2 text-sm font-medium text-white"
            >
              Inscription gratuite
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm hover:bg-white/10"
            >
              Connexion
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} MatchMate — Tous droits réservés.
        <span className="mx-2">•</span>
        <Link to="/legal" className="underline hover:text-slate-200">Mentions légales</Link>
      </footer>
    </div>
  );
}
