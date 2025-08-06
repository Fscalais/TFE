import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import ChatRoom from "../components/ChatRoom";

const roles = ["Top", "Jungle", "Mid", "ADC", "Support"];
const moods = ["Casual", "Compétitif", "Fun", "Tryhard"];
const languages = ["Français", "Anglais", "Espagnol", "Allemand"];
const teamSizes = [1, 2, 3, 4];

const socket: Socket = io("http://localhost:5000"); // adapte si besoin

function Match() {
  const { user } = useAuth();
  const userId = user?.id;

  const [language, setLanguage] = useState<string>("");
  const [role, setRole] = useState<string>(roles[0]);
  const [mood, setMood] = useState<string>(moods[0]);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [searching, setSearching] = useState(false);
  const [matchTeam, setMatchTeam] = useState<
    { userId: string; role: string; language: string; mood: string }[] | null
  >(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [discordInvite, setDiscordInvite] = useState<string | null>(null);

  const [searchTime, setSearchTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searching) {
      setSearchTime(0);
      intervalRef.current = setInterval(() => {
        setSearchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searching]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startSearch = () => {
    if (!userId) {
      alert("Tu dois être connecté pour lancer une recherche.");
      return;
    }
    if (!language) {
      alert("Merci de choisir une langue.");
      return;
    }

    setSearching(true);
    setMatchTeam(null);
    setRoomId(null);
    setDiscordInvite(null);

    socket.emit("startSearch", {
      userId,
      language,
      role,
      mood,
      teamSize,
    });
  };

  const stopSearch = () => {
    socket.emit("stopSearch");
    setSearching(false);
    setMatchTeam(null);
    setRoomId(null);
    setDiscordInvite(null);
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connecté au serveur socket", socket.id);
    });

    socket.on("matchFound", (data) => {
      console.log("Match trouvé !", data);
      setMatchTeam(data.team);
      setRoomId(data.roomId); // ID de la room pour le chat
      setDiscordInvite(data.discordInvite || null); // lien Discord
      setSearching(false);
    });

    socket.on("disconnect", () => {
      console.log("Déconnecté du serveur socket");
      setSearching(false);
      setMatchTeam(null);
      setRoomId(null);
      setDiscordInvite(null);
    });

    return () => {
      socket.off("connect");
      socket.off("matchFound");
      socket.off("disconnect");
    };
  }, []);

  const leaveChat = () => {
    setRoomId(null);
    setMatchTeam(null);
    setDiscordInvite(null);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">
        Recherche de coéquipiers
      </h1>
      <p className="mb-6">Système de matchmaking basé sur tes critères.</p>

      {!searching && !matchTeam && !roomId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startSearch();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-semibold">Langue :</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              required
            >
              <option value="">-- Choisir une langue --</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Mon rôle :</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Mood :</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              {moods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold">
              Nombre de coéquipiers à trouver :
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
            >
              {teamSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
          >
            Lancer la recherche
          </button>
        </form>
      )}

      {searching && (
        <div className="text-center mt-6 space-y-4">
          <p>Recherche de joueurs en cours...</p>
          <p>Temps écoulé : {formatTime(searchTime)}</p>

          <button
            onClick={stopSearch}
            className="mt-2 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
          >
            Arrêter la recherche
          </button>
        </div>
      )}

      {roomId && matchTeam && (
        <ChatRoom
          socket={socket}
          roomId={roomId}
          userId={userId!}
          discordInvite={discordInvite}
          onLeave={leaveChat}
        />
      )}

      {!searching && matchTeam && !roomId && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Match trouvé !</h2>
          <ul className="list-disc list-inside">
            {matchTeam.map((player) => (
              <li key={player.userId}>
                Joueur: {player.userId} - Rôle: {player.role} - Langue:{" "}
                {player.language} - Mood: {player.mood}
              </li>
            ))}
          </ul>

          <button
            className="mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            onClick={() => {
              setMatchTeam(null);
              setSearching(false);
              setLanguage("");
              setRole(roles[0]);
              setMood(moods[0]);
              setTeamSize(1);
              setDiscordInvite(null);
            }}
          >
            Rechercher un autre match
          </button>
        </div>
      )}
    </div>
  );
}

export default Match;

