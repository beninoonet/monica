const { Subcommand } = require('@sapphire/plugin-subcommands');
const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const pool = require('../../lib/database');
const TwitchClient = require('../../lib/twitch/twitchApi');

class TwitchCommand extends Subcommand {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'twitch',
            description: 'Gérer les annonces de lives Twitch',
            subcommands: [
                { name: 'add', chatInputRun: 'addRun' },
                { name: 'remove', chatInputRun: 'removeRun' },
                { name: 'list', chatInputRun: 'listRun' },
                { name: 'channel', chatInputRun: 'channelRun' }
            ]
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('twitch')
                .setDescription('Gérer les annonces de lives Twitch')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addSubcommand((subcommand) => subcommand
                    .setName('add')
                    .setDescription('Ajouter une chaîne Twitch à surveiller')
                    .addStringOption((option) => option
                        .setName('username')
                        .setDescription('Nom de la chaîne Twitch')
                        .setRequired(true))
                    .addChannelOption((option) => option
                        .setName('channel')
                        .setDescription('Salon où publier les annonces')
                        .setRequired(true)))
                .addSubcommand((subcommand) => subcommand
                    .setName('remove')
                    .setDescription('Retirer une chaîne Twitch')
                    .addStringOption((option) => option
                        .setName('username')
                        .setDescription('Nom de la chaîne Twitch')
                        .setRequired(true)))
                .addSubcommand((subcommand) => subcommand
                    .setName('list')
                    .setDescription('Afficher les chaînes Twitch'))
                .addSubcommand((subcommand) => subcommand
                    .setName('channel')
                    .setDescription('Modifier le salon des annonces Twitch')
                    .addChannelOption((option) => option
                        .setName('channel')
                        .setDescription('Salon où publier les annonces')
                        .setRequired(true)))
                .addSubcommand((subcommand) => subcommand
                    .setName('reset')
                    .setDescription('Réinitialiser la base de données des chaînes Twitch(⚠️ irréversible)'))
        );
    }

    async chatInputRun(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'add') return this.addRun(interaction);
        if (subcommand === 'remove') return this.removeRun(interaction);
        if (subcommand === 'list') return this.listRun(interaction);
        if (subcommand === 'channel') return this.channelRun(interaction);
        if (subcommand === 'reset') {
            if (!await this.requireAdmin(interaction)) return;
            await pool.query('DELETE FROM monica_twitch_channels WHERE guild_id = $1', [interaction.guildId]);
            return interaction.reply({
                content: '✅ La base de données des chaînes Twitch a été réinitialisée.',
                flags: MessageFlags.Ephemeral
            });
        }
        return this.channelRun(interaction);
    }

    async requireAdmin(interaction) {
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        await interaction.reply({
            content: '❌ Seuls les administrateurs du serveur peuvent gérer les chaînes Twitch.',
            flags: MessageFlags.Ephemeral
        });
        return false;
    }

    async addRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        const login = interaction.options.getString('username').trim().toLowerCase();
        const channel = interaction.options.getChannel('channel');
        if (!channel.isTextBased()) {
            return interaction.reply({
                content: '❌ Le salon sélectionné doit être un salon textuel.',
                flags: MessageFlags.Ephemeral
            });
        }
        let streamer;
        try {
            streamer = await new TwitchClient().getUserByName(login);
        } catch (error) {
            console.error(`❌ Erreur lors de la recherche de la chaîne Twitch ${login}:`, error);
            return interaction.reply({
                content: '❌ Impossible de contacter Twitch pour vérifier cette chaîne.',
                flags: MessageFlags.Ephemeral
            });
        }
        if (!streamer) {
            return interaction.reply({
                content: `❌ La chaîne Twitch \`${login}\` est introuvable.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await pool.query(
            `INSERT INTO monica_twitch_channels
             (guild_id, twitch_login, twitch_user_id, twitch_display_name, announcement_channel_id)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (guild_id, twitch_login)
             DO UPDATE SET twitch_user_id = EXCLUDED.twitch_user_id,
                           twitch_display_name = EXCLUDED.twitch_display_name,
                           announcement_channel_id = EXCLUDED.announcement_channel_id`,
            [interaction.guildId, streamer.login, streamer.id, streamer.display_name, channel.id]
        );
        return interaction.reply({
            content: `✅ **${streamer.display_name}** sera annoncé dans <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral
        });
    }

    async removeRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        const login = interaction.options.getString('username').trim().toLowerCase();
        const result = await pool.query(
            'DELETE FROM monica_twitch_channels WHERE guild_id = $1 AND twitch_login = $2',
            [interaction.guildId, login]
        );
        return interaction.reply({
            content: result.rowCount
                ? `✅ La chaîne \`${login}\` ne sera plus surveillée.`
                : `❌ La chaîne \`${login}\` n'était pas configurée.`,
            flags: MessageFlags.Ephemeral
        });
    }

    async listRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        const result = await pool.query(
            `SELECT twitch_display_name, twitch_login, announcement_channel_id
             FROM monica_twitch_channels WHERE guild_id = $1 ORDER BY twitch_login`,
            [interaction.guildId]
        );
        const description = result.rows.length
            ? result.rows.map((row) => `• **${row.twitch_display_name}** (\`${row.twitch_login}\`) → <#${row.announcement_channel_id}>`).join('\n')
            : 'Aucune chaîne Twitch configurée.';
        return interaction.reply({ content: description, flags: MessageFlags.Ephemeral });
    }

    async channelRun(interaction) {
        if (!await this.requireAdmin(interaction)) return;
        const channel = interaction.options.getChannel('channel');
        if (!channel.isTextBased()) {
            return interaction.reply({
                content: '❌ Le salon sélectionné doit être un salon textuel.',
                flags: MessageFlags.Ephemeral
            });
        }
        const result = await pool.query(
            'UPDATE monica_twitch_channels SET announcement_channel_id = $1 WHERE guild_id = $2',
            [channel.id, interaction.guildId]
        );
        return interaction.reply({
            content: result.rowCount
                ? `✅ Le salon des annonces a été défini sur <#${channel.id}> pour ${result.rowCount} chaîne(s).`
                : '❌ Aucune chaîne Twitch n’est configurée.',
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = { TwitchCommand };
