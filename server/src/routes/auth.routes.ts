import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login } from '../controllers/auth.controller';

const router = express.Router();

// Limiteur pour éviter brute-force sur login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 5 tentatives
  message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
});

router.post(
  '/register',
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  body('username').notEmpty().withMessage('Le nom d\'utilisateur est requis'),
  register
);

router.post(
  '/login',
  loginLimiter,
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  login
);

export default router;
