import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  getPublicProfileById,
  getPublicProfileByUsername,
} from '../controllers/user.controller';

const router = express.Router();

// Profil connecté
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

// Profil public par username (optionnel mais pratique)
router.get('/by-username/:username', authenticate, getPublicProfileByUsername);

// Profil public par id
router.get('/:id', authenticate, getPublicProfileById);

export default router;
