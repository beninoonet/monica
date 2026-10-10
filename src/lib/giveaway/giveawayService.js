const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const pool = require('../database');

const GIVEAWAY_BUTTON_PREFIX = 'giveaway:enter:';

function createEntryButton(giveawayId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`${GIVEAWAY_BUTTON_PREFIX}${giveawayId}`)
            .setLabel('Participer')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Primary)
    );
}

function pickWinners(entries, winnerCount) {
    const shuffled = [...entries];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled.slice(0, winnerCount);
}

async function endGiveaway(giveaway, client) {
    const entriesResult = await pool.query(
        'SELECT user_id FROM monica_giveaway_entries WHERE giveaway_id = $1',
        [giveaway.id]
    );
    const winners = pickWinners(entriesResult.rows.map((entry) => entry.user_id), giveaway.winner_count);
    const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
    const message = channel ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;

    if (message) {
        const winnerText = winners.length
            ? winners.map((userId) => `<@${userId}>`).join(', ')
            : 'Aucun participant';
        const embed = EmbedBuilder.from(message.embeds[0] || {})
            .setColor(winners.length ? '#57F287' : '#ED4245')
            .addFields({ name: 'Résultat', value: winnerText });
        await message.edit({ embeds: [embed], components: [] });
    }

    await pool.query(
        `UPDATE monica_giveaways
         SET status = 'ended', ended_at = NOW()
         WHERE id = $1 AND status = 'processing'`,
        [giveaway.id]
    );
}

async function finishExpiredGiveaways(client) {
    const expired = await pool.query(
        `UPDATE monica_giveaways
         SET status = 'processing'
         WHERE status = 'active' AND end_date <= NOW()
         RETURNING id, channel_id, message_id, winner_count`
    );

    for (const giveaway of expired.rows) {
        try {
            await endGiveaway(giveaway, client);
        } catch (error) {
            console.error(`❌ Erreur lors de la clôture du giveaway ${giveaway.id}:`, error);
            await pool.query(
                `UPDATE monica_giveaways SET status = 'active' WHERE id = $1 AND status = 'processing'`,
                [giveaway.id]
            );
        }
    }
}

function startGiveawayScheduler(client) {
    const run = () => finishExpiredGiveaways(client).catch((error) => {
        console.error('❌ Erreur lors de la vérification des giveaways:', error);
    });
    run();
    return setInterval(run, 15 * 1000);
}

module.exports = {
    GIVEAWAY_BUTTON_PREFIX,
    createEntryButton,
    startGiveawayScheduler
};
