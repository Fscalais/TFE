import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  console.log('Attempt to register user:', { username, email, password: password ? '***' : undefined });

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    // Vérifie si email ou username existent déjà
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const existingUserName = await User.findOne({ username });
    if (existingUserName) {
      return res.status(400).json({ message: 'Nom d\'utilisateur déjà pris' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    res.status(201).json({ message: 'Utilisateur créé', userId: user._id });
  } catch (err) {
    console.error('Error during user registration:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};


export const login = async (req: Request, res: Response) => {
  // Validation des inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    console.log('📩 Email reçu :', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      // Message générique pour éviter de révéler l’existence d’un compte
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const isMatch = await bcrypt.compare(password, user.password ?? '');
    console.log('🔑 Mot de passe correct ?', isMatch);

    if (!isMatch) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    console.log("✅ Utilisateur trouvé :", user);
    console.log("🔐 JWT_SECRET :", JWT_SECRET);

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Erreur dans loginUser:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

