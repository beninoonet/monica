// Getting a log channel for logging events in the Discord server in the database
const pool = require('./database');

async function getLogChannel(guildId) {
    try {
        const result = await pool.query('SELECT log_channel_id FROM monica_guilds WHERE guild_id = $1', [guildId]);

        if (result.rows.length === 0 || !result.rows[0].log_channel_id) {
            console.warn(`⚠️ Aucune entrée trouvée pour la guilde avec l'ID ${guildId} dans la base de données.`);
            return null;
        } else {
            return result.rows[0].log_channel_id;
        }
    }
    catch (error) {
        console.error(`❌ Erreur lors de la récupération du salon de log pour la guilde avec l'ID ${guildId}:`, error);
        return null;
    }
}

module.exports = { getLogChannel };