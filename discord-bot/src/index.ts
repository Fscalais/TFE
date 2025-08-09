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
app.use(cors());
app.use(express.json());

const PORT = 3001;

// 1h d'inactivité
const INACTIVE_MS = 15 * 60 * 1000;

// ⚠️ Intents ajoutés: GuildMessages + MessageContent pour capter les messages
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const GUILD_ID = "1402307106245316799";
const CATEGORY_ID = "1402307106840776797";

client.once("ready", () => {
  console.log(`Bot connecté en tant que ${client.user?.tag}`);
});

// roomId -> infos + dernier timestamp + timer
type RoomInfo = {
  textChannelId: string;
  voiceChannelId: string;
  inviteUrl: string;
  lastActivityAt: number;        // ms epoch
  timer?: NodeJS.Timeout;
};
const activeRooms = new Map<string, RoomInfo>();

/** Supprime proprement une room (texte + vocal) */
async function deleteRoom(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) throw new Error("Guild non trouvée");

    if (room.timer) clearTimeout(room.timer);

    await guild.channels.delete(room.textChannelId).catch(() => null);
    await guild.channels.delete(room.voiceChannelId).catch(() => null);

    activeRooms.delete(roomId);
    console.log(`[CLEANUP] Salon ${roomId} supprimé`);
  } catch (err) {
    console.error("Erreur suppression salon Discord :", err);
  }
}

/** (Re)programme un timer d'inactivité.
 *  - Si quelqu’un est dans le vocal au moment d’expirer, on RE-ARME pour 1h.
 *  - Sinon on supprime.
 */
function scheduleInactivityTimer(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  if (room.timer) clearTimeout(room.timer);

  room.timer = setTimeout(async () => {
    const current = activeRooms.get(roomId);
    if (!current) return;

    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      const voice = await guild.channels.fetch(current.voiceChannelId);

      // Si le vocal existe et a des membres, ne pas supprimer -> on reprogramme
      // (présence en vocal = activité continue)
      // @ts-ignore – voice peut être null si déjà supprimé
      const hasMembers = voice && "members" in voice && voice.members.size > 0;
      if (hasMembers) {
        console.log(`[TIMER] ${roomId}: membres présents -> on reprogramme`);
        scheduleInactivityTimer(roomId);
        return;
      }
    } catch {
      // si fetch échoue, on continue la logique de suppression
    }

    // Si personne présent et pas d’activité récente depuis 1h -> supprimer
    const now = Date.now();
    if (now - current.lastActivityAt >= INACTIVE_MS) {
      await deleteRoom(roomId);
    } else {
      // cas rare: activité tout juste loggée mais timer d’avant a expiré
      scheduleInactivityTimer(roomId);
    }
  }, INACTIVE_MS);

  activeRooms.set(roomId, room);
}

/** Déclare de l’activité et relance le timer */
function bumpActivity(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  room.lastActivityAt = Date.now();
  activeRooms.set(roomId, room);
  scheduleInactivityTimer(roomId);
}

/** Utilitaires pour retrouver un roomId à partir d’un channelId */
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

// -------- API --------

app.post("/create-room", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "roomId manquant" });

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) throw new Error("Guild non trouvée");

    const textChannel = await guild.channels.create({
      name: `match-text-${roomId}`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
      ],
    });

    const voiceChannel = await guild.channels.create({
      name: `match-voice-${roomId}`,
      type: ChannelType.GuildVoice,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.Connect] },
      ],
    });

    const invite = await (textChannel as TextChannel).createInvite({
      maxAge: 3600, // 1h
      maxUses: 0,
      unique: true,
      reason: `Invitation pour le match ${roomId}`,
    });

    activeRooms.set(roomId, {
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
      inviteUrl: invite.url,
      lastActivityAt: Date.now(), // point de départ = création (=> “1h après création si rien ne se passe”)
    });

    // Programme l’auto-suppression depuis la création
    scheduleInactivityTimer(roomId);

    return res.json({ inviteUrl: invite.url });
  } catch (error) {
    console.error("Erreur création salon Discord :", error);
    return res.status(500).json({ error: "Erreur interne" });
  }
});

app.post("/delete-room", async (req, res) => {
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

// -------- EVENTS --------

// Message dans le text channel => on considère ça comme activité et on relance le timer
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  const rid = getRoomIdByTextChannel(message.channelId);
  if (!rid) return;

  console.log(`[ACTIVITY] message sur ${rid}`);
  bumpActivity(rid);
});

// Voice: join / leave / move -> activité
client.on("voiceStateUpdate", (oldState, newState) => {
  // join
  if (newState.channelId) {
    const rid = getRoomIdByVoiceChannel(newState.channelId);
    if (rid) {
      console.log(`[ACTIVITY] join vocal ${rid}`);
      bumpActivity(rid);
    }
  }
  // leave
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const rid = getRoomIdByVoiceChannel(oldState.channelId);
    if (rid) {
      console.log(`[ACTIVITY] leave vocal ${rid}`);
      bumpActivity(rid);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`API bot Discord démarrée sur http://localhost:${PORT}`);
});
