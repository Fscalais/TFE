// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  TextChannel,
} from 'discord.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3001;

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID || '1402307106245316799';      // or move to env
const CATEGORY_ID = process.env.CATEGORY_ID || '1402307106840776797';// or move to env

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ Missing DISCORD_BOT_TOKEN env var');
  process.exit(1);
}
if (!GUILD_ID || !CATEGORY_ID) {
  console.error('❌ Missing GUILD_ID or CATEGORY_ID env vars');
  process.exit(1);
}

const INACTIVE_MS = 10 * 60 * 1000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`🤖 Bot connecté en tant que ${client.user?.tag}`);
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
  return new Date(d).toISOString().split('T')[1]?.replace('Z', '');
}

async function deleteRoom(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (room.timer) clearTimeout(room.timer);

    const [textCh, voiceCh] = await Promise.all([
      guild.channels.fetch(room.textChannelId).catch(() => null),
      guild.channels.fetch(room.voiceChannelId).catch(() => null),
    ]);

    await Promise.allSettled([
      textCh && 'delete' in textCh ? textCh.delete('Cleanup inactivité') : Promise.resolve(null),
      voiceCh && 'delete' in voiceCh ? voiceCh.delete('Cleanup inactivité') : Promise.resolve(null),
    ]);

    activeRooms.delete(roomId);
    console.log(`[CLEANUP] Salon ${roomId} supprimé`);
  } catch (err) {
    console.error('Erreur suppression salon Discord :', err);
  }
}

function scheduleInactivityTimer(roomId: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const deadlineAt = room.lastActivityAt + INACTIVE_MS;
  room.deadlineAt = deadlineAt;

  if (room.timer) clearTimeout(room.timer);
  let delay = Math.max(deadlineAt - Date.now(), 1000);

  room.timer = setTimeout(async () => {
    const current = activeRooms.get(roomId);
    if (!current || current.deadlineAt !== deadlineAt) return;

    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      const voice = await guild.channels.fetch(current.voiceChannelId);
      // @ts-ignore
      const hasMembers = voice && 'members' in voice && voice.members.size > 0;
      if (hasMembers) {
        console.log(`[${ts()}][TIMER] ${roomId}: membres présents -> on repousse`);
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
  console.log(`[${ts()}][TIMER] ${roomId}: deadline dans ~${Math.round(delay / 6000) / 10} min`);
}

function bumpActivity(roomId: string, source: string) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  room.lastActivityAt = Date.now();
  activeRooms.set(roomId, room);
  console.log(`[${ts()}][ACTIVITY] ${source} sur ${roomId}`);
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

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/create-room', async (req, res) => {
  const { roomId } = req.body as { roomId?: string };
  if (!roomId) return res.status(400).json({ error: 'roomId manquant' });

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const botId = client.user?.id ?? guild.members.me?.id;
    if (!botId) throw new Error('Bot ID introuvable');

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
    console.error('Erreur création salon Discord :', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

app.post('/delete-room', async (req, res) => {
  const { roomId } = req.body as { roomId?: string };
  if (!roomId) return res.status(400).json({ error: 'roomId manquant' });

  try {
    await deleteRoom(roomId);
    return res.json({ message: 'Salon supprimé' });
  } catch (error) {
    console.error('Erreur suppression salon Discord :', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

client.login(DISCORD_BOT_TOKEN).catch((e) => {
  console.error('❌ Discord login failed:', e);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`API bot Discord sur : ${PORT}`);
});

