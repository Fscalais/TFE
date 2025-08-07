import { Request, Response } from 'express';
import Scrim from '../models/scrim.model';
import Team from '../models/team.model';

export const createScrim = async (req: Request, res: Response) => {
  try {
    const { datetime, matchType, minRank } = req.body;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    // Récupérer la team du user
    const team = await Team.findOne({ members: userId });
    if (!team) return res.status(400).json({ message: 'Vous devez faire partie d\'une équipe pour créer un scrim' });

    const scrim = new Scrim({
      teamA: team._id,
      datetime,
      matchType,
      minRank,
      status: 'open',
      requests: [],
    });
    await scrim.save();

    res.status(201).json(scrim);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const listScrims = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo, rank, matchType } = req.query;
    const filter: any = { status: 'open' };

    if (dateFrom || dateTo) filter.datetime = {};
    if (dateFrom) filter.datetime.$gte = new Date(dateFrom as string);
    if (dateTo) filter.datetime.$lte = new Date(dateTo as string);
    if (rank) filter.minRank = rank;
    if (matchType) filter.matchType = matchType;

    const scrims = await Scrim.find(filter)
      .populate('teamA', 'name')
      .populate('requests.teamId', 'name')  // <-- Ajouté ici
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
    if (!team) return res.status(400).json({ message: 'Vous devez faire partie d\'une équipe pour demander un scrim' });

    const scrim = await Scrim.findById(scrimId);
    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });
    if (scrim.status !== 'open') return res.status(400).json({ message: 'Scrim fermé aux demandes' });

    // Vérifier qu’on a pas déjà fait une demande
    if (scrim.requests.some(r => r.teamId.equals(team._id))) {
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
    const { requestId, action } = req.body; // 'accept' ou 'reject'
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const team = await Team.findOne({ members: userId });
    if (!team) return res.status(400).json({ message: 'Vous devez faire partie d\'une équipe' });

    const scrim = await Scrim.findById(scrimId);
    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });

    // Seul teamA peut répondre aux demandes
    if (!scrim.teamA.equals(team._id)) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const request = scrim.requests.id(requestId);
    if (!request) return res.status(404).json({ message: 'Demande non trouvée' });

    if (action === 'accept') {
      request.status = 'accepted';
      scrim.teamB = request.teamId;
      scrim.status = 'confirmed';
    } else if (action === 'reject') {
      request.status = 'rejected';
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

    // Trouver l’équipe de l’utilisateur
    const team = await Team.findOne({ members: userId });
    if (!team) return res.status(400).json({ message: 'Vous n\'êtes membre d\'aucune équipe' });

    // Trouver les scrims où teamA = cette équipe
    const scrims = await Scrim.find({ teamA: team._id })
      .populate('teamA', 'name')
      .populate('teamB', 'name')
      .populate('requests.teamId', 'name')
      .sort({ datetime: 1 });

    res.json(scrims);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const listRequestsForScrim = async (req: Request, res: Response) => {
  try {
    const scrimId = req.params.id;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const team = await Team.findOne({ members: userId });
    if (!team) return res.status(400).json({ message: 'Vous devez faire partie d\'une équipe' });

    const scrim = await Scrim.findById(scrimId).populate('requests.teamId', 'name');
    if (!scrim) return res.status(404).json({ message: 'Scrim non trouvé' });

    if (!scrim.teamA.equals(team._id)) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const pendingRequests = scrim.requests.filter(r => r.status === 'pending');
    res.json(pendingRequests);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};