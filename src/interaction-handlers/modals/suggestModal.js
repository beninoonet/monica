const { InteractionHandler, InteractionHandlerTypes } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const pool = require('../../lib/database');

class SuggestModalHandler extends InteractionHandler {
    constructor(ctx, options) {
        super(ctx, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.ModalSubmit
        });
    }

    parse(interaction) {
        if (interaction.customId === 'suggestionModal') {
            return this.some();
        }
        return this.none();
    }

    async run(interaction) {
        
        // get channel suggest from the database limited to the first guild in the database
        const res = await pool.query('SELECT suggest_channel_id FROM monica_guilds LIMIT 1');
        if (res.rows.length === 0) {
            return interaction.reply({
                content: '❌ Aucune configuration de serveur trouvée. Veuillez contacter un administrateur.',
                ephemeral: true
            });
        }

        const suggestChannelId = res.rows[0].suggest_channel_id;
        const suggestChannel = interaction.guild.channels.cache.get(suggestChannelId);
        if (!suggestChannel) {
            return interaction.reply({
                content: '❌ Le salon de suggestions configuré est introuvable. Veuillez contacter un administrateur.',
                ephemeral: true
            });
        }
        const userId = interaction.user.id;
        const username = interaction.user.username;

        const title = interaction.fields.getTextInputValue('title_input');
        const suggestion = interaction.fields.getTextInputValue('suggestion_input');

        const embed = new EmbedBuilder()
            .setFooter({ text: `Suggestions de ${username}` })
            .setTitle(title)
            .setDescription(suggestion)
            .setColor('#5865F2')
            .setAuthor({ name: username, iconURL: interaction.user.displayAvatarURL() });

        try {
            await suggestChannel.send({ embeds: [embed] });

            await pool.query(
                `INSERT INTO monica_suggestions
                (user_id, username, title, suggestion)
                VALUES ($1,$2,$3,$4)
                ON CONFLICT DO NOTHING`,
                [userId, username, title, suggestion]
            );
            console.log(`✅ Suggestion enregistrée pour l'utilisateur ${username} (${userId}) : ${title} - ${suggestion}`);
            await interaction.reply({
                content: '✅ Merci pour ta suggestion !',
                ephemeral: true
            });

            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 10000);

        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de la suggestion :', error);
            return interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'envoi de ta suggestion.',
                ephemeral: true
            });
        }
    }
}

module.exports = {
    SuggestModalHandler
};