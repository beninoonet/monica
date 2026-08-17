const { Listener } = require('@sapphire/framework');
const { Events, EmbedBuilder } = require('discord.js');
const { addXp, randomChatXp, CHAT_XP_COOLDOWN_MS } = require('../../lib/levels/leveling');
require('dotenv').config();

const cooldowns = new Map();

class ChatXpListener extends Listener {
    constructor(context, options) {
        super(context, { ...options, event: Events.MessageCreate });
    }

    async run(message) {
        if (message.author.bot || !message.guild) return;

        const key = `${message.guild.id}-${message.author.id}`;
        const lastGain = cooldowns.get(key) ?? 0;
        const now = Date.now();

        if (now - lastGain < CHAT_XP_COOLDOWN_MS) return;
        cooldowns.set(key, now);

        const amount = await randomChatXp(message.guild.id);
        const result = await addXp(message.guild.id, message.author.id, amount, 'chat');

        if (result.leveledUp) {
            await this.announceLevelUp(message, result.newLevel);
        }
    }

    async announceLevelUp(message, newLevel) {
        const channelId = process.env.levelup_channel_id;
        const channel = channelId
            ? message.guild.channels.cache.get(channelId)
            : message.channel;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setDescription(`🎉 ${message.author} vient de passer **niveau ${newLevel}** au chat !`);

        await channel.send({ embeds: [embed] });
    }
}

module.exports = { ChatXpListener };