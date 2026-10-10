const { InteractionHandler, InteractionHandlerTypes } = require('@sapphire/framework');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const pool = require('../../lib/database');
const { createEntryButton } = require('../../lib/giveaway/giveawayService');

const DURATION_UNITS = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
};

function getEndDate(durationInput) {
    const match = durationInput.trim().match(/^(\d+(?:[.,]\d+)?)\s*(s|m|h|d|w)$/i);

    if (!match) {
        return null;
    }

    const amount = Number(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();

    if (!Number.isFinite(amount) || amount <= 0) {
        return null;
    }

    const endDate = new Date(Date.now() + amount * DURATION_UNITS[unit]);

    return Number.isNaN(endDate.getTime()) ? null : endDate;
}

class GiveModalHandler extends InteractionHandler {
    constructor(ctx, options) {
        super(ctx, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.ModalSubmit
        });
    }

    parse(interaction) {
        if (interaction.customId === 'giveawayModal') {
            return this.some();
        }
        return this.none();
    }

    async run(interaction) {
        
        // get a interaction channel
        const channel = interaction.channel;
        // get Interaction values
        const prize = interaction.fields.getTextInputValue('price_input');
        const description = interaction.fields.getTextInputValue('desc_input');
        const duration = interaction.fields.getTextInputValue('end_date_input');
        const imageUrl = interaction.fields.getTextInputValue('img_input');

        const winnerCount = interaction.fields.getTextInputValue('winner_input');
        const endDate = getEndDate(duration);
        const parsedWinnerCount = Number.parseInt(winnerCount, 10);

        if (!endDate || !Number.isInteger(parsedWinnerCount) || parsedWinnerCount < 1 || parsedWinnerCount > 100) {
            await interaction.reply({
                content: 'Durée ou nombre de gagnants invalide. Utilisez par exemple `30m` et un nombre de gagnants entre 1 et 100.',
                ephemeral: MessageFlags.Ephemeral
            });
            return;
        }

        const giveaway = await pool.query(
            `INSERT INTO monica_giveaways
             (guild_id, prize, description, end_date, image_url, winner_count, channel_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [interaction.guild.id, prize, description, endDate.toISOString(), imageUrl || null, parsedWinnerCount, channel.id]
        );
        const giveawayId = giveaway.rows[0].id;
        const embed = new EmbedBuilder()
            .setTitle(prize)
            .setDescription(description + `\n\n**Nombre de gagnants :** ${parsedWinnerCount}`)
            .setColor('#5865F2')
            .setFooter({ text: `Giveaway #${giveawayId} • Fin le ${endDate.toLocaleString('fr-FR')}` })
            .setTimestamp(endDate);

        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        // send the embed to the channel
        try {
            const giveawayMessage = await channel.send({ embeds: [embed], components: [createEntryButton(giveawayId)] });
            await pool.query(
                'UPDATE monica_giveaways SET message_id = $1 WHERE id = $2',
                [giveawayMessage.id, giveawayId]
            );
            await interaction.reply({ content: `✅ Giveaway #${giveawayId} créé avec succès !`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            await pool.query('DELETE FROM monica_giveaways WHERE id = $1', [giveawayId]);
            console.error('❌ Erreur lors de la création du giveaway:', error);
            await interaction.reply({
                content: '❌ Impossible de publier le giveaway.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

module.exports = {
    GiveModalHandler
};