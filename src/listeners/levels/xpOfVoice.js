const { Listener } = require('@sapphire/framework');
const { Events, EmbedBuilder } = require('discord.js');
const { addXp, getXpThresholds } = require('../../lib/levels/leveling');
require('dotenv').config();

const voiceSessions = new Map();
const VOICE_XP_INTERVAL_MS = 60_000;

class VoiceXpListener extends Listener {
    constructor(context, options) {
        super(context, { ...options, event: Events.VoiceStateUpdate });
        this.xpInterval = setInterval(() => this.processSessions(), VOICE_XP_INTERVAL_MS);
    }

    async run(oldState, newState) {
        const guildId = newState.guild.id;
        const userId = newState.id;
        const key = `${guildId}-${userId}`;
        const afkChannelId = newState.guild.afkChannelId;

        if (newState.member?.user.bot) return;

        const wasInVoice = !!oldState.channelId;
        const isInVoice = !!newState.channelId;
        // Entrée en vocal
        if (!wasInVoice && isInVoice) {
            if (newState.channelId !== afkChannelId) {
                voiceSessions.set(key, { startedAt: Date.now(), state: newState });
            }
            return;
        }

        // Sortie complète du vocal
        if (wasInVoice && !isInVoice) {
            await this.endSession(key, guildId, userId, newState);
            return;
        }

        // Changement de salon vocal (y compris vers/depuis l'AFK)
        if (wasInVoice && isInVoice && oldState.channelId !== newState.channelId) {
            if (newState.channelId === afkChannelId) {
                await this.endSession(key, guildId, userId, newState);
            } else if (oldState.channelId === afkChannelId) {
                voiceSessions.set(key, { startedAt: Date.now(), state: newState });
            } else {
                const session = voiceSessions.get(key);
                if (session) session.state = newState;
            }
            // sinon : changement de salon normal, le timer continue
        }
    }

    async endSession(key, guildId, userId, state) {
        const session = voiceSessions.get(key);
        voiceSessions.delete(key);
        if (!session) return;

        await this.grantXp(guildId, userId, session, state);
    }

    async processSessions() {
        const now = Date.now();

        for (const [key, session] of voiceSessions) {
            const [guildId, userId] = key.split('-');
            const minutes = Math.floor((now - session.startedAt) / VOICE_XP_INTERVAL_MS);
            if (minutes < 1) continue;

            session.startedAt += minutes * VOICE_XP_INTERVAL_MS;
            await this.grantXp(guildId, userId, session, session.state, minutes);
        }
    }

    async grantXp(guildId, userId, session, state, elapsedMinutes = null) {
        const minutes = elapsedMinutes ?? Math.floor((Date.now() - session.startedAt) / VOICE_XP_INTERVAL_MS);

        const { voiceXpPerMinute } = await getXpThresholds(guildId);
        if (minutes < 1) return;

        const amount = minutes * voiceXpPerMinute;
        const result = await addXp(guildId, userId, amount, 'voice');

        if (result.leveledUp) {
            await this.announceLevelUp(state, userId, result.newLevel);
        }
    }

    async announceLevelUp(state, userId, newLevel) {
        const channelId = process.env.levelup_channel_id;
        const channel = channelId ? state.guild.channels.cache.get(channelId) : null;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('Aqua')
            .setDescription(`🎙️ <@${userId}> vient de passer **niveau ${newLevel}** en vocal !`);

        await channel.send({ embeds: [embed] });


    }


}

module.exports = { VoiceXpListener };