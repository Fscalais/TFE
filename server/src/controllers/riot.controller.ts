import { Request, Response } from 'express';
import axios from 'axios';

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  console.error("❌ Clé API Riot manquante");
  process.exit(1);
}

export const fetchRiotData = async (req: Request, res: Response) => {
  try {
    const { riotId } = req.params; // Format : "dmsdklb#vivi"
    if (!riotId.includes('#')) {
      return res.status(400).json({ message: "Format pseudo Riot invalide (ex: dmsdklb#vivi)" });
    }

    const [gameName, tagLine] = riotId.split('#');
    const riotRegion = "europe";
    const platform = "euw1";
    const matchRegion = "europe";

    // Étape 1 : account + puuid
    const accountRes = await axios.get(
      `https://${riotRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      { headers: { "X-Riot-Token": apiKey } }
    );
    const { puuid, gameName: resolvedName, tagLine: resolvedTag } = accountRes.data;

    // Étape 2 : rang Master+
    const tiers = ["challenger", "grandmaster", "master"];
    let playerFound = null;
    let tierMeta = "";
    for (const tier of tiers) {
      const url = `https://${platform}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/RANKED_SOLO_5x5`;
      const resTier = await axios.get(url, { headers: { "X-Riot-Token": apiKey } });
      const entry = resTier.data.entries.find((p: any) => p.puuid === puuid);
      if (entry) {
        playerFound = entry;
        tierMeta = tier.toUpperCase();
        break;
      }
    }

    // Étape 3 : niveau joueur
    let level = "inconnu";
    try {
      const summonerRes = await axios.get(
        `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        { headers: { "X-Riot-Token": apiKey } }
      );
      level = summonerRes.data.summonerLevel;
    } catch {}

    // Étape 4 : 10 derniers matchs classés soloQ
    const matchListRes = await axios.get(
      `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        params: { queue: 420, start: 0, count: 10 },
        headers: { "X-Riot-Token": apiKey },
      }
    );
    const matchIds: string[] = matchListRes.data;

    if (matchIds.length === 0) {
      return res.json({ message: "Aucun match classé trouvé", resolvedName, resolvedTag, puuid, level, rank: null, lastMatch: null, lastMatches: [] });
    }

    // Étape 5 : détails des derniers matchs
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
          durationMin: Math.round(info.gameDuration / 60),
          goldEarned: player?.goldEarned,
          damageDealt: player?.totalDamageDealtToChampions,
          visionScore: player?.visionScore,
          gameMode: info.gameMode,
          platformId: info.platformId,
          surrender: info.gameEndedInSurrender ? (info.gameEndedInEarlySurrender ? "Early" : "Normal") : "Non",
        };
      })
    );

    res.json({
      riotId: `${resolvedName}#${resolvedTag}`,
      puuid,
      level,
      rank: playerFound
        ? {
            tier: tierMeta,
            rank: playerFound.rank,
            leaguePoints: playerFound.leaguePoints,
            wins: playerFound.wins,
            losses: playerFound.losses,
            winrate: ((playerFound.wins / (playerFound.wins + playerFound.losses)) * 100).toFixed(1) + "%",
          }
        : null,
      lastMatch: lastMatches[0] || null,
      lastMatches,
    });
  } catch (err: any) {
    console.error("❌ Erreur Riot API :", err.response?.data || err.message);
    return res.status(500).json({ message: "Erreur Riot API", error: err.response?.data || err.message });
  }
};

export const fetchChampionMastery = async (req: Request, res: Response) => {
  try {
    const { puuid } = req.params;
    const apiKey = process.env.RIOT_API_KEY;
    const platform = "euw1";

    // Récupère maîtrises
    const resMastery = await axios.get(
      `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": apiKey } }
    );

    // Récupère map id -> champion name
    const versionsRes = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
    const latestVersion = versionsRes.data[0];
    const champRes = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
    );

    const data = champRes.data.data;
    const idMap: Record<number, string> = {};
    for (const champName in data) {
      const champ = data[champName];
      idMap[parseInt(champ.key)] = champName;
    }

    // Top 5 maîtrises
    const topMasteries = resMastery.data.slice(0, 5).map((m: any) => ({
      championId: m.championId,
      championName: idMap[m.championId] || `Champion ${m.championId}`,
      championPoints: m.championPoints,
      championLevel: m.championLevel,
    }));

    res.json(topMasteries);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération maîtrises champions", error: err });
  }
};



