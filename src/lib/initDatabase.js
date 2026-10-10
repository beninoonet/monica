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
            CREATE TABLE IF NOT EXISTS monica_honeypot_settings (
                guild_id TEXT PRIMARY KEY,
                honeypot_channel_id TEXT,
                UNIQUE (guild_id)
            );
            CREATE TABLE IF NOT EXISTS monica_honeypot_logs (
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                logs_channel_id TEXT NOT NULL,
                PRIMARY KEY (guild_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS monica_giveaways (
                id SERIAL PRIMARY KEY,
                guild_id TEXT NOT NULL,
                prize TEXT NOT NULL,
                description TEXT NOT NULL,
                end_date TIMESTAMP NOT NULL,
                image_url TEXT,
                winner_count INT NOT NULL,
                channel_id TEXT,
                message_id TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                ended_at TIMESTAMP,
                UNIQUE (id)
            );
            ALTER TABLE monica_giveaways
                ADD COLUMN IF NOT EXISTS channel_id TEXT,
                ADD COLUMN IF NOT EXISTS message_id TEXT,
                ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
                ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
            CREATE TABLE IF NOT EXISTS monica_giveaway_entries (
                giveaway_id INT NOT NULL REFERENCES monica_giveaways(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL,
                joined_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (giveaway_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS monica_twitch_channels (
                guild_id TEXT NOT NULL,
                twitch_login TEXT NOT NULL,
                twitch_user_id TEXT NOT NULL,
                twitch_display_name TEXT NOT NULL,
                announcement_channel_id TEXT NOT NULL,
                last_stream_id TEXT,
                scheduled_event_id TEXT,
                is_live BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (guild_id, twitch_login)
            );
            ALTER TABLE monica_twitch_channels
                ADD COLUMN IF NOT EXISTS scheduled_event_id TEXT;
        `
        );
        console.log('✅ Table "guilds" créée ou déjà existante.');
    }
    catch (error) {
        console.error('❌ Erreur lors de la création de la table "guilds":', error);
    }
}

module.exports = { initDatabase };