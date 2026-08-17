require("dotenv").config();
const { SapphireClient, ApplicationCommandRegistries, container } = require("@sapphire/framework");
const { GatewayIntentBits, EmbedBuilder } = require("discord.js");
// subcommand plugin
const { SubcommandPluginIdentifiers } = require('@sapphire/plugin-subcommands');
// Kazagumo and Shoukaku for music playback
const { Kazagumo, Plugins } = require('kazagumo');
const { Connectors } = require('shoukaku');



// Init a command only on a specific guild for development
ApplicationCommandRegistries.setDefaultGuildIds([process.env.GUILD_ID]);

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  loadMessageCommandListeners: true,
  loadDefaultErrorListeners: true,


});

function createProgressBar(current, total, size = 15) {
  if (!total) return '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
  const progress = Math.round((current / total) * size);
  const filled = '▬'.repeat(Math.max(0, progress - 1));
  const thumb = '🔘';
  const empty = '▬'.repeat(Math.max(0, size - progress));
  return filled + thumb + empty;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/* client.once('ready', () => {

  container.kazagumo = new Kazagumo(
    {
      defaultSearchEngine: 'ytsearch',
      plugins: [new Plugins.PlayerMoved(client)],
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
    },
    new Connectors.DiscordJS(client),
    [
      {
        name: 'main',
        url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
        auth: `${process.env.LAVALINK_PASSWORD}`,
        secure: false,
      },
    ]
  );

  container.kazagumo.shoukaku.on('error', (node, error) => {
    console.error(`[Shoukaku] Erreur sur le nœud ${node?.name}:`, error);
  });

  container.kazagumo.shoukaku.on('ready', (name) => {
    console.log(`✅ Nœud Lavalink connecté : ${name}`);
  });

  container.kazagumo.shoukaku.on('close', (node, code, reason) => {
    console.warn(`[Shoukaku] Nœud ${node?.name} fermé (${code}): ${reason}`);
  });

  container.kazagumo.shoukaku.on('disconnect', (node) => {
    console.warn(`[Shoukaku] Nœud ${node?.name} déconnecté`);
  });
  

container.kazagumo.on('playerStart', (player, track) => {
  const channel = client.channels.cache.get(player.textId);
  if (!channel) return;

  const buildEmbed = () => {
    const position = player.position; // ms écoulées
    const next = player.queue[0] ?? null;

    const progressBar = createProgressBar(position, track.length);

    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: '▶️ Lecture en cours' })
      .setTitle(track.title)
      .setURL(track.uri)
      .setThumbnail(
        track.thumbnail ??
        `https://img.youtube.com/vi/${track.identifier}/mqdefault.jpg`
      )
      .addFields(
        { name: '👤 Artiste', value: track.author ?? 'Inconnu', inline: true },
        { name: '⏱️ Durée', value: track.isStream ? '🔴 Live' : formatDuration(track.length), inline: true },
        { name: '🎤 Demandé par', value: `${track.requester}`, inline: true },
        {
          name: '🎵 Progression',
          value: `${formatDuration(position)} ${progressBar} ${formatDuration(track.length)}`,
          inline: false,
        },
        {
          name: '⏭️ Suivant',
          value: next ? `[${next.title}](${next.uri})` : '*Aucune piste suivante*',
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: `Volume ${player.volume}%` });
  };

  channel.send({ embeds: [buildEmbed()] }).then(msg => {

    const interval = setInterval(async () => {

      if (!player.playing || player.queue.current?.identifier !== track.identifier) {
        clearInterval(interval);
        return;
      }

      try {
        await msg.edit({ embeds: [buildEmbed()] });
      } catch {
        clearInterval(interval);
      }
    }, 15000);

    // Nettoyer à la fin de la track
    container.kazagumo.once('playerEnd', () => {
      clearInterval(interval);
      msg.delete().catch(() => {});
    });
  });
});

  container.kazagumo.on('playerError', (player, error) => {
    console.error('❌ Erreur player :', error);
  });
}); */
 
  

// Command to test the join and quit events
/* client.on('messageCreate', (message) => {
  if (message.content === 'join') {
    try {
      client.emit('guildMemberAdd', message.member);
      }
     catch (error) {
      console.error('Error executing join message listener:', error);
    }
  }

  if (message.content === 'quit') {
    try {
      client.emit('guildMemberRemove', message.member);
      }
     catch (error) {
      console.error('Error executing quit message listener:', error);
    }
  }
}); */

client.login(process.env.DISCORD_TOKEN)