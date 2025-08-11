import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

// Types
export type Team = {
  _id: string;
  name: string;
  description?: string;
  members: string[];
};

export default function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data } = await api.get("/teams");
        setTeams(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Erreur lors du chargement des équipes");
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return teams;
    const q = query.toLowerCase();
    return teams.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }, [teams, query]);

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top bar */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">🎮 Mes équipes</h1>
            <p className="text-sm text-slate-400">Créez vos équipes et partez en Scrim !</p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une équipe…"
              className="w-full md:w-72 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
            />

            <Link
              to="/teams/create"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
            >
              + Créer
            </Link>

            <Link
              to="/scrims"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
            >
              Scrims
            </Link>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 h-5 w-2/3 rounded bg-white/10 animate-pulse" />
                <div className="mb-2 h-4 w-full rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <section className="mt-14 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-10 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">🧩</div>
            <h3 className="text-lg font-medium">Aucune équipe trouvée</h3>
            <p className="mt-1 text-sm text-slate-300">
              Essayez un autre terme de recherche ou créez une nouvelle équipe.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link to="/teams/create" className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">
                Créer une équipe
              </Link>
              <Link to="/scrims" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10">
                Explorer les scrims
              </Link>
            </div>
          </section>
        )}

        {/* Grid of teams */}
        {!loading && !error && filtered.length > 0 && (
          <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((team) => (
              <Link
                key={team._id}
                to={`/teams/${team._id}`}
                className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition hover:border-white/20 hover:bg-white/10"
              >
                <header className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="truncate text-lg font-semibold">{team.name}</h2>
                  <span className="text-xs text-indigo-300 opacity-0 transition group-hover:opacity-100">Voir →</span>
                </header>
                <p className="text-sm text-slate-300 line-clamp-2">{team.description || "Pas de description"}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">👥 {team.members?.length || 0} membre{(team.members?.length || 0) > 1 ? "s" : ""}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1">Équipe</span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
