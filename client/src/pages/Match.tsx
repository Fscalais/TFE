import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import ChatRoom from "../components/ChatRoom";
import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Languages,
  Gamepad2,
  Users,
  Smile,
  TimerReset,
  Search,
  XCircle,
  RefreshCw,
} from "lucide-react";

const roles = ["Top", "Jungle", "Mid", "ADC", "Support"];
const moods = ["Casual", "Compétitif", "Fun", "Tryhard"];
const languages = ["Français", "Anglais", "Espagnol", "Allemand"];
const teamSizes = [1, 2, 3, 4];
const ranks = [
  "Fer","Bronze","Argent","Or","Platine","Émeraude","Diamant","Maître","GrandMaître","Challenger",
];

function Match() {
  const { user, loading } = useAuth();
  const userId = user?._id;
  const socket = useSocket();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedRank, setSelectedRank] = useState<string>("");
  const [teamSize, setTeamSize] = useState<number>(1);

  const [searching, setSearching] = useState(false);
  const [matchTeam, setMatchTeam] = useState<
    { userId: string; roles: string[]; languages: string[]; moods: string[]; rank?: string }[] | null
  >(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [discordInvite, setDiscordInvite] = useState<string | null>(null);

  const [searchTime, setSearchTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searching) {
      setSearchTime(0);
      intervalRef.current = setInterval(() => setSearchTime((p) => p + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [searching]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startSearch = () => {
    if (!socket) return;
    if (!userId) return alert("Tu dois être connecté pour lancer une recherche.");
    if (selectedLanguages.length === 0) return alert("Choisis au moins une langue.");
    if (selectedRoles.length === 0 || selectedRoles.length > 2) return alert("Choisis 1 à 2 rôles maximum.");
    if (selectedMoods.length === 0) return alert("Choisis au moins un mood.");
    if (!selectedRank) return alert("Choisis un rang.");

    setSearching(true);
    setMatchTeam(null);
    setRoomId(null);
    setDiscordInvite(null);

    socket.emit("startSearch", {
      userId,
      languages: selectedLanguages,
      roles: selectedRoles,
      moods: selectedMoods,
      teamSize,
      rank: selectedRank,
    });
  };

  const stopSearch = () => {
    if (!socket) return;
    socket.emit("stopSearch");
    setSearching(false);
    setMatchTeam(null);
    setRoomId(null);
    setDiscordInvite(null);
  };

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => console.log("Connecté au serveur socket", socket.id);
    const onMatchFound = (data: any) => {
      console.log("Match trouvé !", data);
      setMatchTeam(data.team);
      setRoomId(data.roomId);
      setDiscordInvite(data.discordInvite || null);
      setSearching(false);
    };
    const onDisconnect = () => {
      console.log("Déconnecté du serveur socket");
      setSearching(false);
      setMatchTeam(null);
      setRoomId(null);
      setDiscordInvite(null);
    };

    socket.on("connect", onConnect);
    socket.on("matchFound", onMatchFound);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("matchFound", onMatchFound);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  const leaveChat = () => {
    setRoomId(null);
    setMatchTeam(null);
    setDiscordInvite(null);
  };

  const toggle = (
    value: string,
    set: React.Dispatch<React.SetStateAction<string[]>>,
    limit?: number
  ) => {
    set((prev) => {
      const has = prev.includes(value);
      if (has) return prev.filter((v) => v !== value);
      if (limit && prev.length >= limit) return prev;
      return [...prev, value];
    });
  };

  if (loading) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800">
      <div className="w-full max-w-4xl px-4 py-10">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Recherche de coéquipiers
          </h1>
          <p className="text-indigo-200/90 mt-2">Système de matchmaking basé sur tes critères.</p>
        </motion.header>

        <div className="grid md:grid-cols-2 gap-6 place-items-center">
          {!searching && !matchTeam && !roomId && (
            <motion.form
              onSubmit={(e) => { e.preventDefault(); startSearch(); }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-2 w-full max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-indigo-100 font-medium mb-2">
                    <Languages className="w-5 h-5" /> Langues
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((l) => {
                      const active = selectedLanguages.includes(l);
                      return (
                        <button
                          type="button"
                          key={l}
                          onClick={() => toggle(l, setSelectedLanguages)}
                          className={`px-3 py-2 rounded-xl text-sm border transition ${
                            active
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-slate-900/60 text-indigo-100 border-white/15 hover:border-white/30"
                          }`}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-indigo-100 font-medium mb-2">
                    <Gamepad2 className="w-5 h-5" /> Rôles (max 2)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => {
                      const active = selectedRoles.includes(r);
                      const disabled = !active && selectedRoles.length >= 2;
                      return (
                        <button
                          type="button"
                          key={r}
                          disabled={disabled}
                          onClick={() => toggle(r, setSelectedRoles, 2)}
                          className={`px-3 py-2 rounded-xl text-sm border transition ${
                            active
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : disabled
                              ? "bg-slate-900/30 text-indigo-300 border-white/10 cursor-not-allowed"
                              : "bg-slate-900/60 text-indigo-100 border-white/15 hover:border-white/30"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-indigo-100 font-medium mb-2">
                    <Smile className="w-5 h-5" /> Moods
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {moods.map((m) => {
                      const active = selectedMoods.includes(m);
                      return (
                        <button
                          type="button"
                          key={m}
                          onClick={() => toggle(m, setSelectedMoods)}
                          className={`px-3 py-2 rounded-xl text-sm border transition ${
                            active
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-slate-900/60 text-indigo-100 border-white/15 hover:border-white/30"
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-indigo-100 font-medium mb-2">Rang</label>
                  <div className="flex flex-wrap gap-2">
                    {ranks.map((rk) => {
                      const active = selectedRank === rk;
                      return (
                        <button
                          type="button"
                          key={rk}
                          onClick={() => setSelectedRank(rk)}
                          className={`px-3 py-2 rounded-xl text-sm border transition ${
                            active
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-slate-900/60 text-indigo-100 border-white/15 hover:border-white/30"
                          }`}
                        >
                          {rk}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-indigo-100 font-medium mb-2">
                    <Users className="w-5 h-5" /> Nombre de coéquipiers à trouver
                  </label>
                  <select
                    className="w-full bg-slate-900/60 text-white border border-white/15 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 [color-scheme:dark]"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                  >
                    {teamSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-900/30"
                >
                  <Search className="w-5 h-5" /> Lancer la recherche
                </button>

                <div className="flex flex-wrap gap-2 text-xs text-indigo-200/80">
                  <span className="px-2 py-1 rounded bg-white/10">Rôles: {selectedRoles.join(", ") || "—"}</span>
                  <span className="px-2 py-1 rounded bg-white/10">Langues: {selectedLanguages.join(", ") || "—"}</span>
                  <span className="px-2 py-1 rounded bg-white/10">Moods: {selectedMoods.join(", ") || "—"}</span>
                  <span className="px-2 py-1 rounded bg-white/10">Rang: {selectedRank || "—"}</span>
                  <span className="px-2 py-1 rounded bg-white/10">Coéquipiers: {teamSize}</span>
                </div>
              </div>
            </motion.form>
          )}

          <AnimatePresence>
            {searching && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="col-span-2 max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl text-center"
              >
                <div className="relative mx-auto mb-6 h-56 w-56">
                  <div className="absolute inset-0 rounded-full border border-indigo-300/40" />
                  <div className="absolute inset-4 rounded-full border border-indigo-300/30 animate-ping" />
                  <div className="absolute inset-8 rounded-full border border-indigo-300/20 animate-pulse" />
                  <div className="absolute inset-12 rounded-full bg-indigo-400/20 blur-xl" />
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  >
                    <RefreshCw className="w-10 h-10 text-indigo-200" />
                  </motion.div>
                </div>

                <div className="flex items-center justify-center gap-2 text-indigo-100">
                  <TimerReset className="w-5 h-5" />
                  <span className="text-lg font-semibold">{formatTime(searchTime)}</span>
                </div>
                <p className="mt-2 text-indigo-200/90">Recherche de joueurs en cours…</p>

                <button
                  onClick={stopSearch}
                  className="mt-6 inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium py-2.5 px-4 rounded-xl transition shadow-lg shadow-rose-900/30"
                >
                  <XCircle className="w-5 h-5" /> Arrêter la recherche
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!searching && matchTeam && !roomId && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-2 max-w-2xl mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Match trouvé !</h2>
              <ul className="grid md:grid-cols-2 gap-3">
                {matchTeam.map((player) => (
                  <li
                    key={player.userId}
                    className="rounded-xl bg-slate-900/60 border border-white/10 p-4 text-indigo-100"
                  >
                    <div className="font-semibold">Joueur: {player.userId}</div>
                    <div className="text-indigo-200/90 text-sm mt-1">
                      Rôles: <span className="font-medium">{player.roles?.join(", ")}</span>{" "}
                      · Langues: {player.languages?.join(", ")} · Moods: {player.moods?.join(", ")} · Rang: {player.rank ?? "—"}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-4 rounded-xl transition"
                  onClick={() => {
                    setMatchTeam(null);
                    setSearching(false);
                    setSelectedLanguages([]);
                    setSelectedRoles([]);
                    setSelectedMoods([]);
                    setSelectedRank("");
                    setTeamSize(1);
                    setDiscordInvite(null);
                  }}
                >
                  Rechercher un autre match
                </button>
              </div>
            </motion.div>
          )}

          {roomId && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="col-span-2">
              <ChatRoom discordInvite={discordInvite} onLeave={leaveChat} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Match;
