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
app.use(cors({
  origin: 'http://localhost:3000', // frontend React
  credentials: true,
}));

app.use(express.json());
app.use('/api', scrimRoutes);

// --- Passport Google OAuth config ---
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj: any, done: (err: any, user?: any) => void) => {
  done(null, obj);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "http://localhost:5000/auth/google/callback",
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
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Passer user et token à req.user dans callback
    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));

app.use(passport.initialize());
// Ne pas utiliser passport.session() car on ne gère plus les sessions express
// app.use(passport.session());

// --- Routes Google OAuth ---
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    // Redirige vers frontend avec le token JWT dans l'URL
    res.redirect(`http://localhost:3000/auth/success?token=${token}`);
  }
);

// Supprimer la route /auth/user car elle dépend des sessions et n'est plus utilisée avec JWT
// app.get('/auth/user', (req, res) => {
//   if (!req.user) return res.status(401).json({ message: 'Non connecté' });
//   res.json({ user: req.user });
// });

// --- Autres routes API ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/riot', riotRoutes);
app.use("/matchmaking", matchmakingRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// --- Matchmaking code (inchangé) ---
interface SearchCriteria {
  socketId: string;
  userId: string;
  language: string;
  role: string;
  mood: string;
  teamSize: number;
}
const waitingPlayers: SearchCriteria[] = [];
function tryMatchPlayers() {
  if (waitingPlayers.length === 0) return null;
  const firstPlayer = waitingPlayers[0];
  const neededPlayers = firstPlayer.teamSize;
  const totalTeamSize = neededPlayers + 1;
  const groupedByLang: Record<string, SearchCriteria[]> = {};
  for (const p of waitingPlayers) {
    if (!groupedByLang[p.language]) groupedByLang[p.language] = [];
    groupedByLang[p.language].push(p);
  }
  const players = groupedByLang[firstPlayer.language];
  if (!players) return null;
  const rolesSet = new Set<string>();
  const team: SearchCriteria[] = [];
  for (const player of players) {
    if (!rolesSet.has(player.role)) {
      rolesSet.add(player.role);
      team.push(player);
      if (team.length === totalTeamSize) break;
    }
  }
  if (team.length === totalTeamSize) {
    for (const p of team) {
      const index = waitingPlayers.findIndex(wp => wp.socketId === p.socketId);
      if (index !== -1) waitingPlayers.splice(index, 1);
    }
    return team;
  }
  return null;
}
async function createDiscordRoom(roomId: string): Promise<string | null> {
  try {
    const res = await axios.post("http://localhost:3001/create-room", { roomId });
    return res.data.inviteUrl;
  } catch (error) {
    console.error("Erreur création salon Discord", error);
    return null;
  }
}
io.on("connection", (socket) => {
  console.log(`Client connecté : ${socket.id}`);

  socket.on("startSearch", async (criteria: Omit<SearchCriteria, "socketId">) => {
    console.log("Recherche démarrée par", socket.id, criteria);
    waitingPlayers.push({ ...criteria, socketId: socket.id });
    const matchedTeam = tryMatchPlayers();
    if (matchedTeam) {
      const roomId = "match_" + Math.random().toString(36).substring(2, 10);
      const discordInvite = await createDiscordRoom(roomId);
      for (const player of matchedTeam) {
        io.to(player.socketId).emit("matchFound", {
          roomId,
          team: matchedTeam.map(p => ({
            userId: p.userId,
            role: p.role,
            language: p.language,
            mood: p.mood,
          })),
          discordInvite,
        });
      }
    }
  });

  socket.on("stopSearch", () => {
    console.log(`Recherche arrêtée par ${socket.id}`);
    const index = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
      console.log(`Joueur ${socket.id} retiré de la file d'attente`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client déconnecté : ${socket.id}`);
    const index = waitingPlayers.findIndex(p => p.socketId === socket.id);
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
