//Vérif auth user, ID , équipe
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Team from '../models/team.model';

export function requireTeamMember(fieldName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const teamIdRaw =
        (req.body && (req.body as any)[fieldName]) ??
        (req.params && (req.params as any)[fieldName]) ??
        (req.query && (req.query as any)[fieldName]);

      const teamId = String(teamIdRaw || '');

      if (!teamId) {
        return res.status(400).json({ message: `${fieldName} manquant` });
      }

      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({ message: `${fieldName} invalide` });
      }

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Équipe introuvable' });
      }

      const isMember = team.members.some((m) => m.equals(userId));
      if (!isMember) {
        return res.status(403).json({ message: 'Vous ne faites pas partie de cette équipe' });
      }

      return next();
    } catch (err) {
      console.error('requireTeamMember error:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };
}
