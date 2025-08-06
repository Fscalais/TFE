import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Team from '../models/team.model';
import User from '../models/user.model';

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const creator = req.userId;

    if (!creator) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const existingTeam = await Team.findOne({ name });
    if (existingTeam) return res.status(400).json({ message: 'Nom d’équipe déjà pris' });

    const team = new Team({ name, description, creator, members: [creator], invitations: [] });
    await team.save();

    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const transferCreator = async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId;
    const { newCreatorId } = req.body;

    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    if (team.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Seulement le créateur peut transférer le rôle' });
    }

    if (!team.members.some(m => m.toString() === newCreatorId)) {
      return res.status(400).json({ message: 'Le nouveau créateur doit être un membre de l\'équipe' });
    }

    team.creator = new mongoose.Types.ObjectId(newCreatorId);
    await team.save();

    res.json({ message: 'Créateur transféré avec succès', team });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const leaveTeam = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const teamId = req.params.id;

    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    if (!team.members.some(m => m.equals(userId))) {
      return res.status(400).json({ message: 'Vous n\'êtes pas membre de cette équipe' });
    }

    if (team.creator.equals(userId)) {
      if (team.members.length > 1) {
        const membersExceptCreator = team.members.filter(m => !m.equals(userId));
        team.creator = membersExceptCreator[0];
        team.members = membersExceptCreator;
      } else {
        await Team.findByIdAndDelete(teamId);
        return res.json({ message: 'Équipe supprimée car vous étiez le seul membre' });
      }
    } else {
      team.members = team.members.filter(m => !m.equals(userId));
    }

    await team.save();
    res.json({ message: 'Vous avez quitté l’équipe avec succès' });
  } catch (err) {
    console.error('Erreur leaveTeam:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const getTeamsForUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const teams = await Team.find({ members: userId }).populate('members', 'username').populate('creator', 'username');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const getTeamById = async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findById(teamId)
      .populate('members', 'username')
      .populate('creator', 'username');
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    const { username } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ message: 'Nom d\'utilisateur invalide' });
    }

    const userToInvite = await User.findOne({ username });
    if (!userToInvite) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    if (team.members.some(m => m.equals(userToInvite._id))) {
      return res.status(400).json({ message: 'Utilisateur déjà membre' });
    }

    if (team.invitations.some(i => i.equals(userToInvite._id))) {
      return res.status(400).json({ message: 'Utilisateur déjà invité' });
    }

    team.invitations.push(userToInvite._id);
    await team.save();

    res.json({ message: 'Invitation envoyée' });
  } catch (err) {
    console.error('Erreur serveur dans inviteMember:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const getInvitationsForUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const teams = await Team.find({ invitations: { $in: [userObjectId] } }).populate('creator', 'username');

    res.json(teams);
  } catch (err) {
    console.error('Erreur serveur dans getInvitationsForUser:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const teamId = req.params.teamId;

    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe introuvable' });

    if (!team.invitations.some(id => id.equals(userObjectId))) {
      return res.status(400).json({ message: 'Pas d’invitation pour cette équipe' });
    }

    team.members.push(userObjectId);
    team.invitations = team.invitations.filter(id => !id.equals(userObjectId));
    await team.save();

    res.json({ message: 'Invitation acceptée', team });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const declineInvitation = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const teamId = req.params.teamId;

    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe introuvable' });

    if (!team.invitations.some(id => id.equals(userObjectId))) {
      return res.status(400).json({ message: 'Pas d’invitation pour cette équipe' });
    }

    team.invitations = team.invitations.filter(id => !id.equals(userObjectId));
    await team.save();

    res.json({ message: 'Invitation refusée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
