//Bot Discord
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

const INACTIVE_MS = 10 * 60 * 1000;

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
      guild.channels.fetch(room.textChannelId).catch((e) => {
        console.warn(`[CLEANUP] fetch text échoué ${room.textChannelId}:`, e?.message);
        return null;
      }),
      guild.channels.fetch(room.voiceChannelId).catch((e) => {
        console.warn(`[CLEANUP] fetch voice échoué ${room.voiceChannelId}:`, e?.message);
        return null;
      }),
    ]);

    const results = await Promise.allSettled([
      textCh && "delete" in textCh ? textCh.delete("Cleanup inactivité") : Promise.resolve("ok-text-inexistant"),
      voiceCh && "delete" in voiceCh ? voiceCh.delete("Cleanup inactivité") : Promise.resolve("ok-voice-inexistant"),
    ]);

    results.forEach((r, i) => {
      const kind = i === 0 ? "text" : "voice";
      if (r.status === "fulfilled") {
        console.log(`[CLEANUP] ${kind} supprimé (${roomId})`);
      } else {
        console.error(`[CLEANUP] ${kind} échec (${roomId}):`, r.reason?.message ?? r.reason);
      }
    });

    const textGone = !textCh || results[0].status === "fulfilled";
    const voiceGone = !voiceCh || results[1].status === "fulfilled";
    if (textGone && voiceGone) {
      activeRooms.delete(roomId);
      console.log(`[CLEANUP] Salon ${roomId} supprimé (ok)`);
    } else {
      console.warn(`[CLEANUP] Salon ${roomId}: au moins un canal non supprimé`);
    }
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

  let delay = deadlineAt - Date.now();
  if (!Number.isFinite(delay) || delay < 1000) delay = 1000;

  room.timer = setTimeout(async () => {
    const current = activeRooms.get(roomId);
    if (!current) return;

    if (current.deadlineAt !== deadlineAt) {
      return;
    }

    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      const voice = await guild.channels.fetch(current.voiceChannelId);
      // @ts-ignore
      const hasMembers = voice && "members" in voice && voice.members.size > 0;
      if (hasMembers) {
        console.log(`[${ts()}][TIMER] ${roomId}: membres présents -> on repousse l'inactivité`);
        current.lastActivityAt = Date.now();
        activeRooms.set(roomId, current);
        scheduleInactivityTimer(roomId);
        return;
      }
    } catch {
    }

    if (Date.now() >= deadlineAt) {
      await deleteRoom(roomId);
    } else {
      scheduleInactivityTimer(roomId);
    }
  }, delay);

  activeRooms.set(roomId, room);

  const mins = Math.round((delay / 60000) * 10) / 10;
  console.log(`[${ts()}][TIMER] ${roomId}: nouvelle deadline dans ~${mins} min`);
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

app.post("/create-room", async (req, res) => {
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
        // @everyone ne voit pas
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
      reason: `Invitation pour le match ${roomId}`,
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
  console.log(`API bot Discord démarrée sur http://localhost:${PORT}`);
});
