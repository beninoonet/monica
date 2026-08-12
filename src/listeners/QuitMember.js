const { Listener, Events } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

require("dotenv").config();
class JoinMemberListener extends Listener {
    constructor(context, options) {
        super(context, {    
            ...options,
            event: Events.GuildMemberRemove,
            once: false,
        });
    }

    async run(member) {
        const welcomeChannelId = process.env.WELCOME_CHANNEL;

        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        if (!welcomeChannel) {
            console.warn(`⚠️ La salon de bienvenue avec l'ID ${welcomeChannelId} n'existe pas dans la guilde ${member.guild.name} (${member.guild.id})`);
            return;
        }

        try {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`Au revoir, ${member.user.username} !`)
                .setDescription(`**${member.user.username}** a décidé de quitter le serveur. Nous espérons le revoir bientôt !`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await welcomeChannel.send({ embeds: [embed] });

        } catch (err) {
            console.error('❌ Erreur lors de la création du message de bienvenue :', err);
        }
    }

}

module.exports = { JoinMemberListener };