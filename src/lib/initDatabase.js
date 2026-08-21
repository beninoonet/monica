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
                suggest_channel_id TEXT,
                UNIQUE (guild_id)
            );
            CREATE TABLE IF NOT EXISTS monica_tasks (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NULL,
                task TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (id)
            );
            CREATE TABLE IF NOT EXISTS monica_suggestions (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NULL,
                title TEXT NOT NULL,
                suggestion TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (id)
            );
            CREATE TABLE IF NOT EXISTS monica_levels (
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                chat_xp INTEGER DEFAULT 0,
                chat_level INTEGER DEFAULT 0,
                voice_xp INTEGER DEFAULT 0,
                voice_level INTEGER DEFAULT 0,
                PRIMARY KEY (guild_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS monica_levels_settings (
                guild_id TEXT PRIMARY KEY,
                chat_xp_min INT DEFAULT 5,
                chat_xp_max INT DEFAULT 15,
                voice_xp_minute INT DEFAULT 10,
                vip_role_id TEXT DEFAULT NULL,  
                UNIQUE (guild_id)
            );
            CREATE TABLE IF NOT EXISTS monica_birthdays (
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                birthday_date DATE NOT NULL,
                PRIMARY KEY (guild_id, user_id)
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