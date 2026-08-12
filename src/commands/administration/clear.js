const { Command } = require("@sapphire/framework");
const { EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");


class ClearCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("clear")
        .setDescription(
          "Permet de supprimer un certain nombre de messages dans le canal actuel"
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Le nombre de messages à supprimer")
            .setRequired(true)
        )
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription(
              "L'utilisateur dont vous souhaitez supprimer les messages (optionnel)"
            )
            .setRequired(false)
        )
    );
  }

    async chatInputRun(interaction) {
        // Check if the user has the required permissions "ManageMessages"
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: "Vous n'avez pas la permission de gérer les messages.",
                ephemeral: MessageFlags.Ephemeral,
            });
        }
        // Get the amount and user options from the interaction
        const amount = interaction.options.getInteger("amount");
        const user = interaction.options.getUser("user");

        // Fetch the messages from the channel
        if (amount < 1 || amount > 100) {
            return interaction.reply({
                content: "Vous devez spécifier un nombre entre 1 et 100.",
                ephemeral: MessageFlags.Ephemeral,
            });
        }

        // Fetch the messages from the channel
        const fetch = await interaction.channel.messages.fetch({ limit: amount });

        // Filter the messages to delete based on the user option
        const toDelete = user ? fetch.filter((msg) => msg.author.id === user.id) : fetch;

        // Bulk delete the messages
        const deleted = await interaction.channel.bulkDelete(toDelete, true);

        // Create an embed to show the result of the deletion and send it 
        const embed = new EmbedBuilder()
            .setTitle("Messages supprimés")
            .setDescription(
                `J'ai supprimé ${deleted.size} message${deleted.size > 1 ? "s" : ""}${
                    user ? ` de **${user.tag}**` : ""
                }.`
            )
            .setColor("Green")
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await interaction.reply({ embeds: [embed] });

        // Delete the reply after 5 seconds
        setTimeout(() => {
            interaction.deleteReply();
        }, 5000); 
    }
}

module.exports = {
    ClearCommand
};