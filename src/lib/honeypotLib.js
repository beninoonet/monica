// Lib for honeypot event listener
const pool = require('./database');

function isHoneypotChannel(guildId, channelId) {
    return new Promise((resolve, reject) => {
        pool.query(
            'SELECT honeypot_channel_id FROM monica_honeypot_settings WHERE guild_id = $1',
            [guildId],
            (err, res) => {
                if (err) {
                    reject(err);
                    console.error('❌ Erreur lors de la vérification du salon pot de miel :', err);
                } else {
                    const honeypotChannelId = res.rows[0]?.honeypot_channel_id;
                    resolve(honeypotChannelId === channelId);
                } 
            }
        );
    });
}

module.exports = { isHoneypotChannel};