//Vérif clé RIOT + cache mémoire DDragon
import { Request, Response } from 'express';
import axios from 'axios';

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  console.error(" Clé API Riot manquante");
  process.exit(1);
}

type DDragonCache = {
  version: string | null;
  championIdToName: Record<number, string>;
  fetchedAt: number;
};
const DDRAGON_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const ddragonCache: DDragonCache = {
  version: null,
  championIdToName: {},
  fetchedAt: 0,
};

async function getLatestDDragonVersion(): Promise<string> {
  const now = Date.now();
  if (ddragonCache.version && (now - ddragonCache.fetchedAt) < DDRAGON_CACHE_TTL_MS) {
    return ddragonCache.version;
  }
  const versionsRes = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
  const latestVersion: string = versionsRes.data[0];
  ddragonCache.version = latestVersion;
  ddragonCache.fetchedAt = now;
  return latestVersion;
}

async function getChampionIdMap(): Promise<Record<number, string>> {
  const now = Date.now();
  const cacheValid = (now - ddragonCache.fetchedAt) < DDRAGON_CACHE_TTL_MS;

  if (cacheValid && ddragonCache.version && Object.keys(ddragonCache.championIdToName).length > 0) {
    return ddragonCache.championIdToName;
  }

  const version = await getLatestDDragonVersion();
  const champRes = await axios.get(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );

  const data = champRes.data.data;
  const map: Record<number, string> = {};
  for (const champName in data) {
    const champ = data[champName];
    map[parseInt(champ.key, 10)] = champName;
  }

  ddragonCache.championIdToName = map;
  return map;
}

export const getCachedDDragonVersion = async (_req: Request, res: Response) => {
  try {
    const version = await getLatestDDragonVersion();
    res.json({ version });
  } catch (e) {
    res.status(500).json({ message: 'Erreur récupération version DDragon' });
  }
};

export const fetchRiotData = async (req: Request, res: Response) => {
  try {
    const { riotId } = req.params;
    if (!riotId.includes('#')) {
      return res.status(400).json({ message: "Format pseudo Riot invalide (ex: dmsdklb#vivi)" });
    }

    const [gameName, tagLine] = riotId.split('#');
    const riotRegion = "europe";
    const platform = "euw1";     
    const matchRegion = "europe";

    const accountRes = await axios.get(
      `https://${riotRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { "X-Riot-Token": apiKey } }
    );
    const { puuid, gameName: resolvedName, tagLine: resolvedTag } = accountRes.data;

    let level: number | string = "inconnu";
    let summonerId: string | null = null;
    try {
      const summonerRes = await axios.get(
        `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        { headers: { "X-Riot-Token": apiKey } }
      );
      level = summonerRes.data?.summonerLevel ?? "inconnu";
      summonerId = summonerRes.data?.id ?? null;
    } catch {
    }

    const challengerUrl = `https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`;
    const challengerRes = await axios.get(challengerUrl, { headers: { "X-Riot-Token": apiKey } });
    const entry = challengerRes.data?.entries?.find((p: any) => p.summonerId === summonerId) || null;

    const matchListRes = await axios.get(
      `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        params: { queue: 420, start: 0, count: 5 },
        headers: { "X-Riot-Token": apiKey },
      }
    );
    const matchIds: string[] = matchListRes.data;

    const lastMatches = await Promise.all(
      matchIds.map(async (id) => {
        const matchRes = await axios.get(
          `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/${id}`,
          { headers: { "X-Riot-Token": apiKey } }
        );
        const { info } = matchRes.data;
        const player = info.participants.find((p: any) => p.puuid === puuid);

        return {
          matchId: id,
          championName: player?.championName,
          role: player?.teamPosition || player?.lane,
          win: player?.win,
          kda: {
            kills: player?.kills,
            deaths: player?.deaths,
            assists: player?.assists,
          },
          farm: (player?.totalMinionsKilled || 0) + (player?.neutralMinionsKilled || 0),
          durationMin: Math.round((info.gameDuration ?? 0) / 60),
          goldEarned: player?.goldEarned,
          damageDealt: player?.totalDamageDealtToChampions,
          visionScore: player?.visionScore,
          gameMode: info.gameMode,
          platformId: info.platformId,
          surrender: info.gameEndedInSurrender ? (info.gameEndedInEarlySurrender ? "Early" : "Normal") : "Non",
        };
      })
    );

    const rank = entry
      ? {
          tier: 'CHALLENGER',
          rank: entry.rank ?? 'I',
          leaguePoints: entry.leaguePoints,
          wins: entry.wins,
          losses: entry.losses,
          winrate: ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1) + "%",
        }
      : null;

    return res.json({
      riotId: `${resolvedName}#${resolvedTag}`,
      puuid,
      level,
      rank,
      lastMatch: lastMatches[0] || null,
      lastMatches,
    });
  } catch (err: any) {
    console.error(" Erreur Riot API :", err.response?.data || err.message);
    return res.status(500).json({ message: "Erreur Riot API", error: err.response?.data || err.message });
  }
};

export const fetchChampionMastery = async (req: Request, res: Response) => {
  try {
    const { puuid } = req.params;
    const platform = "euw1";

    const resMastery = await axios.get(
      `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": apiKey } }
    );

    const idMap = await getChampionIdMap();

    const topMasteries = resMastery.data.slice(0, 5).map((m: any) => ({
      championId: m.championId,
      championName: idMap[m.championId] || `Champion ${m.championId}`,
      championPoints: m.championPoints,
      championLevel: m.championLevel,
    }));

    res.json(topMasteries);
  } catch (err: any) {
    console.error(" Erreur maîtrises:", err.response?.data || err.message);
    res.status(500).json({ message: "Erreur récupération maîtrises champions", error: err.response?.data || err.message });
  }
};




