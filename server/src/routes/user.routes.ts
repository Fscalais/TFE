import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProfile, updateProfile } from '../controllers/user.controller';

const router = express.Router();

// Récupérer les infos du profil connecté
router.get('/me', authenticate, getProfile);

// Mettre à jour le profil connecté
router.put('/me', authenticate, updateProfile);

export default router;
