import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Modal from "../components/Modal";

interface Team {
  _id: string;
  name: string;
}

interface Request {
  _id: string;
  teamId: { _id: string; name: string };
  status: string;
  requestedAt: string;
}

interface Scrim {
  _id: string;
  teamA: Team;
  datetime: string;
  matchType: string;
  minRank: string;
  status: string;
  requests?: Request[];
}

export default function Scrims() {
  const [communityScrims, setCommunityScrims] = useState<Scrim[]>([]);
  const [myScrims, setMyScrims] = useState<Scrim[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedScrimId, setSelectedScrimId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchScrimsAndTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamsRes, communityRes, myRes] = await Promise.all([
          api.get("/teams"),
          api.get("/scrims"),
          api.get("/scrims/my"),
        ]);
        const userTeams: Team[] = teamsRes.data;
        setTeams(userTeams);
        const filteredCommunityScrims = communityRes.data.filter(
          (scrim: Scrim) => !userTeams.some((team) => team._id === scrim.teamA._id)
        );
        setCommunityScrims(filteredCommunityScrims);
        setMyScrims(myRes.data);
      } catch (err) {
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchScrimsAndTeams();
  }, []);

  const openModal = (scrimId: string) => {
    setSelectedScrimId(scrimId);
    setSelectedTeamId(null);
    setRequestError(null);
    setRequestSuccess(null);
    setModalOpen(true);
  };

  const sendRequest = async () => {
    if (!selectedScrimId || !selectedTeamId) return;
    setRequesting(true);
    setRequestError(null);
    setRequestSuccess(null);
    try {
      await api.post(`/scrims/${selectedScrimId}/request`, { teamId: selectedTeamId });
      setRequestSuccess("Demande envoyée avec succès !");
      const communityRes = await api.get("/scrims");
      const filteredCommunityScrims = communityRes.data.filter(
        (scrim: Scrim) => !teams.some((team) => team._id === scrim.teamA._id)
      );
      setCommunityScrims(filteredCommunityScrims);
      setModalOpen(false);
    } catch (error: any) {
      setRequestError(error.response?.data?.message || "Erreur lors de la demande");
    } finally {
      setRequesting(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
        (status.toLowerCase() === "open"
          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          : status.toLowerCase() === "closed"
          ? "bg-rose-500/15 text-rose-200 border border-rose-500/30"
          : "bg-white/10 text-slate-200 border border-white/10")
      }
    >
      {status}
    </span>
  );

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold"> Scrims</h1>
            <p className="text-sm text-slate-300">Trouvez des adversaires et gérez vos demandes.</p>
          </div>
          <Link
            to="/scrims/create"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
          >
            Créer un scrim
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 h-5 w-2/3 rounded bg-white/10 animate-pulse" />
                <div className="mb-2 h-4 w-full rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold">Mes scrims</h2>
              {myScrims.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
                  Vous n'avez pas encore créé de scrims.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {myScrims.map((scrim) => (
                    <Link
                      key={scrim._id}
                      to={`/scrims/${scrim._id}`}
                      className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="truncate text-lg font-medium">{scrim.teamA.name}</h3>
                        <StatusBadge status={scrim.status} />
                      </div>
                      <p className="text-sm text-slate-300">
                        {new Date(scrim.datetime).toLocaleString()} • {scrim.matchType.toUpperCase()} • Rang min : {scrim.minRank}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">Scrims communautaires</h2>
              {communityScrims.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
                  Aucun scrim disponible.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {communityScrims.map((scrim) => {
                    const alreadyRequested = scrim.requests?.some((r) =>
                      teams.some((t) => t._id === r.teamId._id)
                    );
                    return (
                      <div
                        key={scrim._id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="truncate text-lg font-medium">{scrim.teamA.name}</h3>
                          <StatusBadge status={scrim.status} />
                        </div>
                        <p className="text-sm text-slate-300">
                          {new Date(scrim.datetime).toLocaleString()} • {scrim.matchType.toUpperCase()} • Rang min : {scrim.minRank}
                        </p>
                        <div className="mt-4 flex items-center justify-end">
                          <button
                            onClick={() => openModal(scrim._id)}
                            disabled={!!alreadyRequested}
                            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                              alreadyRequested
                                ? "bg-white/10 text-slate-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-95"
                            }`}
                          >
                            {alreadyRequested ? "Déjà demandé" : "Demander ce scrim"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
  <div className="-m-6 rounded-2xl border border-white/10 bg-[#0e1333]/90 p-6 text-slate-100 backdrop-blur-xl">
    <h3 className="mb-4 text-xl font-semibold">Demander ce scrim</h3>

    {requestError && (
      <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
        {requestError}
      </div>
    )}
    {requestSuccess && (
      <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
        {requestSuccess}
      </div>
    )}

    <label htmlFor="team-select" className="mb-2 block text-sm">Choisir une équipe :</label>
    <select
      id="team-select"
      value={selectedTeamId ?? ""}
      onChange={(e) => setSelectedTeamId(e.target.value)}
      className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
    >
      <option value="" disabled>-- Sélectionner une équipe --</option>
      {teams.map((team) => (
        <option key={team._id} value={team._id}>{team.name}</option>
      ))}
    </select>

    <div className="flex justify-end gap-2">
      <button
        onClick={() => setModalOpen(false)}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
      >
        Annuler
      </button>
      <button
        onClick={sendRequest}
        disabled={requesting || !selectedTeamId}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
      >
        {requesting ? "Envoi…" : "Envoyer la demande"}
      </button>
    </div>
  </div>
</Modal>
      </div>
    </div>
  );
}

