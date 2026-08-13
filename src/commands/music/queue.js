const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

class QueueCommand extends Command {
  constructor(context, options) {
    super(context, { ...options, name: 'queue', description: 'Affiche la file d\'attente' });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('queue').setDescription('Affiche la file d\'attente')
    );
  }

  async chatInputRun(interaction) {
    const { kazagumo } = require('@sapphire/framework').container;
    const player = kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ Aucune musique en cours.', ephemeral: true });
    }

    const current = player.queue.current;
    const tracks = player.queue.slice(0, 10); // Max 10 affichés

    const embed = new EmbedBuilder()
      .setTitle('🎵 File d\'attente')
      .setColor(0x5865f2)
      .setDescription(
        `**En cours :** [${current.title}](${current.uri})\n\n` +
        (tracks.length
          ? tracks.map((t, i) => `**${i + 1}.** [${t.title}](${t.uri})`).join('\n')
          : '*La file est vide*')
      );

    interaction.reply({ embeds: [embed] });
  }
}

module.exports = { QueueCommand };