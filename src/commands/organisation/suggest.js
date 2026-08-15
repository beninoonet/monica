const { Command } = require('@sapphire/framework');
const { MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle , ActionRowBuilder} = require('discord.js');

class SuggestCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
    .setName('suggest')
    .setDescription('Propose ton idée via un petit questionnaire !')
    )
  }

  async chatInputRun(interaction) {
    // create a modal with two text inputs for title and suggestion
    const suggestModal = new ModalBuilder();
    
    suggestModal.setCustomId('suggestionModal');
    suggestModal.setTitle('Propose ton idée !');

    const titleInput = new TextInputBuilder()
      .setCustomId('title_input')
      .setLabel('Titre de la suggestion')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const suggestionInput = new TextInputBuilder()
      .setCustomId('suggestion_input')
      .setLabel('Ta suggestion')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    // create two action rows to hold the text inputs
    const titleRow = new ActionRowBuilder().addComponents(titleInput);
    const descRow = new ActionRowBuilder().addComponents(suggestionInput);

    // add the action rows to the modal
    suggestModal.addComponents(titleRow, descRow);
    await interaction.showModal(suggestModal);

  }
}
module.exports = {
  SuggestCommand
};