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

const INACTIVE_MS = 1 * 60 * 1000;

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
  timer?: NodeJS.Timeout;
};
const activeRooms = new Map<string, RoomInfo>();

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


      // @ts-ignore
      const hasMembers = voice && "members" in voice && voice.members.size > 0;
      if (hasMembers) {
        console.log(`[TIMER] ${roomId}: membres présents -> on reprogramme`);
        scheduleInactivityTimer(roomId);
        return;
      }
    } catch {
    }

    const now = Date.now();
    if (now - current.lastActivityAt >= INACTIVE_MS) {
      await deleteRoom(roomId);
    } else {
      scheduleInactivityTimer(roomId);
    }
  }, INACTIVE_MS);

  activeRooms.set(roomId, room);
}

function bumpActivity(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  room.lastActivityAt = Date.now();
  activeRooms.set(roomId, room);
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

  console.log(`[ACTIVITY] message sur ${rid}`);
  bumpActivity(rid);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (newState.channelId) {
    const rid = getRoomIdByVoiceChannel(newState.channelId);
    if (rid) {
      console.log(`[ACTIVITY] join vocal ${rid}`);
      bumpActivity(rid);
    }
  }
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
