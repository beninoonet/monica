const { Subcommand } = require('@sapphire/plugin-subcommands');
const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const pool = require('../../lib/database');


class SetupCommand extends Subcommand {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'setup',
            description: 'Gérer les paramètres de configuration du bot',
            subcommands: [
                { name: 'reportchannel', chatInputRun: 'reportChannelRun' },
                { name: 'welcomechannel', chatInputRun: 'welcomeChannelRun' },
                { name: 'logchannel', chatInputRun: 'logChannelRun' },
                { name: 'suggestionchannel', chatInputRun: 'suggestionChannelRun' }
            ]
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('setup')
                .setDescription('Gérer les paramètres de configuration du bot')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addSubcommand((subcommand) => subcommand
                    .setName('reportchannel')
                    .setDescription('Définir le salon des reports')
                    .addChannelOption((option) => option
                        .setName('channel')
                        .setDescription('Salon où publier les reports')
                        .setRequired(true))
                )
                .addSubcommand((subcommand) => subcommand
                    .setName('welcomechannel')
                    .setDescription('Définir le salon de bienvenue')
                    .addChannelOption((option) => option
                        .setName('channel')
                        .setDescription('Salon où publier les messages de bienvenue')
                        .setRequired(true))
                )
                .addSubcommand((subcommand) => subcommand
                    .setName('logchannel')
                    .setDescription('Définir le salon des logs')
                    .addChannelOption((option) => option
                        .setName('channel')
                        .setDescription('Salon où publier les logs')
                        .setRequired(true))
                )
                .addSubcommand((subcommand) => subcommand
                    .setName('suggestionchannel')
                    .setDescription('Définir le salon des suggestions')
                    .addChannelOption((option) => option
                        .setName('channel')
                        .setDescription('Salon où publier les suggestions')
                        .setRequired(true))
                )
        );
    }

    async chatInputRun(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'reportchannel') return this.reportChannelRun(interaction);
        if (subcommand === 'welcomechannel') return this.welcomeChannelRun(interaction);
        if (subcommand === 'logchannel') return this.logChannelRun(interaction);
        if (subcommand === 'suggestionchannel') return this.suggestionChannelRun(interaction);
    }

    async requireAdmin(interaction) {
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        await interaction.reply({
            content: '❌ Seuls les administrateurs du serveur peuvent modifier la configuration.',
            flags: MessageFlags.Ephemeral
        });
        return false;
    }

    async setChannel(interaction, column) {
        const channel = interaction.options.getChannel('channel');
        if (!channel.isTextBased()) {
            return interaction.reply({
                content: '❌ Le salon sélectionné doit être un salon textuel.',
                flags: MessageFlags.Ephemeral
            });
        }

        const guild = interaction.guild;
        await pool.query(
            `INSERT INTO monica_guilds
                (guild_id, name, member_count, joined_at, owner_id, ${column})
             VALUES ($1, $2, $3, NOW(), $4, $5)
             ON CONFLICT (guild_id) DO UPDATE SET ${column} = EXCLUDED.${column}`,
            [guild.id, guild.name, guild.memberCount, guild.ownerId, channel.id]
        );

        return interaction.reply({
            content: `✅ Le salon a été défini sur ${channel}.`,
            flags: MessageFlags.Ephemeral
        });
    }

    async reportChannelRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        return this.setChannel(interaction, 'report_channel_id');
    }

    async welcomeChannelRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        return this.setChannel(interaction, 'welcome_channel_id');
    }

    async logChannelRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        return this.setChannel(interaction, 'log_channel_id');
    }

    async suggestionChannelRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        return this.setChannel(interaction, 'suggest_channel_id');
    }
}

module.exports = { SetupCommand };
