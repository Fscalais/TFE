import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

type PublicUser = {
  _id?: string;
  id?: string;
  username: string;
  riotSummonerName?: string;
  location?: string;
  age?: number;
  bio?: string;
  rank?: string;
  mood?: string[];
  languages?: string[];
  games?: string[];
  roles?: string[];
};

type Match = {
  matchId: string;
  championName: string;
  role?: string;
  win: boolean;
  kda: { kills: number; deaths: number; assists: number };
  farm: number;
  durationMin: number;
  goldEarned?: number;
  damageDealt?: number;
  visionScore?: number;
  gameMode?: string;
  platformId?: string;
  surrender?: string;
};

type Mastery = {
  championId: number;
  championName: string;
  championPoints: number;
};

const Spinner = () => (
  <div className="flex justify-center items-center mt-20">
    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  </div>
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [riotData, setRiotData] = useState<{ lastMatches?: Match[]; lastMatch?: Match | null; [k: string]: any } | null>(null);
  const [masteries, setMasteries] = useState<Mastery[] | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string>('');
  const [ddragonVersion, setDdragonVersion] = useState<string>('');

  useEffect(() => {
  const fetchVersion = async () => {
    try {
      const res = await fetch(`${API_URL}/api/riot/ddragon/version`);
      if (!res.ok) throw new Error('Erreur version ddragon');
      const { version } = await res.json();
      setDdragonVersion(version);
    } catch {
      setDdragonVersion('13.15.1');
    }
  };
  fetchVersion();
}, []);

  // fetch user public + riot data
  useEffect(() => {
    const run = async () => {
      if (!userId) return;
      try {
        const { data } = await api.get<PublicUser>(`/users/${userId}`);
        setProfile(data);

        if (data.riotSummonerName) {
          const riotRes = await fetch(`${API_URL}/api/riot/data/${encodeURIComponent(data.riotSummonerName)}`);
          if (!riotRes.ok) throw new Error('Erreur récupération données Riot');
          const riotJson = await riotRes.json();
          setRiotData(riotJson);
          setSelectedMatch(riotJson.lastMatch);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Erreur chargement profil public');
      }
    };
    run();
  }, [userId]);

  // mastery
  useEffect(() => {
    const fetchMastery = async (puuid: string) => {
      try {
        const res = await fetch(`${API_URL}/api/riot/mastery/${puuid}`);
        if (!res.ok) throw new Error('Erreur récupération maîtrise');
        const masteryData = await res.json();
        setMasteries(masteryData);
      } catch (e: any) {
        setError(e?.message || 'Erreur récupération maîtrise');
      }
    };
    if (riotData?.puuid) fetchMastery(riotData.puuid);
  }, [riotData?.puuid]);

  const getChampionIconUrl = (championName: string) =>
    ddragonVersion ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${championName}.png` : '';

  const formatBool = (b: boolean) => (b ? '✅ Victoire' : '❌ Défaite');

  if (!ddragonVersion) return <Spinner />;
  if (!profile) return <p className="text-center mt-10 text-gray-300">Chargement...</p>;

  return (
    <main className="min-h-screen w-full px-4 py-10 bg-gradient-to-br from-[#1e1e3f] to-[#2f2f88] text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-10">

        <h1 className="text-4xl font-extrabold text-center text-indigo-300">{profile.username}</h1>

        <section className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
          <h2 className="text-xl font-bold mb-4 text-white">📍 Informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-200">
            <p><span className="font-semibold text-white">Localisation :</span> {profile.location || '-'}</p>
            <p><span className="font-semibold text-white">Âge :</span> {profile.age || '-'}</p>
            <p className="sm:col-span-3"><span className="font-semibold text-white">Bio :</span> {profile.bio || '-'}</p>
          </div>
        </section>

        <section className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
          <h2 className="text-xl font-bold mb-4 text-white">🎮 Rang & Riot</h2>
          <p><span className="font-semibold text-white">Rank :</span> {profile.rank || 'Pas de rank disponible'}</p>
          <p className="mt-2"><span className="font-semibold text-white">Pseudo Riot :</span> {profile.riotSummonerName || 'Aucun pseudo Riot renseigné'}</p>
        </section>

        {error && (
          <div className="bg-red-500 text-white px-4 py-2 rounded shadow">
            <strong className="font-bold">Erreur: </strong>
            <span>{error}</span>
          </div>
        )}

        {riotData && selectedMatch && (
          <section className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-indigo-300">🧠 Match sélectionné</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-gray-200">
              <div>
                <strong>Champion :</strong> {selectedMatch.championName}
                <img src={getChampionIconUrl(selectedMatch.championName)} className="inline w-6 h-6 ml-2 rounded" />
              </div>
              <div><strong>Rôle :</strong> {selectedMatch.role || '-'}</div>
              <div><strong>Résultat :</strong> {formatBool(selectedMatch.win)}</div>
              <div><strong>K/D/A :</strong> {selectedMatch.kda.kills} / {selectedMatch.kda.deaths} / {selectedMatch.kda.assists}</div>
              <div><strong>Farm :</strong> {selectedMatch.farm} sb</div>
              <div><strong>Durée :</strong> {selectedMatch.durationMin} min</div>
              <div><strong>Gold :</strong> {selectedMatch.goldEarned ?? '-'}</div>
              <div><strong>Dégâts :</strong> {selectedMatch.damageDealt ?? '-'}</div>
              <div><strong>Vision :</strong> Score {selectedMatch.visionScore ?? '-'}</div>
              <div><strong>Mode :</strong> {selectedMatch.gameMode ?? '-'}</div>
              <div><strong>Plateforme :</strong> {selectedMatch.platformId ?? '-'}</div>
              <div><strong>Surrender :</strong> {selectedMatch.surrender ?? '-'}</div>
            </div>
          </section>
        )}

        {riotData?.lastMatches && (
          <section>
            <h3 className="text-xl font-bold mb-4 text-indigo-300">🕹️ Historique des matchs</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {riotData.lastMatches.map((match: Match) => (
                <button
                  key={match.matchId}
                  onClick={() => setSelectedMatch(match)}
                  className={`min-w-[220px] p-4 rounded-lg shadow-md border transition 
                    ${selectedMatch?.matchId === match.matchId
                      ? 'bg-indigo-500/70 text-white scale-105 border-indigo-300'
                      : 'bg-white/10 text-gray-200 hover:bg-indigo-600/30 border-white/20'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img src={getChampionIconUrl(match.championName)} alt={match.championName} className="w-8 h-8 rounded" />
                    <span className="font-bold text-lg">{match.championName}</span>
                  </div>
                  <p className="italic text-sm mb-2">{match.role || '-'}</p>
                  <p><strong>Résultat :</strong> {formatBool(match.win)}</p>
                  <p><strong>K/D/A :</strong> {match.kda.kills} / {match.kda.deaths} / {match.kda.assists}</p>
                  <p><strong>Farm :</strong> {match.farm} sb</p>
                  <p><strong>Durée :</strong> {match.durationMin} min</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {masteries && (
          <section className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 max-w-lg mx-auto">
            <h3 className="text-xl font-bold mb-4 text-indigo-300">🏆 Champions maîtrisés</h3>
            <ul className="space-y-2 text-gray-200">
              {masteries.map((m, i) => (
                <li key={m.championId} className="flex items-center gap-2">
                  <img src={getChampionIconUrl(m.championName)} className="w-6 h-6 rounded" />
                  <span className="font-semibold text-white">#{i + 1} {m.championName}</span>: {m.championPoints.toLocaleString()} pts
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </main>
  );
}
