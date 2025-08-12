//Création team, suppression team, gestion membres et invitations
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

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const teamId = req.params.id;

    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });
    const userIdStr = String(userId);

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const isCreator = team.creator.toString() === userIdStr;
    const isOnlyMember = team.members.length === 1 && team.members[0].toString() === userIdStr;

    if (!isCreator || !isOnlyMember) {
      return res
        .status(403)
        .json({ message: "Seul le créateur, unique membre, peut supprimer l'équipe." });
    }

    await Team.findByIdAndDelete(teamId);
    return res.json({ message: 'Équipe supprimée' });
  } catch (err) {
    console.error('Erreur deleteTeam:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const transferCreator = async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId;
    const { newCreatorId } = req.body as { newCreatorId: string };

    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });
    const userIdStr = String(userId);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    if (team.creator.toString() !== userIdStr) {
      return res.status(403).json({ message: 'Seulement le créateur peut transférer le rôle' });
    }

    if (!team.members.some((m) => m.toString() === newCreatorId)) {
      return res
        .status(400)
        .json({ message: "Le nouveau créateur doit être un membre de l'équipe" });
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
    const userIdStr = String(userId);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const isMember = team.members.some((m) => m.toString() === userIdStr);
    if (!isMember) {
      return res.status(400).json({ message: "Vous n'êtes pas membre de cette équipe" });
    }

    const isCreator = team.creator.toString() === userIdStr;

    if (isCreator) {
      if (team.members.length > 1) {
        const membersExceptCreator = team.members.filter((m) => m.toString() !== userIdStr);
        team.creator = membersExceptCreator[0];
        team.members = membersExceptCreator;
        await team.save();
        return res.json({ message: "Vous avez quitté l’équipe avec succès (créateur transféré)" });
      } else {
        await Team.findByIdAndDelete(teamId);
        return res.json({ message: "Équipe supprimée car vous étiez le seul membre" });
      }
    } else {
      team.members = team.members.filter((m) => m.toString() !== userIdStr);
      await team.save();
      return res.json({ message: "Vous avez quitté l’équipe avec succès" });
    }
  } catch (err) {
    console.error('Erreur leaveTeam:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const getTeamsForUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });
    const userIdStr = String(userId);

    const teams = await Team.find({ members: userIdStr })
      .populate('members', 'username')
      .populate('creator', 'username');

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
    const { username } = req.body as { username: string };

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ message: "Nom d'utilisateur invalide" });
    }

    const userToInvite = await User.findOne({ username }).select('_id username').exec();
    if (!userToInvite) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const invitedIdStr = String(userToInvite._id);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    if (team.members.some((m) => m.toString() === invitedIdStr)) {
      return res.status(400).json({ message: 'Utilisateur déjà membre' });
    }

    if (team.invitations.some((i) => i.toString() === invitedIdStr)) {
      return res.status(400).json({ message: 'Utilisateur déjà invité' });
    }

    team.invitations.push(new mongoose.Types.ObjectId(invitedIdStr));
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

    const userIdStr = String(userId);
    const userObjectId = new mongoose.Types.ObjectId(userIdStr);

    const teams = await Team.find({ invitations: { $in: [userObjectId] } }).populate(
      'creator',
      'username'
    );

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

    const userIdStr = String(userId);
    const userObjectId = new mongoose.Types.ObjectId(userIdStr);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe introuvable' });

    const hasInvite = team.invitations.some((id) => id.toString() === userObjectId.toString());
    if (!hasInvite) {
      return res.status(400).json({ message: 'Pas d’invitation pour cette équipe' });
    }

    team.members.push(userObjectId);
    team.invitations = team.invitations.filter(
      (id) => id.toString() !== userObjectId.toString()
    );
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

    const userIdStr = String(userId);
    const userObjectId = new mongoose.Types.ObjectId(userIdStr);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Équipe introuvable' });

    const hasInvite = team.invitations.some((id) => id.toString() === userObjectId.toString());
    if (!hasInvite) {
      return res.status(400).json({ message: 'Pas d’invitation pour cette équipe' });
    }

    team.invitations = team.invitations.filter(
      (id) => id.toString() !== userObjectId.toString()
    );
    await team.save();

    res.json({ message: 'Invitation refusée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

