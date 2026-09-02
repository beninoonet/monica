const { Command } = require("@sapphire/framework");
const { EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");

// database
const pool = require("../../lib/database");

class HoneypotCommand extends Command {
  constructor(context, options) {
    super(context, { ...options });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("honeypot")
        .setDescription(
          "Vous permet de configurer le salon pot de miel"
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription(
              "Sélectionnez le salon pot de miel"
            )
            .setRequired(true)
        )
    );
  }

    async chatInputRun(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "Vous n'avez pas la permission d'utiliser cette commande.",
                ephemeral: MessageFlags.Ephemeral,
            });
        }
        const channel = interaction.options.getChannel("channel");
        const guildId = interaction.guild.id;
        const imgHoneypot = "../"
        const res = await pool.query(
            "SELECT * FROM monica_honeypot_settings WHERE guild_id = $1",
            [guildId]
        );

        if (res.rowCount === 0) {
            await pool.query(
                "INSERT INTO monica_honeypot_settings (guild_id, honeypot_channel_id) VALUES ($1, $2)",
                [guildId, channel.id]
            );
        } else {
          await pool.query(
              "UPDATE monica_honeypot_settings SET honeypot_channel_id = $1 WHERE guild_id = $2",
              [channel.id, guildId]
          );
      }

      // send a warning message to the honeypot channel
      const embed = new EmbedBuilder()
          .setTitle("⚠️ Salon Pot de Miel")
          .setDescription("⚠️ Attention ! Ce salon est un **pot de miel**. Tout utilisateur qui enverra un message ici sera **banni** du serveur. Il s'agit d'une mesure de sécurité pour protéger le serveur contre les spams et les comportements malveillants. Veuillez ne pas envoyer de messages dans ce salon si vous n'êtes pas autorisé à le faire.")
          .setColor("Red")
          .setImage("https://i.pinimg.com/736x/57/67/ac/5767ac4491256868692b6baca9526f35.jpg")
      channel.send({ embeds: [embed] });

      return interaction.reply({
          content: `Le salon pot de miel a été mis à jour pour le serveur ${interaction.guild.name}.`,
          ephemeral: MessageFlags.Ephemeral,
      });
    }
}

module.exports = {
    HoneypotCommand,
};