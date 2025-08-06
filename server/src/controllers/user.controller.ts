import User from '../models/user.model';
import { Request, Response } from 'express';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password'); // Exclure le mot de passe
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.userId;
  const {
    username,
    riotSummonerName,
    languages,
    location,
    games,
    roles,
    age,
    mood,
    rank,
    bio,
  } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username,
        riotSummonerName,
        languages,
        location,
        games,
        roles,
        age,
        mood,
        rank,
        bio,
      },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour du profil :", err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

