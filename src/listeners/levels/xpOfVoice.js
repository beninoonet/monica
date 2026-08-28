const { Listener } = require('@sapphire/framework');
const { Events, EmbedBuilder } = require('discord.js');
const { addXp, getXpThresholds } = require('../../lib/levels/leveling');
require('dotenv').config();

const voiceSessions = new Map();

class VoiceXpListener extends Listener {
    constructor(context, options) {
        super(context, { ...options, event: Events.VoiceStateUpdate });
    }

    async run(oldState, newState) {
        const guildId = newState.guild.id;
        const userId = newState.id;
        const key = `${guildId}-${userId}`;
        const afkChannelId = newState.guild.afkChannelId;

        const wasInVoice = !!oldState.channelId;
        const isInVoice = !!newState.channelId;
        console.log(`Voice state update for user ${userId} in guild ${guildId}: wasInVoice=${wasInVoice}, isInVoice=${isInVoice}`);
        // Entrée en vocal
        if (!wasInVoice && isInVoice) {
            if (newState.channelId !== afkChannelId) {
                voiceSessions.set(key, Date.now());
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
                voiceSessions.set(key, Date.now());
            }
            // sinon : changement de salon normal, le timer continue
        }
    }

    async endSession(key, guildId, userId, state) {
        const startedAt = voiceSessions.get(key);
        voiceSessions.delete(key);
        if (!startedAt) return;

        const { voiceXpPerMinute } = await getXpThresholds(guildId);
        if (minutes < 1) return; // évite de donner 0 XP pour rien

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