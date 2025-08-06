import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
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
    <svg
      className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  </div>
);

const Profile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [riotData, setRiotData] = useState<{
    lastMatches?: Match[];
    lastMatch?: Match | null;
    [key: string]: any;
  } | null>(null);
  const [masteries, setMasteries] = useState<Mastery[] | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string>('');
  const [loadingMasteries, setLoadingMasteries] = useState(false);
  const [ddragonVersion, setDdragonVersion] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        if (!res.ok) throw new Error('Impossible de récupérer la version ddragon');
        const versions = await res.json();
        setDdragonVersion(versions[0]);
      } catch {
        setDdragonVersion('13.15.1');
      }
    };
    fetchVersion();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);

        if (data.riotSummonerName) {
          try {
            const riotRes = await fetch(
              `http://localhost:5000/api/riot/data/${encodeURIComponent(data.riotSummonerName)}`
            );
            if (!riotRes.ok) throw new Error('Erreur récupération données Riot');
            const riotJson = await riotRes.json();
            setRiotData(riotJson);
            setSelectedMatch(riotJson.lastMatch);
          } catch (err: any) {
            setError(err.message || 'Erreur récupération données Riot');
          }
        }
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchMastery = async (puuid: string) => {
      setLoadingMasteries(true);
      try {
        const res = await fetch(`http://localhost:5000/api/riot/mastery/${puuid}`);
        if (!res.ok) throw new Error("Erreur récupération maîtrise");
        const masteryData = await res.json();
        console.log("Maîtrises récupérées:", masteryData);
        setMasteries(masteryData);
      } catch (err: any) {
        setError(err.message || "Erreur récupération maîtrise");
      } finally {
        setLoadingMasteries(false);
      }
    };

    if (riotData?.puuid) {
      fetchMastery(riotData.puuid);
    }
  }, [riotData?.puuid]);

  useEffect(() => {
    console.log("riotData changé:", riotData);
  }, [riotData]);

  useEffect(() => {
    console.log("masteries changé:", masteries);
  }, [masteries]);

  const getChampionIconUrl = (championName: string) => {
    if (!ddragonVersion) return '';
    return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${championName}.png`;
  };

  if (!profile) return <p className="text-center mt-10 text-gray-600">Chargement...</p>;

  if (!ddragonVersion) return <Spinner />;

  const formatBool = (b: boolean) => (b ? "✅ Victoire" : "❌ Défaite");

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 font-sans text-gray-800">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-indigo-700">{profile.username}</h1>

      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-700">
          <p><span className="font-semibold">Localisation :</span> {profile.location || '-'}</p>
          <p><span className="font-semibold">Âge :</span> {profile.age || '-'}</p>
          <p className="sm:col-span-3"><span className="font-semibold">Bio :</span> {profile.bio || '-'}</p>
        </div>
      </section>

      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">Rang et Identité Riot</h2>
        <p><span className="font-semibold">Rank :</span> {profile.rank || 'Pas de rank disponible'}</p>
        <p className="mt-2"><span className="font-semibold">Pseudo Riot :</span> {profile.riotSummonerName || 'Aucun pseudo Riot renseigné'}</p>
      </section>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {riotData && selectedMatch && (
        <section className="bg-gray-50 shadow rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-indigo-600">Informations détaillées du match sélectionné</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-gray-700">
            <div>
              <span className="font-semibold">Champion :</span> {selectedMatch.championName}
              <img
                src={getChampionIconUrl(selectedMatch.championName)}
                alt={selectedMatch.championName}
                title={selectedMatch.championName}
                className="inline-block w-6 h-6 ml-2 rounded-md align-middle"
                loading="lazy"
              />
            </div>
            <div>
              <span className="font-semibold">Rôle :</span> {selectedMatch.role || '-'}
            </div>
            <div>
              <span className="font-semibold">Résultat :</span> <span>{formatBool(selectedMatch.win)}</span>
            </div>
            <div>
              <span className="font-semibold">K/D/A :</span> {selectedMatch.kda.kills} / {selectedMatch.kda.deaths} / {selectedMatch.kda.assists}
            </div>
            <div>
              <span className="font-semibold">Farm :</span> {selectedMatch.farm} sb
            </div>
            <div>
              <span className="font-semibold">Durée :</span> {selectedMatch.durationMin} min
            </div>
            <div>
              <span className="font-semibold">Gold gagné :</span> {selectedMatch.goldEarned ?? '-'}
            </div>
            <div>
              <span className="font-semibold">Dégâts infligés :</span> {selectedMatch.damageDealt ?? '-'}
            </div>
            <div>
              <span className="font-semibold">Vision :</span> Score {selectedMatch.visionScore ?? '-'}
            </div>
            <div>
              <span className="font-semibold">Mode :</span> {selectedMatch.gameMode ?? '-'}
            </div>
            <div>
              <span className="font-semibold">Plateforme :</span> {selectedMatch.platformId ?? '-'}
            </div>
            <div>
              <span className="font-semibold">Surrender :</span> {selectedMatch.surrender ?? '-'}
            </div>
          </div>
        </section>
      )}

      {riotData && (
        <>
          <section className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-indigo-700">Historique des 10 derniers matchs</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {riotData.lastMatches && riotData.lastMatches.length > 0 ? (
                riotData.lastMatches.map((match: Match) => (
                  <button
                    key={match.matchId}
                    onClick={() => setSelectedMatch(match)}
                    className={`min-w-[220px] p-4 rounded-lg shadow-md cursor-pointer text-left transition transform
                      ${
                        selectedMatch?.matchId === match.matchId
                          ? "bg-indigo-400 text-white scale-105"
                          : "bg-white hover:bg-indigo-100"
                      }
                    `}
                    aria-pressed={selectedMatch?.matchId === match.matchId}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={getChampionIconUrl(match.championName)}
                        alt={match.championName}
                        title={match.championName}
                        className="w-8 h-8 rounded-md"
                        loading="lazy"
                      />
                      <span className="font-bold text-lg">{match.championName}</span>
                    </div>
                    <p className="italic text-sm mb-2">{match.role || '-'}</p>
                    <p><span className="font-semibold">Résultat :</span> {formatBool(match.win)}</p>
                    <p><span className="font-semibold">K/D/A :</span> {match.kda.kills} / {match.kda.deaths} / {match.kda.assists}</p>
                    <p><span className="font-semibold">Farm :</span> {match.farm} sb</p>
                    <p><span className="font-semibold">Durée :</span> {match.durationMin} min</p>
                  </button>
                ))
              ) : (
                <p>Aucun match récent disponible.</p>
              )}
            </div>
          </section>

          {loadingMasteries && (
            <p className="text-center text-indigo-600 font-semibold mb-4">Chargement des maîtrises...</p>
          )}

          {masteries && masteries.length > 0 && (
            <section className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-4 text-indigo-700">Top 5 des champions maîtrisés</h3>
              <ul className="list-decimal list-inside space-y-1 text-gray-700">
                {masteries.map((m: Mastery, i: number) => (
                  <li key={m.championId} className="text-lg flex items-center gap-2">
                    <img
                      src={getChampionIconUrl(m.championName)}
                      alt={m.championName}
                      title={m.championName}
                      className="w-6 h-6 rounded-md"
                      loading="lazy"
                    />
                    <span className="font-semibold">{`#${i + 1} — ${m.championName}`}</span> : {m.championPoints.toLocaleString()} points
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={() => navigate('/edit-profile')}
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition"
        >
          Modifier mon profil
        </button>
      </div>
    </main>
  );
};

export default Profile;


