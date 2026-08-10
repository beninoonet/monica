const { Command } = require("@sapphire/framework");
const { EmbedBuilder, MessageFlags } = require("discord.js");


class ReporterCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("report")
        .setDescription(
          "Vous permet de signaler un utilisateur pour un comportement inapproprié"
        )
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("L'utilisateur que vous souhaitez signaler")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription(
              "La raison pour laquelle vous signalez cet utilisateur"
            )
            .setRequired(true)
        )
    );
  }

    async chatInputRun(interaction) {
        const reporter = interaction.user;
        const reportedUser = interaction.options.getUser("user");
        const reason =
            interaction.options.getString("reason");

        const reportChannel = interaction.guild.channels.cache.get(process.env.REPORT_CHANNEL);

        if (!reportChannel) {
            return interaction.reply({
                content: "Le canal de signalement n'a pas été trouvé.",
                ephemeral: MessageFlags.Ephemeral,
            });
        }

        if (reportedUser.id === reporter.id) {
            return interaction.reply({
                content: "Vous ne pouvez pas vous signaler vous-même.",
                ephemeral: MessageFlags.Ephemeral,
            });
        }

        if (reportedUser.bot) {
            return interaction.reply({
                content: "Vous ne pouvez pas signaler un bot.",
                ephemeral: MessageFlags.Ephemeral,
            });
        }

        const reportEmbed = new EmbedBuilder()
            .setAuthor({ name: reporter.tag, iconURL: reporter.displayAvatarURL() })
            .setTitle("Nouveau signalement")
            .addFields(
                { name: "Utilisateur signalé", value: reportedUser.tag, inline: true },
                { name: "Raison", value: reason, inline: false }
            )
            .setTimestamp()
            .setThumbnail(reportedUser.displayAvatarURL())
            .setColor(0xff0000);
        
            reportChannel.send({ embeds: [reportEmbed] });


    }

}

module.exports = {
    ReporterCommand,
};