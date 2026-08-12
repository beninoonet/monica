const { Listener, Events } = require('@sapphire/framework');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');

require("dotenv").config();

// DB 
const pool = require('../../lib/database');

class guildMemberAddListener extends Listener {
    constructor(context, options) {
        super(context, {    
            ...options,
            event: Events.GuildMemberAdd,
            once: false,
        });
    }

    async run(member) {

        // Update Member Count in the database
        pool.query(
            `UPDATE guilds SET member_count = $1 WHERE guild_id = $2`,
            [member.guild.memberCount, member.guild.id]
        )
        .then(() => {
            console.log(`✅ Membre ajouté à la base de données pour la guilde ${member.guild.name} (${member.guild.id})`);
        })
        .catch((err) => {
            console.error(`❌ Erreur lors de l'ajout du membre à la base de données pour la guilde ${member.guild.name} (${member.guild.id}):`, err);
        });

        // get the welcome channel from DB
        const result = await pool.query(
            `SELECT welcome_channel_id FROM guilds WHERE guild_id = $1`,
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
             // Generate a canvas
              const canvas = createCanvas(700, 250);
              const ctx = canvas.getContext('2d');
      
              // Load a img background
              const background = await loadImage("https://i.postimg.cc/W1L8WwmR/moniicaa.jpg");
              ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

              // black transparent rectangle
              ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              ctx.save(); // Save the current state before clipping

              // Border of avatar
              ctx.beginPath();
              ctx.arc(125, 125, 75, 0, Math.PI * 2);
              ctx.lineWidth = 6;
              ctx.stroke();
              ctx.clip(); // around avatar
      
              // Load avatar
              const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 }) ?? member.user.defaultAvatarURL;
              const avatar = await loadImage(avatarURL);
              ctx.drawImage(avatar, 50, 50, 150, 150);
      
              // Reset clipping to draw text
              ctx.restore();
    
            // Text
            ctx.font = 'bold 42px Montserrat';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`Bienvenue !`, 240, 100);

             ctx.font = 'semi-bold 36px Montserrat';
            ctx.fillStyle = '#9363c4';
            ctx.fillText('@' + member.user.username, 240, 145);

            ctx.font = '26px Montserrat';
            ctx.fillStyle = '#b9acff';
            ctx.fillText(`Membre #${member.guild.memberCount}`, 240, 185);
            // Create attachment and send
            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome.png' });

            welcomeChannel.send({
                content: `Bienvenue ${member} sur ${member.guild.name}  !`,
                files: [attachment] 
            }).catch(() => {
                console.warn(`⚠️ Impossible d'envoyer un message de bienvenue dans la guilde ${member.guild.name} (${member.guild.id})`);
            });
        } catch (err) {
            console.error('❌ Erreur lors de la création du message de bienvenue :', err);
        }
    }

}

module.exports = { guildMemberAddListener };