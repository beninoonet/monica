const pool = require('./database');

async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                member_count INT NOT NULL,
                joined_at TIMESTAMP NOT NULL,
                owner_id TEXT NOT NULL,
                welcome_channel_id TEXT,
                log_channel_id TEXT,
                report_channel_id TEXT,
                UNIQUE (guild_id)
            );
            `);
        console.log('✅ Table "guilds" créée ou déjà existante.');
    }
    catch (error) {
        console.error('❌ Erreur lors de la création de la table "guilds":', error);
    }
}

module.exports = { initDatabase };