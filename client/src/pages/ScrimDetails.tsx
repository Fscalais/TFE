import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

type Team = { _id: string; name: string };

type RequestItem = {
  _id: string;
  teamId: Team;
  status: string;
  requestedAt: string;
};

type Scrim = {
  _id: string;
  teamA: Team;
  teamB?: Team;
  datetime: string;
  matchType: string;
  minRank: string;
  status: "open" | "pending" | "confirmed" | "cancelled" | "finished";
  requests?: RequestItem[];
  discordInvite?: string | null;
};

const Badge = ({
  children,
  tone = "indigo",
}: {
  children: React.ReactNode;
  tone?: "indigo" | "emerald" | "rose" | "slate" | "violet";
}) => {
  const tones: Record<string, string> = {
    indigo: "text-indigo-200 bg-indigo-500/10 border-indigo-400/30",
    emerald: "text-emerald-200 bg-emerald-500/10 border-emerald-400/30",
    rose: "text-rose-200 bg-rose-500/10 border-rose-400/30",
    slate: "text-slate-200 bg-white/5 border-white/10",
    violet: "text-violet-200 bg-violet-500/10 border-violet-400/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const niceDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const ScrimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scrim, setScrim] = useState<Scrim | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReq, setLoadingReq] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      try {
        setLoading(true);
        const { data: scr } = await api.get(`/scrims/${id}`);
        setScrim(scr);

        const { data: teams } = await api.get("/teams");
        setMyTeams(teams);

        setErr(null);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Erreur chargement du scrim");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const isHost = useMemo(() => {
    if (!scrim) return false;
    return myTeams.some((t) => t._id === scrim.teamA._id);
  }, [scrim, myTeams]);

  const canSeeRequests = isHost && scrim?.status !== "finished" && scrim?.status !== "cancelled";

  const fetchRequests = async () => {
    if (!id) return;
    try {
      setLoadingReq(true);
      const { data } = await api.get(`/scrims/${id}/requests`);
      setRequests(data);
    } catch {
    } finally {
      setLoadingReq(false);
    }
  };

  useEffect(() => {
    if (canSeeRequests) fetchRequests();
  }, [canSeeRequests]);

  const handleRespond = async (requestId: string, action: "accept" | "reject") => {
    if (!id) return;
    setMsg(null);
    try {
      await api.post(`/scrims/${id}/respond`, { requestId, action });
      setMsg(`Demande ${action}ée avec succès.`);
      const { data: scr } = await api.get(`/scrims/${id}`);
      setScrim(scr);
      if (canSeeRequests) fetchRequests();
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const generateDiscord = async () => {
    if (!id) return;
    try {
      const { data } = await api.post(`/scrims/${id}/discord`);
      setScrim((s) => (s ? { ...s, discordInvite: data.invite } : s));
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erreur génération de l'invite");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
        <div className="mx-auto max-w-5xl px-6 py-10">Chargement…</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
        <div className="mx-auto max-w-5xl px-6 py-10 text-rose-300">{err}</div>
      </div>
    );
  }
  if (!scrim) return null;

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight"> Détail du scrim</h1>
            <p className="mt-1 text-sm text-slate-300">
              Gérez les demandes et suivez l’état de votre match planifié.
            </p>
          </div>
          <Link
            to="/scrims"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Retour
          </Link>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-300">Équipe créatrice</div>
              <div className="mt-1 text-lg font-semibold">{scrim.teamA.name}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-300">Équipe adverse</div>
              <div className="mt-1 text-lg font-semibold">
                {scrim.teamB?.name || "En attente d'adversaire"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-300">Date</div>
              <div className="mt-1 font-medium">{niceDate(scrim.datetime)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-300">Badges</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="violet">{scrim.matchType.toUpperCase()}</Badge>
                <Badge tone="indigo">Rang min: {scrim.minRank}</Badge>
                {scrim.status === "open" && <Badge tone="emerald">Ouvert</Badge>}
                {scrim.status !== "open" && <Badge tone="rose">{scrim.status}</Badge>}
              </div>
            </div>
          </div>
        </section>

        {scrim.status === "confirmed" && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="mb-3 text-2xl font-semibold"> Salon Discord</h2>
            {scrim.discordInvite ? (
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={scrim.discordInvite}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow"
                >
                  Rejoindre le salon
                </a>
                <code className="rounded bg-black/30 px-2 py-1 text-xs">{scrim.discordInvite}</code>
              </div>
            ) : isHost ? (
              <button
                onClick={generateDiscord}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
              >
                Générer le salon Discord
              </button>
            ) : (
              <p className="text-slate-300">
                Le salon Discord sera bientôt disponible. Contactez l’hôte si besoin.
              </p>
            )}
          </section>
        )}

        {canSeeRequests && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold"> Demandes reçues</h2>
              <button
                onClick={fetchRequests}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                Rafraîchir
              </button>
            </div>

            {msg && (
              <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
                {msg}
              </div>
            )}

            {loadingReq ? (
              <div className="text-slate-300">Chargement…</div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
                Aucune demande en attente.
              </div>
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li
                    key={r._id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-lg font-semibold">{r.teamId.name}</div>
                      <div className="text-sm text-slate-300">
                        Demandé le {niceDate(r.requestedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(r._id, "accept")}
                        className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleRespond(r._id, "reject")}
                        className="rounded-xl bg-rose-500/90 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-500"
                      >
                        Refuser
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="mt-6">
          <Link
            to="/scrims"
            className="text-indigo-300 hover:text-indigo-200 hover:underline"
          >
            ← Retour à la liste des scrims
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ScrimDetail;
