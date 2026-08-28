// Getting a log channel for logging events in the Discord server in the database
const pool = require('../database');

const logSystem = true; // Set to true to enable logging system, false to disable

async function getLogChannel(guildId) {
    try {
        if (logSystem === false) {
            console.warn('⚠️ Le système de log est désactivé. Aucune récupération du salon de log ne sera effectuée.');
            return null;
        }

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


async function setLogChannel(guildId, logChannelId) {
    try {

        if (logSystem === false) {
            console.warn('⚠️ Le système de log est désactivé. Aucune mise à jour du salon de log ne sera effectuée.');
            return;
        }

        await pool.query(
            'UPDATE monica_guilds SET log_channel_id = $1 WHERE guild_id = $2',
            [logChannelId, guildId]
        );
        console.log(`✅ Salon de log mis à jour pour la guilde avec l'ID ${guildId} vers le salon avec l'ID ${logChannelId}.`);
    }
    catch (error) {
        console.error(`❌ Erreur lors de la mise à jour du salon de log pour la guilde avec l'ID ${guildId}:`, error);
    }
}




module.exports = { getLogChannel, setLogChannel, logSystem };