const { Subcommand } = require('@sapphire/plugin-subcommands');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addXp, removeXp, resetXp } = require('../../lib/levels/leveling');

class XpControlCommand extends Subcommand {
  constructor(context, options) {
    super(context, {
        ...options,
        name: 'controlxp',
        description: 'Commandes de contrôle de l\'XP',
        subcommands: [
            {
                name: 'give',
                chatInputRun: 'giveRun',
            },
            {
                name: 'remove',
                chatInputRun: 'removeRun',
            },
            {
                name: 'reset',
                chatInputRun: 'resetRun',
            }
        ]
    });
  }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => {
            builder
                .setName('xp')
                .setDescription('Commandes de contrôle de l\'XP')
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
                .addSubcommand((sub) =>
                    sub.setName('give')
                        .setDescription('Donne de l\'XP à un utilisateur')
                        .addUserOption((opt) =>
                            opt.setName('user')
                                .setDescription('Utilisateur à qui donner de l\'XP')
                                .setRequired(true)
                        )
                        .addStringOption((opt) =>
                            opt.setName('type')
                                .setDescription('Type d\'XP à donner')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Chat', value: 'chat' },
                                    { name: 'Vocal', value: 'voice' }
                                )
                        )
                        .addIntegerOption((opt) =>
                            opt.setName('amount')
                                .setDescription('Quantité d\'XP à donner')
                                .setRequired(true)
                                .setMinValue(1)
                        ))
                    .addSubcommand((sub) =>
                        sub.setName('remove')
                            .setDescription('Retire de l\'XP à un utilisateur')
                            .addUserOption((opt) =>
                                opt.setName('user')
                                    .setDescription('Utilisateur à qui retirer de l\'XP')
                                    .setRequired(true)
                            )
                            .addStringOption((opt) =>
                                opt.setName('type')
                                    .setDescription('Type d\'XP à retirer')
                                    .setRequired(true)
                                    .addChoices(
                                        { name: 'Chat', value: 'chat' },
                                        { name: 'Vocal', value: 'voice' }
                                    )
                            )
                            .addIntegerOption((opt) =>
                                opt.setName('amount')
                                    .setDescription('Quantité d\'XP à retirer')
                                    .setRequired(true)
                                    .setMinValue(1)
                            ))

                    .addSubcommand((sub) =>
                        sub.setName('reset')
                            .setDescription('Réinitialise l\'XP d\'un utilisateur')
                            .addUserOption((opt) =>
                                opt.setName('user')
                                    .setDescription('Utilisateur à qui réinitialiser l\'XP')
                                    .setRequired(true)
                            )
                            .addStringOption((opt) =>
                                opt.setName('type')
                                    .setDescription('Type d\'XP à réinitialiser')
                                    .setRequired(true)
                                    .addChoices(
                                        { name: 'Chat', value: 'chat' },
                                        { name: 'Vocal', value: 'voice' },
                                        { name: 'Les deux', value: 'both' }
                                    )
                            ))

                    
        }
        );
    }

    async giveRun(interaction) {
        try {
        const user = interaction.options.getUser('user', true);
        const type = interaction.options.getString('type', true);
        const amount = interaction.options.getInteger('amount', true);

        const result = await addXp(interaction.guild.id, user.id, amount, type);
        const typeLabel = type === 'chat' ? 'Chat' : 'Vocal';

        const embed = new EmbedBuilder()
            .setTitle(`XP donnée à ${user.tag}`)
             .setDescription(
                `✅ **+${amount} XP ${typeLabel}** ajoutés à ${user}.\n` +
                `Niveau actuel : **${result.newLevel}** (${result.totalXp} XP)`
            )
            .setColor('Green')
            .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Erreur lors de l\'ajout de l\'XP :', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'ajout de l\'XP. Veuillez réessayer.',
                ephemeral: true,
            });
        }
       
    }

    async removeRun(interaction) {
        try {
            const user = interaction.options.getUser('user', true);
        const type = interaction.options.getString('type', true);
        const amount = interaction.options.getInteger('amount', true);

        const result = await removeXp(interaction.guild.id, user.id, type, amount);
        const typeLabel = type === 'chat' ? 'Chat' : 'Vocal';

        const embed = new EmbedBuilder()
            .setTitle(`XP retirée à ${user.tag}`)
             .setDescription(
                `➖ **-${amount} XP ${typeLabel}** retirés à ${user}.\n` +
                `Niveau actuel : **${result.level}** (${result.xp} XP)`)
            .setColor('Red')
            .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'XP :', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la suppression de l\'XP. Veuillez réessayer.',
                ephemeral: true,
            });
        }
    }

    async resetRun(interaction) {
        try{
            const user = interaction.options.getUser('user', true);
        const type = interaction.options.getString('type', true);

        const result = await resetXp(interaction.guild.id, user.id, type);
        const typeLabel = {chat: 'Chat', voice: 'Vocal', both: 'Chat et Vocal'}[type];

        const embed = new EmbedBuilder()
            .setTitle(`XP réinitialisée pour ${user.tag}`)
            .setDescription(
                `➖ **Niveau réinitialisé de ${user}.\n` +
                `Niveau actuel : **0** (0 XP)
                ${typeLabel} réinitialisé.`
            )
            .setColor('Orange')
            .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la réinitialisation de l\'XP :', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la réinitialisation de l\'XP. Veuillez réessayer.',
                ephemeral: true,
            });
        
        }
  /* END OF CODE */
    }
}

module.exports = { XpControlCommand };