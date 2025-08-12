//controller Scrims + lien bot Discord
import { Request, Response } from 'express';
import axios from 'axios';
import Scrim from '../models/scrim.model';
import Team from '../models/team.model';

const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3001';

async function createDiscordRoomForScrim(
  scrimId: string
): Promise<{ inviteUrl?: string; roomId?: string }> {
  try {
    const roomId = `scrim_${scrimId}`;
    const { data } = await axios.post(`${DISCORD_BOT_URL}/create-room`, { roomId });
    return { inviteUrl: data?.inviteUrl as string, roomId };
  } catch {
    return {};
  }
}

export const createScrim = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const { datetime, matchType, minRank, teamId } = req.body as {
      datetime: string;
      matchType: 'bo1' | 'bo3' | 'bo5';
      minRank:
        | 'bronze'
        | 'silver'
        | 'gold'
        | 'platinum'
        | 'diamond'
        | 'master'
        | 'grandmaster'
        | 'challenger';
      teamId?: string;
    };

    let team = null;
    if (teamId) {
      team = await Team.findOne({ _id: teamId, members: userId });
    } else {
      team = await Team.findOne({ members: userId });
    }
    if (!team) {
      return res
        .status(400)
        .json({ message: "Vous devez faire partie d'une équipe pour créer un scrim" });
    }

    const scrim = await Scrim.create({
      teamA: team._id,
      datetime,
      matchType,
      minRank,
      status: 'open',
      requests: [],
    });

    res.status(201).json(scrim);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const listScrims = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo, rank, matchType } = req.query as {
      dateFrom?: string;
      dateTo?: string;
      rank?: string;
      matchType?: 'bo1' | 'bo3' | 'bo5';
    };

    const filter: any = { status: 'open' };

    if (dateFrom || dateTo) filter.datetime = {};
    if (dateFrom) filter.datetime.$gte = new Date(dateFrom);
    if (dateTo) filter.datetime.$lte = new Date(dateTo);
    if (rank) filter.minRank = rank;
    if (matchType) filter.matchType = matchType;

    const scrims = await Scrim.find(filter)
      .populate('teamA', 'name')
      .populate('requests.teamId', 'name')
      .sort({ datetime: 1 });

    res.json(scrims);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const requestScrim = async (req: Request, res: Response) => {
  try {
    const scrimId = req.params.id;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const team = await Team.findOne({ members: userId });
    if (!team)
      return res
        .status(400)
        .json({ message: "Vous devez faire partie d'une équipe pour demander un scrim" });

    const scrim = await Scrim.findById(scrimId);
    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });
    if (scrim.status !== 'open')
      return res.status(400).json({ message: 'Scrim fermé aux demandes' });

    if (scrim.requests.some((r: any) => r.teamId?.toString() === team._id.toString())) {
      return res.status(400).json({ message: 'Demande déjà envoyée' });
    }

    scrim.requests.push({ teamId: team._id, status: 'pending' });
    await scrim.save();

    res.json({ message: 'Demande envoyée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const respondRequest = async (req: Request, res: Response) => {
  try {
    const scrimId = req.params.id;
    const { requestId, action } = req.body as { requestId: string; action: 'accept' | 'reject' };
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });


    const team = await Team.findOne({ members: userId });
    if (!team) return res.status(400).json({ message: "Vous devez faire partie d'une équipe" });

    const scrim: any = await Scrim.findById(scrimId);
    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });

    if (scrim.teamA?.toString() !== team._id.toString()) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const reqDoc = scrim.requests.id(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Demande non trouvée' });

    if (action === 'accept') {
      reqDoc.status = 'accepted';
      scrim.teamB = reqDoc.teamId;
      scrim.status = 'confirmed';

      if (!scrim.discordInvite) {
        const { inviteUrl, roomId } = await createDiscordRoomForScrim(scrim._id.toString());
        if (inviteUrl) scrim.discordInvite = inviteUrl;
        if (roomId) scrim.discordRoomId = roomId;
      }
    } else if (action === 'reject') {
      reqDoc.status = 'rejected';
    } else {
      return res.status(400).json({ message: 'Action invalide' });
    }

    await scrim.save();
    res.json({ message: `Demande ${action}ée` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getMyScrims = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const myTeams = await Team.find({ members: userId }).select('_id');
    if (myTeams.length === 0) {
      return res.json([]);
    }

    const myTeamIds = myTeams.map(t => t._id);

    const scrims = await Scrim.find({
      $or: [{ teamA: { $in: myTeamIds } }, { teamB: { $in: myTeamIds } }],
    })
      .populate('teamA', 'name')
      .populate('teamB', 'name')
      .populate('requests.teamId', 'name')
      .sort({ datetime: 1 });

    res.json(scrims);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const getScrimByIdForUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const scrimId = req.params.id;

    const scrim: any = await Scrim.findById(scrimId)
      .populate('teamA', 'name')
      .populate('teamB', 'name')
      .populate('requests.teamId', 'name');

    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });

    const myTeams = await Team.find({ members: userId }).select('_id');
    const myTeamIdSet = new Set(myTeams.map(t => t._id.toString()));

    const normId = (val: any) =>
      (val && val._id && val._id.toString()) ||
      (typeof val?.toString === 'function' ? val.toString() : undefined);

    const teamAId = normId(scrim.teamA);
    const teamBId = normId(scrim.teamB);

    const isHost = teamAId ? myTeamIdSet.has(teamAId) : false;
    const isOpponent = teamBId ? myTeamIdSet.has(teamBId) : false;

    const hasAccepted = (scrim.requests || []).some((r: any) => {
      const rid = normId(r.teamId);
      return r.status === 'accepted' && rid && myTeamIdSet.has(rid);
    });

    if (!isHost && !isOpponent && !hasAccepted) {
      return res.status(403).json({ message: 'Accès non autorisé à ce scrim' });
    }

    return res.json(scrim);
  } catch (error: any) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const getDiscordInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const team = await Team.findOne({ members: userId });
    if (!team) return res.status(400).json({ message: "Vous n'êtes membre d'aucune équipe" });

    const scrim: any = await Scrim.findById(req.params.id)
      .populate('teamA', 'name')
      .populate('teamB', 'name')
      .populate('requests.teamId', 'name');

    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });

    const normId = (val: any) =>
      (val && val._id && val._id.toString()) ||
      (typeof val?.toString === 'function' ? val.toString() : undefined);

    const teamIdStr = team._id.toString();
    const isHost = normId(scrim.teamA) === teamIdStr;
    const isOpponent = normId(scrim.teamB) === teamIdStr;
    const hasAccepted = (scrim.requests || []).some(
      (r: any) => r.status === 'accepted' && normId(r.teamId) === teamIdStr
    );

    if (!isHost && !isOpponent && !hasAccepted) {
      return res.status(403).json({ message: 'Accès non autorisé à ce scrim' });
    }

    return res.json({ discordInvite: scrim.discordInvite || null });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
};



export const listRequestsForScrim = async (req: Request, res: Response) => {
  try {
    const scrimId = req.params.id;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const team = await Team.findOne({ members: userId });
    if (!team) return res.status(400).json({ message: "Vous devez faire partie d'une équipe" });

    const scrim: any = await Scrim.findById(scrimId).populate('requests.teamId', 'name');
    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });

    if (scrim.teamA?.toString() !== team._id.toString()) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const pendingRequests = (scrim.requests || []).filter((r: any) => r.status === 'pending');
    res.json(pendingRequests);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
