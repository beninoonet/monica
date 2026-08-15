const { Command } = require('@sapphire/framework');
const { MessageFlags, EmbedBuilder } = require('discord.js');

class PingCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
    .setName('reminder')
    .setDescription('Commande pour envoyer un message à l\'utilisateur après x temps')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Le message à envoyer')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('delay')
        .setDescription('Le délai en minutes avant d\'envoyer le message')
        .setRequired(true))
    );
  }

  async chatInputRun(interaction) {
    // get the message and delay from the options
    const message = interaction.options.getString('message');
    const delay = interaction.options.getInteger('delay');

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Rappel programmé')
      .setDescription(`Votre message sera envoyé dans ${delay} minutes.`)
      .setTimestamp();

    // send a confirmation message to the user
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
      flags: MessageFlags.Ephemeral
    });

    // set a timeout to send the message after the specified delay
    setTimeout(async () => {
      try {
        const RepEmbed = new EmbedBuilder()
          .setColor('Random')
          .setTitle('Rappel')
          .setDescription(message)
          .setTimestamp();
        await interaction.user.send({ 
            content: `Votre rappel est arrivé !`,
            embeds: [RepEmbed] });
      } catch (error) {
        console.error(`Erreur lors de l'envoi du message à ${interaction.user.tag}:`, error);
      }
    }, delay * 60 * 1000); // convert minutes to milliseconds
    

  }
}
module.exports = {
  PingCommand
};