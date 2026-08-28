const { Listener, Events } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
require("dotenv").config();

// get the log channel from DB
const { getLogChannel } = require('../../lib/logging/getLogChannel');

class LogChannelRemoveListener extends Listener {
    constructor(context, options) {
        super(context, {    
            ...options,
            event: Events.ChannelDelete,
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
            .setColor('#e33434')
            .setTitle('❌ Salon Supprimé : ' + channel.name)
            .setAuthor({ name: channel.guild.name, iconURL: channel.guild.iconURL() })
            .setDescription(`Un salon a été supprimé: ${channel.name}`)
            .setThumbnail(channel.guild.iconURL())
            .addFields(
                { name: 'Type de salon', value: channel.type === 0 ? 'Texte' : 'Autre', inline: true },
                { name: 'ID du salon', value: channel.id, inline: false },
                { name: 'ID de la guilde', value: channel.guild.id, inline: false }
            )
            .setTimestamp();
        
        // Send the embed to the log channel
        logChannel.send({ embeds: [embed] });

    }

}

module.exports = { LogChannelRemoveListener };