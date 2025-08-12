//controller register et login
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body as {
      email: string; username: string; password: string;
    };

    const emailLower = email.toLowerCase();

    const emailExists = await User.findOne({ email: emailLower });
    if (emailExists) return res.status(400).json({ message: 'Email déjà utilisé' });

    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ message: 'Pseudo déjà pris' });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: emailLower,
      username,
      password: hash,
      isEmailVerified: true,
    });

    return res.status(201).json({
      message: 'Inscription réussie',
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

    if (!user.password) {
      return res.status(400).json({ message: 'Ce compte utilise Google OAuth' });
    }

    const ok = await bcrypt.compare(password, user.password as string);
    if (!ok) return res.status(400).json({ message: 'Identifiants invalides' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

