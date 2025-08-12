import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function TeamCreate() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!name.trim()) {
      setError("Le nom de l'équipe est requis.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/teams", { name: name.trim(), description: description.trim() || undefined });
      setMessage("✅ Équipe créée avec succès ! Redirection…");
      setTimeout(() => navigate("/teams"), 900);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold"> Créer une équipe</h1>
          <p className="mt-1 text-sm text-slate-300">Donnez un nom à votre team et une courte description.</p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="team-name" className="mb-1 block text-sm text-slate-300">Nom de l'équipe *</label>
              <input
                id="team-name"
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Crispy Nuggets"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                required
                maxLength={60}
              />
              <p className="mt-1 text-xs text-slate-400">Max 60 caractères.</p>
            </div>

            <div>
              <label htmlFor="team-desc" className="mb-1 block text-sm text-slate-300">Description (optionnelle)</label>
              <textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pitch rapide de l'équipe, jeux joués, dispo, etc."
                rows={4}
                className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
            )}
            {message && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow transition disabled:opacity-60"
              >
                {loading ? "Création…" : "Créer"}
              </button>
              <Link
                to="/teams"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
              >
                Annuler
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}


