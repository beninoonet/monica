const { Command } = require('@sapphire/framework');

class SkipCommand extends Command {
  constructor(context, options) {
    super(context, { ...options, name: 'skip', description: 'Passe à la piste suivante' });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('skip').setDescription('Passe à la piste suivante')
    );
  }

  async chatInputRun(interaction) {
    const { kazagumo } = require('@sapphire/framework').container;
    const player = kazagumo.players.get(interaction.guildId);

    if (!player) return interaction.reply({ content: '❌ Aucune musique en cours.', ephemeral: true });

    player.skip();
    interaction.reply('⏭️ Musique passée à la suivante.');
  }
}

module.exports = { SkipCommand };