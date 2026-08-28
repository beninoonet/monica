const { Listener, Events } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
require("dotenv").config();

// get the log channel from DB
const { getLogChannel } = require('../../lib/logging/logConfig');

class LogChannelCreateListener extends Listener {
    constructor(context, options) {
        super(context, {    
            ...options,
            event: Events.ChannelCreate,
            once: false,
        });
    }

    async run(channel) {
        // Get the log channel ID from the database
        const logChannelId = await getLogChannel(channel.guild.id);

        // If no log channel is set, return
        if (!logChannelId) return;

        // Get the log channel from the guild
        const logChannel = channel.guild.channels.cache.get(logChannelId);

        // If the log channel doesn't exist, return
        if (!logChannel) return;

        // Create an embed for the log message
        const embed = new EmbedBuilder()
            .setColor('#3494e3')
            .setTitle('✅ Salon créé : ' + channel.name)
            .setAuthor({ name: channel.guild.name, iconURL: channel.guild.iconURL() })
            .setDescription(`Un nouveau salon a été créé: ${channel.name}`)
            .setThumbnail(channel.guild.iconURL())
            .addFields(
                { name: 'Type de salon', value: channel.type === 0 ? 'Texte' : 'Autre', inline: true },
                { name: 'ID du salon', value: channel.id, inline: true },
                { name: 'ID de la guilde', value: channel.guild.id, inline: true }
            )
            .setTimestamp();
        
        // Send the embed to the log channel
        logChannel.send({ embeds: [embed] });

    }

}

module.exports = { LogChannelCreateListener };