
const { Command } = require('@sapphire/framework');
const { ModalBuilder, TextInputBuilder, TextInputStyle , ActionRowBuilder} = require('discord.js');

class GiveawayCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
    .setName('giveaway')
    .setDescription('Créer un giveaway')
    )
  }

  async chatInputRun(interaction) {
    // create a modal with two text inputs for title and suggestion
    const giveModal = new ModalBuilder();
    
    giveModal.setCustomId('giveawayModal');
    giveModal.setTitle('Créer un giveaway !');

     const winnerInput = new TextInputBuilder()
      .setCustomId('winner_input')
      .setLabel('Nombre de gagnants du giveaway')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const priceInput = new TextInputBuilder()
      .setCustomId('price_input')
      .setLabel('Gain du giveaway')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('desc_input')
      .setLabel('Description du giveaway')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);
    
    const endDateInput = new TextInputBuilder()
      .setCustomId('end_date_input')
      .setLabel('Durée (ex. 2d, 3h, 30m)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    const imgInput = new TextInputBuilder()
      .setCustomId('img_input')
      .setLabel('Image du giveaway (optionnel)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    
   

    // create two action rows to hold the text inputs
    const priceRow = new ActionRowBuilder().addComponents(priceInput);
    const descRow = new ActionRowBuilder().addComponents(descInput);
    const endDateRow = new ActionRowBuilder().addComponents(endDateInput);
    const imgRow = new ActionRowBuilder().addComponents(imgInput);
    const winnerRow = new ActionRowBuilder().addComponents(winnerInput);
    // add the action rows to the modal
    giveModal.addComponents(priceRow, descRow, endDateRow, imgRow, winnerRow);
    await interaction.showModal(giveModal);

  }
}
module.exports = {
    GiveawayCommand
};