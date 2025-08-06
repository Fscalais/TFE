import { Client, GatewayIntentBits, PermissionsBitField, ChannelType } from "discord.js";
import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001; // port API bot

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Ton ID serveur Discord
const GUILD_ID = "1402307106245316799";
const CATEGORY_ID = "1402307106840776797";

client.once("ready", () => {
  console.log(`Bot connecté en tant que ${client.user?.tag}`);
});

// Stockage simple en mémoire { roomId: { textChannelId, voiceChannelId, inviteUrl } }
const activeRooms = new Map<string, { textChannelId: string; voiceChannelId: string; inviteUrl: string }>();

// API pour créer un salon
app.post("/create-room", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "roomId manquant" });

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) throw new Error("Guild non trouvée");

    // Créer un salon texte privé
    const textChannel = await guild.channels.create({
      name: `match-text-${roomId}`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        // Optionnel : tu peux ajouter ici des permissions pour certains rôles ou bots
      ],
    });

    // Créer un salon vocal privé
    const voiceChannel = await guild.channels.create({
      name: `match-voice-${roomId}`,
      type: ChannelType.GuildVoice,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.Connect],
        },
      ],
    });

    // Créer un lien d'invitation pour le salon texte
    const invite = await textChannel.createInvite({
      maxAge: 3600, // 1h
      maxUses: 0,   // illimité
      unique: true,
      reason: `Invitation pour le match ${roomId}`,
    });

    activeRooms.set(roomId, {
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
      inviteUrl: invite.url,
    });

    return res.json({ inviteUrl: invite.url });
  } catch (error) {
    console.error("Erreur création salon Discord :", error);
    return res.status(500).json({ error: "Erreur interne" });
  }
});

// API pour supprimer un salon (optionnel)
app.post("/delete-room", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "roomId manquant" });

  try {
    const room = activeRooms.get(roomId);
    if (!room) return res.status(404).json({ error: "Salon inconnu" });

    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) throw new Error("Guild non trouvée");

    // Supprimer les salons
    await guild.channels.delete(room.textChannelId);
    await guild.channels.delete(room.voiceChannelId);

    activeRooms.delete(roomId);

    return res.json({ message: "Salon supprimé" });
  } catch (error) {
    console.error("Erreur suppression salon Discord :", error);
    return res.status(500).json({ error: "Erreur interne" });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`API bot Discord démarrée sur http://localhost:${PORT}`);
});
