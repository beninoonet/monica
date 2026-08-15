const pool = require('./database');

async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS monica_guilds (
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
            CREATE TABLE IF NOT EXISTS monica_tasks (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                task TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                status TEXT DEFAULT 'pending',
                UNIQUE (id)
            );
            CREATE TABLE IF NOT EXISTS monica_suggestions (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                title TEXT NOT NULL,
                suggestion TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (id)
            );
            `
        );
        console.log('✅ Table "guilds" créée ou déjà existante.');
    }
    catch (error) {
        console.error('❌ Erreur lors de la création de la table "guilds":', error);
    }
}

module.exports = { initDatabase };