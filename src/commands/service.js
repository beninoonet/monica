const { Command } = require('@sapphire/framework');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

class ServiceCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
    .setName('service')
    .setDescription('Liste les services disponibles et leur statut.'),
    );
  }

  async chatInputRun(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Services Disponibles')
      .setDescription('Voici la liste des services disponibles et leur statut :')
      .addFields(
        { name: 'Service 1', value: 'Description 1', inline: true },
        { name: 'Service 2', value: 'Description 2', inline: true },
        { name: 'Service 3', value: 'Description 3', inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'TechDownBot' });

    await interaction.reply({ embeds: [embed] });

   
  }
}
module.exports = 
{
  ServiceCommand
};