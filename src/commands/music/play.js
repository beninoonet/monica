const { Command } = require('@sapphire/framework');
const { container } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

class PlayCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'play',
      description: 'Joue une musique',
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('play')
        .setDescription('Joue une musique')
        .addStringOption((opt) =>
          opt.setName('query').setDescription('Nom ou URL').setRequired(true)
        )
    );
  }

  async chatInputRun(interaction) {
    const query = interaction.options.getString('query');
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Tu dois être dans un salon vocal !', ephemeral: true });
    }

    await interaction.deferReply();

    const { kazagumo } = container;

    const result = await kazagumo.search(query, { requester: interaction.user });

    if (!result.tracks.length) {
      return interaction.editReply({ content: '❌ Aucune musique trouvée pour ta recherche.', ephemeral: true });
    }

    let player = kazagumo.players.get(interaction.guildId);

    if (!player) {
      player = await kazagumo.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        volume: 80,
        deaf: true,
      });
    }

    if (result.type === 'PLAYLIST') {
      for (const track of result.tracks) player.queue.add(track);
    } else {
      player.queue.add(result.tracks[0]);
    }

    if (!player.playing && !player.paused) await player.play();

    // Construction de l'embed
    const current = player.queue.current ?? result.tracks[0];
    const next = player.queue[0] ?? null;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({
        name: '🎵 Musique ajoutée',
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle(current.title)
      .setURL(current.uri)
      .setThumbnail(current.thumbnail ?? `https://img.youtube.com/vi/${current.identifier}/mqdefault.jpg`)
      .addFields(
        {
          name: '👤 Artiste',
          value: current.author ?? 'Inconnu',
          inline: true,
        },
        {
          name: '⏱️ Durée',
          value: current.isStream ? '🔴 Live' : formatDuration(current.length),
          inline: true,
        },
        {
          name: '🎤 Demandé par',
          value: `${current.requester}`,
          inline: true,
        },
        {
          name: '⏭️ Suivant',
          value: next ? `[${next.title}](${next.uri})` : '*Aucune piste suivante*',
          inline: false,
        },
        {
          name: '📋 File d\'attente',
          value: `${player.queue.size} piste(s) restante(s)`,
          inline: true,
        }
      )
      .setFooter({ text: `Volume : ${player.volume}%` })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  }
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

module.exports = { PlayCommand };