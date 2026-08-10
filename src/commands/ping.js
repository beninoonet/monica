const { isMessageInstance } = require('@sapphire/discord.js-utilities');
const { Command } = require('@sapphire/framework');
const { MessageFlags, PermissionFlagsBits } = require('discord.js');

class PingCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('ping').setDescription('Vérifie que le bot est en marche et répond correctement.'),
    );
  }

  async chatInputRun(interaction) {
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'Tu n\'as pas la permission d\'utiliser cette commande. (Administrateur requis)',
        ephemeral: true
      });
    }

    try {const callbackResponse = await interaction.reply({
      content: `Ping?`,
      withResponse: true,
      flags: MessageFlags.Ephemeral
    });
    const msg = callbackResponse.resource?.message;

    if (msg && isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);
      return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
    }

    return interaction.editReply('Failed to retrieve ping :(');
  } catch (error) {
    console.error(error);
    return interaction.editReply('An error occurred while trying to retrieve ping :(');
  }
  }
}
module.exports = {
  PingCommand
};