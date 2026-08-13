const { Command } = require('@sapphire/framework');

class StopCommand extends Command {
  constructor(context, options) {
    super(context, { ...options, name: 'stop', description: 'Stoppe la musique et déconnecte le bot' });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('stop').setDescription('Stop la musique')
    );
  }

  async chatInputRun(interaction) {
    const { kazagumo } = require('@sapphire/framework').container;
    const player = kazagumo.players.get(interaction.guildId);

    if (!player) return interaction.reply({ content: '❌ Aucune musique en cours.', ephemeral: true });

    player.destroy();
    interaction.reply({
      content: '⏹️ Musique arrêtée et bot déconnecté.',
      ephemeral: true
    });
  }
}

module.exports = { StopCommand };