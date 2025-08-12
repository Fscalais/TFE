import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

interface Team {
  _id: string;
  name: string;
}

export default function CreateScrim() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [minRank, setMinRank] = useState("bronze");
  const [matchType, setMatchType] = useState("bo1");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get("/teams");
        setTeams(res.data);
        if (res.data.length > 0) setSelectedTeamId(res.data[0]._id);
      } catch (err) {
        setError("Erreur lors du chargement des équipes");
      } finally {
        setFetching(false);
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedTeamId) return setError("Merci de choisir une équipe");
    if (!date || !time) return setError("Merci de choisir la date et l’heure");

    const datetime = new Date(`${date}T${time}:00`).toISOString();

    setLoading(true);
    try {
      await api.post("/scrims", { datetime, matchType, minRank, teamId: selectedTeamId });
      setMessage("✅ Scrim créé ! Redirection…");
      setTimeout(() => navigate("/scrims"), 900);
    } catch {
      setError("Erreur lors de la création du scrim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold"> Créer un scrim</h1>
            <p className="mt-1 text-sm text-slate-300">Planifiez un match et publiez-le à la communauté.</p>
          </div>
          <Link to="/scrims" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Retour</Link>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          {fetching ? (
            <div className="space-y-4">
              <div className="h-10 w-1/2 rounded bg-white/10 animate-pulse" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-10 rounded bg-white/10 animate-pulse" />
                <div className="h-10 rounded bg-white/10 animate-pulse" />
              </div>
              <div className="h-10 rounded bg-white/10 animate-pulse" />
              <div className="h-10 rounded bg-white/10 animate-pulse" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-slate-300">
              Vous n'avez pas encore d'équipe. Créez-en une d'abord pour publier un scrim.
              <div className="mt-4">
                <Link to="/teams/create" className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white">Créer une équipe</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Équipe</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Date de début</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Heure</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Rang minimum</label>
                <select
                  value={minRank}
                  onChange={(e) => setMinRank(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                  <option value="master">Master</option>
                  <option value="grandmaster">Grandmaster</option>
                  <option value="challenger">Challenger</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Type de match</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="bo1">BO1</option>
                  <option value="bo3">BO3</option>
                  <option value="bo5">BO5</option>
                </select>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
              )}
              {message && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow transition disabled:opacity-60"
              >
                {loading ? "Création en cours…" : "Créer le scrim"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
