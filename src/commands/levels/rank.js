const { Command } = require('@sapphire/framework');
const { AttachmentBuilder } = require('discord.js');
const { getProfile, getRank } = require('../../lib/levels/leveling');
const { generateRankCard } = require('../../lib/levels/rankCard');

class RankCommand extends Command {
    constructor(context, options) {
        super(context, { ...options });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('rank')
                .setDescription('Affiche ta carte de niveau (chat + vocal)')
                .addUserOption((opt) =>
                    opt
                        .setName('membre')
                        .setDescription("Voir le niveau d'un autre membre")
                        .setRequired(false)
                )
        );
    }

    async chatInputRun(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('membre') ?? interaction.user;
        const profile = await getProfile(interaction.guild.id, target.id);

        const [chatRank, voiceRank] = await Promise.all([
            getRank(interaction.guild.id, target.id, 'chat'),
            getRank(interaction.guild.id, target.id, 'voice')
        ]);

        const buffer = await generateRankCard({
            username: target.username,
            avatarUrl: target.displayAvatarURL({ extension: 'png', size: 256 }),
            chat: { level: profile.chat_level, xp: profile.chat_xp },
            voice: { level: profile.voice_level, xp: profile.voice_xp },
            chatRank,
            voiceRank,
        });

        const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
        await interaction.editReply({ files: [attachment] });
    }
}

module.exports = { RankCommand };