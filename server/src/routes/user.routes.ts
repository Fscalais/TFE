import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  getPublicProfileById,
  getPublicProfileByUsername,
} from '../controllers/user.controller';

const router = express.Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

router.get('/by-username/:username', authenticate, getPublicProfileByUsername);

router.get('/:id', authenticate, getPublicProfileById);

export default router;
