const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../lib/levels/leveling');

class LeaderboardCommand extends Command {
    constructor(context, options) {
        super(context, { ...options });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('leaderboard')
                .setDescription('Affiche le classement des niveaux')
                .addStringOption((opt) =>
                    opt
                        .setName('type')
                        .setDescription('Classement chat ou vocal')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Chat', value: 'chat' },
                            { name: 'Vocal', value: 'voice' }
                        )
                )
        );
    }

    async chatInputRun(interaction) {
        const type = interaction.options.getString('type', true);
        const rows = await getLeaderboard(interaction.guild.id, type, 10);

        if (rows.length === 0) {
            return interaction.reply({
                content: 'Aucune donnée pour ce classement pour le moment.',
                ephemeral: true,
            });
        }

        const lines = rows.map((row, index) => {
            const medal = ['🥇', '🥈', '🥉'][index] ?? `**${index + 1}.**`;
            return `${medal} <@${row.user_id}> — Niveau **${row.level}** (${row.xp} XP)`;
        });

        const embed = new EmbedBuilder()
            .setTitle(type === 'chat' ? '🏆 Classement Chat' : '🏆 Classement Vocal')
            .setDescription(lines.join('\n'))
            .setColor(type === 'chat' ? 'Gold' : 'Aqua');

        await interaction.reply({ embeds: [embed] });
    }
}

module.exports = { LeaderboardCommand };