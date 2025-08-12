// src/index.ts
import {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  TextChannel,
} from "discord.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// Autorise uniquement ton API (optionnel mais conseillé)
const ALLOWED_ORIGIN = process.env.API_BASE_URL || "*";
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
  })
);

// ⚠️ Render fournit PORT via env var
const PORT = Number(process.env.PORT) || 3001;

// Inactivité (ex: 10 min)
const INACTIVE_MS = 10 * 60 * 1000;

// Intents NECESSAIRES (et à activer dans le Portal : Message Content Intent)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// IDs serveur/catégorie (à copier depuis Discord via “Developer Mode”)
const GUILD_ID = process.env.GUILD_ID as string;
const CATEGORY_ID = process.env.CATEGORY_ID as string;

// (Optionnel) secret partagé pour authentifier les appels venant de ton API
const BOT_SHARED_SECRET = process.env.BOT_SHARED_SECRET || "";

client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
});

// --- utils ---
type RoomInfo = {
  textChannelId: string;
  voiceChannelId: string;
  inviteUrl: string;
  lastActivityAt: number;
  deadlineAt?: number;
  timer?: NodeJS.Timeout;
};
const activeRooms = new Map<string, RoomInfo>();

function ts(d = Date.now()) {
  return new Date(d).toISOString().split("T")[1].replace("Z", "");
}

async function deleteRoom(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) throw new Error("Guild non trouvée");

    if (room.timer) clearTimeout(room.timer);

    const [textCh, voiceCh] = await Promise.all([
      guild.channels.fetch(room.textChannelId).catch(() => null),
      guild.channels.fetch(room.voiceChannelId).catch(() => null),
    ]);

    await Promise.allSettled([
      textCh && "delete" in textCh ? textCh.delete("Cleanup inactivité") : Promise.resolve(null),
      voiceCh && "delete" in voiceCh ? voiceCh.delete("Cleanup inactivité") : Promise.resolve(null),
    ]);

    activeRooms.delete(roomId);
    console.log(`[CLEANUP] Salon ${roomId} supprimé`);
  } catch (err) {
    console.error("Erreur suppression salon Discord :", err);
  }
}

function scheduleInactivityTimer(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const deadlineAt = room.lastActivityAt + INACTIVE_MS;
  room.deadlineAt = deadlineAt;

  if (room.timer) clearTimeout(room.timer);

  let delay = Math.max(1000, deadlineAt - Date.now());
  room.timer = setTimeout(async () => {
    const current = activeRooms.get(roomId);
    if (!current) return;
    // évite les collisions si on a replanifié
    if (current.deadlineAt !== deadlineAt) return;

    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      const voice = await guild.channels.fetch(current.voiceChannelId);
      // @ts-ignore
      const hasMembers = voice && "members" in voice && voice.members.size > 0;
      if (hasMembers) {
        current.lastActivityAt = Date.now();
        activeRooms.set(roomId, current);
        scheduleInactivityTimer(roomId);
        return;
      }
    } catch {}

    if (Date.now() >= deadlineAt) {
      await deleteRoom(roomId);
    } else {
      scheduleInactivityTimer(roomId);
    }
  }, delay);

  activeRooms.set(roomId, room);
}

function bumpActivity(roomId: string, source: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  room.lastActivityAt = Date.now();
  activeRooms.set(roomId, room);
  console.log(`[${ts()}][ACTIVITY] ${source} sur ${roomId} -> reset inactivité`);
  scheduleInactivityTimer(roomId);
}

function getRoomIdByTextChannel(channelId: string): string | null {
  for (const [rid, info] of activeRooms.entries()) {
    if (info.textChannelId === channelId) return rid;
  }
  return null;
}
function getRoomIdByVoiceChannel(channelId: string): string | null {
  for (const [rid, info] of activeRooms.entries()) {
    if (info.voiceChannelId === channelId) return rid;
  }
  return null;
}

// --- middleware d’auth (optionnel mais recommandé) ---
function requireBotSecret(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!BOT_SHARED_SECRET) return next(); // si pas configuré, on laisse passer (dev)
  const header = req.header("x-bot-secret");
  if (header !== BOT_SHARED_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// --- routes HTTP ---
app.get("/health", (_req, res) => {
  res.json({ ok: true, bot: client.user?.tag ?? null });
});

app.post("/create-room", requireBotSecret, async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "roomId manquant" });

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) throw new Error("Guild non trouvée");

    const botId = client.user?.id ?? guild.members.me?.id;
    if (!botId) throw new Error("Bot ID introuvable");

    const textChannel = await guild.channels.create({
      name: `match-${roomId}`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: botId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.CreateInstantInvite,
          ],
        },
      ],
    });

    const voiceChannel = await guild.channels.create({
      name: `match-${roomId}`,
      type: ChannelType.GuildVoice,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.Connect] },
        {
          id: botId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
          ],
        },
      ],
    });

    const invite = await (textChannel as TextChannel).createInvite({
      maxAge: 3600,
      maxUses: 0,
      unique: true,
      reason: `Invitation pour le match/scrim ${roomId}`,
    });

    activeRooms.set(roomId, {
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
      inviteUrl: invite.url,
      lastActivityAt: Date.now(),
    });

    scheduleInactivityTimer(roomId);

    return res.json({ inviteUrl: invite.url });
  } catch (error) {
    console.error("Erreur création salon Discord :", error);
    return res.status(500).json({ error: "Erreur interne" });
  }
});

app.post("/delete-room", requireBotSecret, async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "roomId manquant" });

  try {
    await deleteRoom(roomId);
    return res.json({ message: "Salon supprimé" });
  } catch (error) {
    console.error("Erreur suppression salon Discord :", error);
    return res.status(500).json({ error: "Erreur interne" });
  }
});

// --- listeners Discord (activité) ---
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  const rid = getRoomIdByTextChannel(message.channelId);
  if (!rid) return;
  bumpActivity(rid, "message");
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (newState.channelId) {
    const rid = getRoomIdByVoiceChannel(newState.channelId);
    if (rid) bumpActivity(rid, "join vocal");
  }
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const rid = getRoomIdByVoiceChannel(oldState.channelId);
    if (rid) bumpActivity(rid, "leave vocal");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`🌐 API bot Discord sur :${PORT}`);
});
