import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// Types
type Member = { _id: string; username: string };
type User = { _id: string; username: string };
type Team = {
  _id: string;
  name: string;
  description?: string;
  members: Member[];
  creator: Member;
};

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = (useAuth() as { user: User | null; logout: () => void }) || {};

  const [team, setTeam] = useState<Team | null>(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showTransfer, setShowTransfer] = useState(false);
  const [newCreatorId, setNewCreatorId] = useState<string>("");
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Derived flags
  const isOnlyMember = !!team && team.members.length === 1 && user?._id === team.creator._id && team.members[0]._id === user?._id;

  // Fetch team
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await api.get(`/teams/${id}`);
        setTeam(data);
      } catch (err) {
        setError("Impossible de charger l'équipe.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [id]);

  // Invite member
  const handleInvite = async () => {
    if (!inviteUsername.trim() || !id) return;
    try {
      setInviting(true);
      setMessage(null);
      setError(null);
      await api.post(`/teams/${id}/invite`, { username: inviteUsername.trim() });
      setMessage("Invitation envoyée !");
      setInviteUsername("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l’invitation");
    } finally {
      setInviting(false);
    }
  };

  // Creator clicks leave -> transfer or delete if alone
  const onCreatorLeaveClick = () => {
    if (!team) return;
    if (team.members.length <= 1) {
      setShowDelete(true); // seul membre → proposer suppression
      return;
    }
    setShowTransfer(true);
  };

  // Confirm transfer then leave (creator only)
  const handleConfirmLeave = async () => {
    if (!team || !user || !id) return;
    if (!newCreatorId) {
      alert("Veuillez choisir un membre pour devenir le nouveau créateur.");
      return;
    }
    try {
      setLeaving(true);
      setMessage(null);
      setError(null);
      await api.post(`/teams/${id}/transfer-creator`, { newCreatorId });
      await api.post(`/teams/${id}/leave`);
      setMessage("Vous avez quitté l’équipe.");
      setTeam(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors du départ de l’équipe");
    } finally {
      setLeaving(false);
      setShowTransfer(false);
    }
  };

  // Non-creator leave directly
  const handleLeaveTeam = async () => {
    if (!team || !user || !id) return;
    const isCreator = user._id === team.creator._id;
    if (isCreator) return onCreatorLeaveClick();
    try {
      setLeaving(true);
      setMessage(null);
      setError(null);
      await api.post(`/teams/${id}/leave`);
      setMessage("Vous avez quitté l’équipe.");
      setTeam(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors du départ de l’équipe");
    } finally {
      setLeaving(false);
    }
  };

  // Delete team (only member)
  const handleDeleteTeam = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      setError(null);
      setMessage(null);
      await api.delete(`/teams/${id}`);
      setShowDelete(false);
      navigate("/teams");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de la suppression de l’équipe");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#171c3a] via-[#111739] to-[#0b1029]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-2 h-7 w-1/3 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-3 h-5 w-1/5 rounded bg-white/10 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-white/10 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {!loading && team && (
          <>
            {/* Header card */}
            <section className="mb-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <h1 className="text-3xl font-semibold">{team.name}</h1>
              <p className="mt-1 text-sm text-slate-300">{team.description || "Pas de description"}</p>
            </section>

            {/* Messages */}
            {error && (
              <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
            )}
            {message && (
              <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Members */}
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-3 text-xl font-semibold">👥 Membres</h2>
                <ul className="space-y-2">
                  {team.members.map((m) => (
                    <li key={m._id} className="flex items-center justify-between">
                      <Link
                        to={`/users/${m._id}`}
                        className="truncate text-indigo-300 hover:text-indigo-200 hover:underline"
                        title={`Voir le profil de ${m.username}`}
                      >
                        {m.username}
                      </Link>
                      {team.creator._id === m._id && (
                        <span className="ml-2 inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-xs text-amber-200">
                          Créateur
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Invite */}
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-3 text-xl font-semibold">✉️ Inviter un membre</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteUsername.trim()}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {inviting ? "Envoi…" : "Inviter"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">L'utilisateur doit exister sur la plateforme.</p>
              </section>

              {/* Danger zone */}
              <section className="md:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-base font-medium text-rose-200">Zone sensible</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleLeaveTeam}
                    disabled={leaving}
                    className="rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {leaving ? "Traitement…" : "Quitter l'équipe"}
                  </button>

                  {isOnlyMember && (
                    <button
                      onClick={() => setShowDelete(true)}
                      disabled={deleting}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-rose-200 hover:bg-white/10 disabled:opacity-60"
                    >
                      {deleting ? "Suppression…" : "Supprimer l'équipe"}
                    </button>
                  )}
                </div>
                {isOnlyMember && (
                  <p className="mt-2 text-xs text-slate-400">Vous êtes le seul membre : vous pouvez supprimer définitivement l’équipe.</p>
                )}
              </section>
            </div>
          </>
        )}

        {!loading && !team && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Équipe introuvable ou vous l'avez quittée.
          </div>
        )}
      </div>

      {/* Transfer modal */}
      {showTransfer && team && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1333]/90 p-6 backdrop-blur-xl text-slate-100">
            <h3 className="mb-4 text-xl font-semibold">Choisissez le nouveau créateur</h3>
            <select
              className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={newCreatorId}
              onChange={(e) => setNewCreatorId(e.target.value)}
            >
              <option value="">-- Sélectionnez un membre --</option>
              {team.members
                .filter((m) => m._id !== team.creator._id)
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.username}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTransfer(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLeave}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1333]/90 p-6 backdrop-blur-xl text-slate-100">
            <h3 className="mb-2 text-xl font-semibold">Supprimer l'équipe ?</h3>
            <p className="mb-4 text-sm text-slate-300">Cette action est <span className="text-rose-300">irréversible</span>. Toutes les données liées à cette équipe seront supprimées.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={deleting}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
