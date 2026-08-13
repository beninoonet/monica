const { Listener, Events } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

require("dotenv").config();

// DB
const pool = require('../../lib/database');

class JoinMemberListener extends Listener {
    constructor(context, options) {
        super(context, {    
            ...options,
            event: Events.GuildMemberRemove,
            once: false,
        });
    }

    async run(member) {
        // Update Member Count in the database
        pool.query(
            `UPDATE monica_guilds SET member_count = $1 WHERE guild_id = $2`,
            [member.guild.memberCount, member.guild.id]
        )
        .then(() => {
            console.log(`✅ Membre retiré de la base de données pour la guilde ${member.guild.name} (${member.guild.id})`);
        })
        .catch((err) => {
            console.error(`❌ Erreur lors de la suppression du membre de la base de données pour la guilde ${member.guild.name} (${member.guild.id}):`, err);
        });

        // get the welcome channel from DB
        const result = await pool.query(
            `SELECT welcome_channel_id FROM monica_guilds WHERE guild_id = $1`,
            [member.guild.id]
        );
        if (result.rows.length === 0 || !result.rows[0].welcome_channel_id) {
            console.warn(`⚠️ Aucune entrée trouvée pour la guilde ${member.guild.name} (${member.guild.id}) dans la base de données.`);
            return;
        }

        const welcomeChannelId = result.rows[0]?.welcome_channel_id

        // env variable for save dev
        // const welcomeChannelId = process.env.WELCOME_CHANNEL;

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