import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import passport from 'passport';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import riotRoutes from './routes/riot.routes';
import matchmakingRoutes from './routes/matchmaking.routes';
import User from './models/user.model';
import scrimRoutes from './routes/scrim.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET!;

// --- Middleware ---
app.use(
  cors({
    origin: 'http://localhost:3000', // frontend React
    credentials: true,
  })
);

app.use(express.json());
app.use('/api', scrimRoutes);

// --- Passport Google OAuth config ---
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj: any, done: (err: any, user?: any) => void) => {
  done(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:5000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Chercher utilisateur par googleId
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails?.[0].value,
          });
        }

        // Générer JWT
        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
          expiresIn: '7d',
        });

        // Passer user et token à req.user dans callback
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

app.use(passport.initialize());
// Ne pas utiliser passport.session() car on ne gère plus les sessions express
// app.use(passport.session());

// --- Routes Google OAuth ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const user = req.user as any;
    console.log('User Google OAuth:', user);
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('JWT token generated:', token);
    res.redirect(`http://localhost:3000/auth/success?token=${token}`);
  }
);

// --- Autres routes API ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/riot', riotRoutes);
app.use('/matchmaking', matchmakingRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

/* ===========================
   Matchmaking multi-critères
   =========================== */

// Types de critères envoyés par le client
interface SearchCriteria {
  socketId: string;
  userId: string;
  languages: string[]; // >= 1
  roles: string[];     // 1..2
  moods: string[];     // >= 1
  teamSize: number;    // nb de coéquipiers à trouver
}

const waitingPlayers: SearchCriteria[] = [];

// helpers
const intersects = (a: string[], b: string[]) => a.some((x) => b.includes(x));
const pickAvailableRole = (roles: string[], used: Set<string>) =>
  roles.find((r) => !used.has(r)) || null;

// Essaie de créer une équipe valide à partir de la file d'attente
function tryMatchPlayers() {
  if (waitingPlayers.length === 0) return null;

  // on seed avec le premier en file
  const seed = waitingPlayers[0];
  const totalTeamSize = seed.teamSize + 1;

  // pré-filtre: langue et mood en commun
  const candidates = waitingPlayers.filter(
    (p) => intersects(p.languages, seed.languages) && intersects(p.moods, seed.moods)
  );
  if (candidates.length < totalTeamSize) return null;

  const team: SearchCriteria[] = [];
  const usedRoles = new Set<string>();

  for (const p of candidates) {
    const chosen = pickAvailableRole(p.roles, usedRoles);
    if (chosen) {
      usedRoles.add(chosen);
      team.push(p);
      if (team.length === totalTeamSize) break;
    }
  }

  if (team.length === totalTeamSize) {
    // retirer les joueurs matchés de la queue
    for (const p of team) {
      const idx = waitingPlayers.findIndex((w) => w.socketId === p.socketId);
      if (idx !== -1) waitingPlayers.splice(idx, 1);
    }
    return team;
  }

  return null;
}

// Création d'un salon Discord (si ton service tourne sur 3001)
async function createDiscordRoom(roomId: string): Promise<string | null> {
  try {
    const res = await axios.post('http://localhost:3001/create-room', { roomId });
    return res.data.inviteUrl;
  } catch (error) {
    console.error('Erreur création salon Discord', error);
    return null;
  }
}

io.on('connection', (socket) => {
  console.log(`Client connecté : ${socket.id}`);

  socket.on('startSearch', async (criteria: Omit<SearchCriteria, 'socketId'>) => {
    console.log('Recherche démarrée par', socket.id, criteria);

    // Validation rapide
    if (
      !criteria?.userId ||
      !Array.isArray(criteria.languages) ||
      criteria.languages.length === 0 ||
      !Array.isArray(criteria.roles) ||
      criteria.roles.length === 0 ||
      criteria.roles.length > 2 ||
      !Array.isArray(criteria.moods) ||
      criteria.moods.length === 0 ||
      typeof criteria.teamSize !== 'number'
    ) {
      console.warn('Critères invalides:', criteria);
      return;
    }

    waitingPlayers.push({ ...criteria, socketId: socket.id });

    const matchedTeam = tryMatchPlayers();
    if (matchedTeam) {
      const roomId = 'match_' + Math.random().toString(36).substring(2, 10);
      const discordInvite = await createDiscordRoom(roomId); // ou null si tu ne veux pas Discord

      for (const player of matchedTeam) {
        io.to(player.socketId).emit('matchFound', {
          roomId,
          team: matchedTeam.map((p) => ({
            userId: p.userId,
            roles: p.roles,
            languages: p.languages,
            moods: p.moods,
          })),
          discordInvite,
        });
      }
    }
  });

  socket.on('stopSearch', () => {
    console.log(`Recherche arrêtée par ${socket.id}`);
    const index = waitingPlayers.findIndex((p) => p.socketId === socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
      console.log(`Joueur ${socket.id} retiré de la file d'attente`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client déconnecté : ${socket.id}`);
    const index = waitingPlayers.findIndex((p) => p.socketId === socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
      console.log(`Joueur ${socket.id} retiré de la file d'attente`);
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🚀 Socket.IO running`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
