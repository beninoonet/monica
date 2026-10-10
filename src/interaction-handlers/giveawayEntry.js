const { InteractionHandler, InteractionHandlerTypes } = require('@sapphire/framework');
const { MessageFlags } = require('discord.js');
const pool = require('../lib/database');
const { GIVEAWAY_BUTTON_PREFIX } = require('../lib/giveaway/giveawayService');

class GiveawayEntryHandler extends InteractionHandler {
    constructor(ctx, options) {
        super(ctx, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button
        });
    }

    parse(interaction) {
        if (!interaction.customId.startsWith(GIVEAWAY_BUTTON_PREFIX)) {
            return this.none();
        }
        return this.some({ giveawayId: interaction.customId.slice(GIVEAWAY_BUTTON_PREFIX.length) });
    }

    async run(interaction, { giveawayId }) {
        if (!/^\d+$/.test(giveawayId)) {
            return interaction.reply({ content: '❌ Giveaway invalide.', flags: MessageFlags.Ephemeral });
        }

        const giveaway = await pool.query(
            `SELECT id FROM monica_giveaways
             WHERE id = $1 AND guild_id = $2 AND status = 'active' AND end_date > NOW()`,
            [giveawayId, interaction.guildId]
        );
        if (giveaway.rowCount === 0) {
            return interaction.reply({
                content: '❌ Ce giveaway est terminé ou introuvable.',
                flags: MessageFlags.Ephemeral
            });
        }

        const result = await pool.query(
            `INSERT INTO monica_giveaway_entries (giveaway_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (giveaway_id, user_id) DO NOTHING`,
            [giveawayId, interaction.user.id]
        );
        await interaction.reply({
            content: result.rowCount
                ? '✅ Ta participation est enregistrée !'
                : 'ℹ️ Tu participes déjà à ce giveaway.',
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = { GiveawayEntryHandler };
