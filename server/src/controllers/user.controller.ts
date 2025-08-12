//renvoie profil public et privé
import User from '../models/user.model';
import { Request, Response } from 'express';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error(" Erreur lors de la récupération du profil :", error);
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
    console.error(" Erreur lors de la mise à jour du profil :", err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const getPublicProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const fields =
      'username riotSummonerName location age bio rank mood languages games roles createdAt updatedAt';

    const user = await User.findById(id).select(fields);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    return res.json(user);
  } catch (error) {
    console.error(' getPublicProfileById error:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getPublicProfileByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const fields =
      'username riotSummonerName location age bio rank mood languages games roles createdAt updatedAt';

    const user = await User.findOne({ username }).select(fields);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    return res.json(user);
  } catch (error) {
    console.error(' getPublicProfileByUsername error:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
