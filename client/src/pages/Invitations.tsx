import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

// Types
type TeamInvite = {
  _id: string; // team id
  name: string;
  description?: string;
  creator?: { username: string };
};

type AppNotification = {
  _id: string;
  type?: string; // "scrim" | "team" | "system" | ...
  text: string;
  createdAt?: string;
  read?: boolean;
  link?: string; // optionnel
};

export default function NotificationsPage() {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [invRes, notifRes] = await Promise.all([
          api.get("/teams/invitations"),
          // Si l'API notifications n'existe pas encore, on ignore l'erreur
          api.get("/notifications").catch(() => ({ data: [] })),
        ]);
        setInvites(invRes.data || []);
        setNotifications((notifRes.data || []).map((n: any) => ({
          _id: n._id ?? String(Math.random()),
          text: n.text ?? n.message ?? "",
          createdAt: n.createdAt,
          read: n.read,
          type: n.type,
          link: n.link,
        })));
      } catch (e) {
        setError("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const acceptInvite = async (teamId: string) => {
    setBusyId(teamId);
    try {
      await api.post(`/teams/${teamId}/accept`);
      setInvites((prev) => prev.filter((i) => i._id !== teamId));
    } catch {
      alert("Impossible d'accepter l'invitation");
    } finally {
      setBusyId(null);
    }
  };

  const declineInvite = async (teamId: string) => {
    setBusyId(teamId);
    try {
      await api.post(`/teams/${teamId}/decline`);
      setInvites((prev) => prev.filter((i) => i._id !== teamId));
    } catch {
      alert("Impossible de refuser l'invitation");
    } finally {
      setBusyId(null);
    }
  };

  const markAsRead = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/notifications/${id}/read`).catch(() => undefined);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } finally {
      setBusyId(null);
    }
  };

  const markAllAsRead = async () => {
    setBusyId("__all__");
    try {
      await api.post(`/notifications/read-all`).catch(() => undefined);
    } finally {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setBusyId(null);
    }
  };

  const fmt = (d?: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">🔔 Notifications</h1>
            <p className="mt-1 text-sm text-slate-300">Invitations d'équipes et notifications récentes.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              disabled={busyId === "__all__" || notifications.length === 0}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              Tout marquer comme lu
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 h-5 w-2/3 rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Invitations */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-3 text-xl font-semibold">✉️ Invitations d'équipe</h2>
              {invites.length === 0 ? (
                <p className="text-slate-300">Aucune invitation reçue.</p>
              ) : (
                <ul className="space-y-3">
                  {invites.map((t) => (
                    <li key={t._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-sm text-slate-300">
                            {t.description || "Pas de description"}
                            {t.creator?.username ? (
                              <>
                                {" "}• Créée par <span className="text-indigo-300">{t.creator.username}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptInvite(t._id)}
                            disabled={busyId === t._id}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => declineInvite(t._id)}
                            disabled={busyId === t._id}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-60"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Notifications */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-3 text-xl font-semibold">🪧 Autres notifications</h2>
              {notifications.length === 0 ? (
                <p className="text-slate-300">Aucune notification.</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((n) => (
                    <li key={n._id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <p className={`text-sm ${n.read ? "text-slate-400" : "text-slate-100"}`}>{n.text}</p>
                        {n.createdAt && (
                          <p className="mt-1 text-xs text-slate-400">{fmt(n.createdAt)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {n.link ? (
                          <Link to={n.link} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">Ouvrir</Link>
                        ) : null}
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n._id)}
                            disabled={busyId === n._id}
                            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
