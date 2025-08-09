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
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET!;

// URLs (prod-friendly)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3001';

// --- Middleware ---
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use('/api', scrimRoutes);

// --- Passport Google OAuth config ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done: (err: any, user?: any) => void) => done(null, obj));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${API_BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails?.[0].value,
          });
        }
        // on ne renvoie pas le token ici, il sera créé dans la route callback
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

app.use(passport.initialize());

// OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    // redirige vers le front
    res.redirect(`${CLIENT_URL}/auth/success?token=${token}`);
  }
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/riot', riotRoutes);
app.use('/matchmaking', matchmakingRoutes);

// petite route de santé
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: [CLIENT_URL, 'http://localhost:3000'] },
});

/* ===========================
   Matchmaking multi-critères
   =========================== */

// rangs + helpers
const RANKS = [
  'Fer',
  'Bronze',
  'Argent',
  'Or',
  'Platine',
  'Émeraude',
  'Diamant',
  'Maître',
  'GrandMaître',
  'Challenger',
] as const;

const rankIdx = (r: string) => RANKS.indexOf(r as any);
const ranksClose = (a: string, b: string, tolerance = 1) =>
  Math.abs(rankIdx(a) - rankIdx(b)) <= tolerance; // même rang ou +/-1

interface SearchCriteria {
  socketId: string;
  userId: string;
  languages: string[];
  roles: string[];
  moods: string[];
  teamSize: number;
  rank: string; // NEW
}

const waitingPlayers: SearchCriteria[] = [];

const intersects = (a: string[], b: string[]) => a.some((x) => b.includes(x));
const pickAvailableRole = (roles: string[], used: Set<string>) =>
  roles.find((r) => !used.has(r)) || null;

function tryMatchPlayers() {
  if (waitingPlayers.length === 0) return null;

  const seed = waitingPlayers[0];
  const totalTeamSize = seed.teamSize + 1;

  const candidates = waitingPlayers.filter(
    (p) =>
      intersects(p.languages, seed.languages) &&
      intersects(p.moods, seed.moods) &&
      ranksClose(p.rank, seed.rank, 1) // tolérance +/-1
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
    // retire de la file d'attente
    for (const p of team) {
      const idx = waitingPlayers.findIndex((w) => w.socketId === p.socketId);
      if (idx !== -1) waitingPlayers.splice(idx, 1);
    }
    return team;
  }
  return null;
}

async function createDiscordRoom(roomId: string): Promise<string | null> {
  try {
    const res = await axios.post(`${DISCORD_BOT_URL}/create-room`, { roomId });
    return res.data.inviteUrl;
  } catch (error) {
    console.error('Erreur création salon Discord', error);
    return null;
  }
}

io.on('connection', (socket) => {
  console.log(`Client connecté : ${socket.id}`);

  socket.on('startSearch', async (criteria: Omit<SearchCriteria, 'socketId'>) => {
    // validation
    if (
      !criteria?.userId ||
      !Array.isArray(criteria.languages) || criteria.languages.length === 0 ||
      !Array.isArray(criteria.roles)     || criteria.roles.length === 0 || criteria.roles.length > 2 ||
      !Array.isArray(criteria.moods)     || criteria.moods.length === 0 ||
      typeof criteria.teamSize !== 'number' ||
      !RANKS.includes(criteria.rank as any)
    ) {
      console.warn('Critères invalides:', criteria);
      return;
    }

    waitingPlayers.push({ ...criteria, socketId: socket.id });

    const matchedTeam = tryMatchPlayers();
    if (matchedTeam) {
      const roomId = 'match_' + Math.random().toString(36).substring(2, 10);
      const discordInvite = await createDiscordRoom(roomId); // peut être null si bot down

      for (const player of matchedTeam) {
        io.to(player.socketId).emit('matchFound', {
          roomId,
          team: matchedTeam.map((p) => ({
            userId: p.userId,
            roles: p.roles,
            languages: p.languages,
            moods: p.moods,
            rank: p.rank,
          })),
          discordInvite,
        });
      }
    }
  });

  socket.on('stopSearch', () => {
    const index = waitingPlayers.findIndex((p) => p.socketId === socket.id);
    if (index !== -1) waitingPlayers.splice(index, 1);
  });

  socket.on('disconnect', () => {
    const index = waitingPlayers.findIndex((p) => p.socketId === socket.id);
    if (index !== -1) waitingPlayers.splice(index, 1);
  });
});

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 Socket.IO running`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
