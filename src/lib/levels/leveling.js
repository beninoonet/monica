// Leveling system for Monica 
const pool = require('../database');

// Adjust the XP and levels based

CHAT_XP_COOLDOWN_MS = 60_000; // 1 minute cooldown for chat XP
const DEFAULT_CHAT_XP_MIN = 5;
const DEFAULT_CHAT_XP_MAX = 15;
const DEFAULT_VOICE_XP_PER_MINUTE = 10;

const VIP_CHAT_XP_MIN = 10;
const VIP_CHAT_XP_MAX = 20;
const VIP_VOICE_XP_PER_MINUTE = 15;

const VOICE_XP_PER_MINUTE = DEFAULT_VOICE_XP_PER_MINUTE;


const getLevelingSettings = async (guildId) => {
    const { rows } = await pool.query(
        'SELECT * FROM monica_levels_settings WHERE guild_id = $1',
        [guildId]
    );
    if (rows.length > 0) return rows[0];
}

async function getXpThresholds(guildId) {
    const settings = await getLevelingSettings(guildId);
    const isVip = !!settings?.vip_role_id; // Check if VIP role is set

    if (isVip) {
        return {
            chatXpMin: settings.chat_xp_min ?? VIP_CHAT_XP_MIN,
            chatXpMax: settings.chat_xp_max ?? VIP_CHAT_XP_MAX,
            voiceXpPerMinute: settings.voice_xp_minute ?? VIP_VOICE_XP_PER_MINUTE,
        };
    }

    return {
        chatXpMin: settings?.chat_xp_min ?? DEFAULT_CHAT_XP_MIN,
        chatXpMax: settings?.chat_xp_max ?? DEFAULT_CHAT_XP_MAX,
        voiceXpPerMinute: settings?.voice_xp_minute ?? DEFAULT_VOICE_XP_PER_MINUTE,
    };
}


function xpForLevel(level) {
    return 5 * (level ** 2) + 50 * level + 150;
}

function calculateLevel(totalXp) {
    let level = 0;
    while (totalXp >= xpForLevel(level + 1)) {
        level++;
    }
    return level;
}

async function randomChatXp(guildId) {
    const { chatXpMin, chatXpMax } = await getXpThresholds();
    return Math.floor(Math.random() * (chatXpMax - chatXpMin + 1)) + chatXpMin;
}

// Create or get a profile for a user in a guild
async function getProfile(guildId, userId) {
    const { rows } = await pool.query(
        'SELECT * FROM monica_levels WHERE guild_id = $1 AND user_id = $2',
        [guildId, userId]
    );
    if (rows.length > 0) return rows[0];

    const { rows: insertedRows } = await pool.query(
        'INSERT INTO monica_levels (guild_id, user_id) VALUES ($1, $2) RETURNING *',
        [guildId, userId]
    );

    return insertedRows[0];
}

async function setXp(guildId, userId, type, newXp) {
    const xpColumn = type === 'chat' ? 'chat_xp' : 'voice_xp';
    const levelColumn = type === 'chat' ? 'chat_level' : 'voice_level';
    const profile = await getProfile(guildId, userId);
    const newLevel = calculateLevel(newXp);

    await pool.query(
        `UPDATE monica_levels SET ${xpColumn} = $1, ${levelColumn} = $2 WHERE guild_id = $3 AND user_id = $4`,
        [newXp, newLevel, guildId, userId]
    );

    return {
        level: newLevel,
        xp: newXp,
    };
}

async function addXp(guildId, userId, amount, type) {
    const xpColumn = type === 'chat' ? 'chat_xp' : 'voice_xp';
    const levelColumn = type === 'chat' ? 'chat_level' : 'voice_level';

    const profile = await getProfile(guildId, userId);
    const newXp = profile[xpColumn] + amount;
    const oldLevel = profile[levelColumn];
    const newLevel = calculateLevel(newXp);

    await pool.query(
        `UPDATE monica_levels SET ${xpColumn} = $1, ${levelColumn} = $2 WHERE guild_id = $3 AND user_id = $4`,
        [newXp, newLevel, guildId, userId]
    );

    return {
        leveledUp: newLevel > oldLevel,
        oldLevel,
        newLevel,
        totalXp: newXp,
    };
}

async function removeXp(guildId, userId, type, amount) {
    const xpColumn = type === 'chat' ? 'chat_xp' : 'voice_xp';
    const profile = await getProfile(guildId, userId);
    const newXp = Math.max(0, profile[xpColumn] - amount);
    return setXp(guildId, userId, type, newXp);
}
 
async function resetXp(guildId, userId, type) {
    await getProfile(guildId, userId);
 
    if (type === 'both') {
        await pool.query(
            `UPDATE monica_levels SET chat_xp = 0, chat_level = 0, voice_xp = 0, voice_level = 0
             WHERE guild_id = $1 AND user_id = $2`,
            [guildId, userId]
        );
        return;
    }
 
    const xpColumn = type === 'chat' ? 'chat_xp' : 'voice_xp';
    const levelColumn = type === 'chat' ? 'chat_level' : 'voice_level';
    await pool.query(
        `UPDATE monica_levels SET ${xpColumn} = 0, ${levelColumn} = 0 WHERE guild_id = $1 AND user_id = $2`,
        [guildId, userId]
    );
}

async function getRank(guildId, userId, type) {
    const xpColumn = type === 'chat' ? 'chat_xp' : 'voice_xp';

    const { rows } = await pool.query(
        `SELECT COUNT(*) + 1 AS rank
         FROM monica_levels
         WHERE guild_id = $1
           AND ${xpColumn} > (
               SELECT ${xpColumn} FROM monica_levels WHERE guild_id = $1 AND user_id = $2
           )`,
        [guildId, userId]
    );
    return parseInt(rows[0].rank, 10);
}

async function getLeaderboard(guildId, type, limit = 10) {
    const xpColumn = type === 'chat' ? 'chat_xp' : 'voice_xp';
    const levelColumn = type === 'chat' ? 'chat_level' : 'voice_level';

    const { rows } = await pool.query(
        `SELECT user_id, ${xpColumn} AS xp, ${levelColumn} AS level
         FROM monica_levels
         WHERE guild_id = $1
         ORDER BY ${xpColumn} DESC
         LIMIT $2`,
        [guildId, limit]
    );
    return rows;
}

module.exports = {
    getLevelingSettings,
    getProfile,
    addXp,
    removeXp,
    resetXp,
    getRank,
    getLeaderboard,
    xpForLevel,
    calculateLevel,
    randomChatXp,
    VOICE_XP_PER_MINUTE,
    CHAT_XP_COOLDOWN_MS,
    getXpThresholds,
};