const { Subcommand } = require('@sapphire/plugin-subcommands');
const { EmbedBuilder, MessageFlags } = require('discord.js');

const pool = require('../../lib/database');

class TasksCommand extends Subcommand {
  constructor(context, options) {
    super(context, {
        ...options,
        name: 'tasks',
        description: 'Commande de gestion des tâches',
        subcommands: [
            {
                name: 'create',
                chatInputRun: 'createRun',
            },
            {
                name: 'remove',
                chatInputRun: 'removeRun',
            },
            {
                name: 'setstatus',
                chatInputRun: 'setStatusRun',
            },
            {
                name: 'list',
                chatInputRun: 'listRun',
            }
        ]
    });
  }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => {
            builder
                .setName('tasks')
                .setDescription('Commande de gestion des tâches')
                .addSubcommand((sub) =>
                    sub.setName('create')
                        .setDescription('Crée une nouvelle tâche pour l\'utilisateur')
                        .addStringOption((opt) =>
                            opt.setName('task')
                                .setDescription('La tâche à créer')
                                .setRequired(true)
                        )
                        .addUserOption((opt) =>
                            opt.setName('user')
                                .setDescription('L\'utilisateur pour lequel créer la tâche (par défaut, vous)')
                                .setRequired(false)
                        )
                )
                .addSubcommand((sub) =>
                    sub.setName('remove')
                        .setDescription('retire une tâche pour l\'utilisateur')
                        .addStringOption((opt) =>
                            opt.setName('id')
                                .setDescription('l\id de la tâche à retirer')
                                .setRequired(true)
                        )
                        .addUserOption((opt) =>
                            opt.setName('user')
                                .setDescription('L\'utilisateur pour lequel retirer la tâche (par défaut, vous)')
                                .setRequired(false)
                        )
                )
                .addSubcommand((sub) =>
                    sub.setName('list')
                        .setDescription('Liste les tâches pour l\'utilisateur')
                        .addUserOption((opt) =>
                            opt.setName('user')
                                .setDescription('L\'utilisateur pour lequel lister les tâches (par défaut, vous)')
                                .setRequired(false)
                        )
                )
                .addSubcommand((sub) =>
                    sub.setName('setstatus')
                        .setDescription('Met à jour le statut d\'une tâche pour l\'utilisateur')
                        .addStringOption((opt) =>
                            opt.setName('id')
                                .setDescription('l\'id de la tâche à mettre à jour')
                                .setRequired(true)
                        )
                        .addStringOption((opt) =>
                            opt.setName('status')
                                .setDescription('Le nouveau statut de la tâche (ex: pending, completed)')
                                                                .addChoices(
                                    { name: 'en attente', value: 'pending' },
                                    { name: 'en cours', value: 'in_progress' },
                                    { name: 'terminé', value: 'completed' },
                                    { name: 'annulé', value: 'cancelled' }
                                )
                                .setRequired(true)
                        )
                        .addUserOption((opt) =>
                            opt.setName('user')
                                .setDescription('L\'utilisateur pour lequel mettre à jour la tâche (par défaut, vous)')
                                .setRequired(false)
                        )
                    );

        }
        );
    }
    async createRun(interaction) {
        const task = interaction.options.getString('task');
        const user = interaction.options.getUser('user') || interaction.user;
        const username = user.username;
        try {
            const result = await pool.query(
                `INSERT INTO monica_tasks (user_id, username, task, status) VALUES
                ($1, $2, $3, $4) RETURNING id`,
                [user.id, username, task, 'pending']
            );

            const createEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Nouvelle tâche créée')
                .setDescription(`Une nouvelle tâche a été créée pour ${user.tag}.`)
                .addFields(
                    { name: 'ID de la tâche', value: `${result.rows[0].id}`, inline: true },
                    { name: 'Tâche', value: task, inline: true },
                    { name: 'Créée par', value: interaction.user.tag, inline: true }
                )
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                .setTimestamp();

            interaction.reply({
                embeds: [createEmbed],
                ephemeral: MessageFlags.Ephemeral
            });
        }
        catch (error) {
            console.error('❌ Erreur lors de la création de la tâche:', error);
            interaction.reply('❌ Une erreur est survenue lors de la création de la tâche.');
        }

    }


    async removeRun(interaction) {
        const taskId = interaction.options.getString('id');
        const user = interaction.options.getUser('user') || interaction.user;

        try {
            const result = await pool.query(
                `DELETE FROM monica_tasks WHERE id = $1 AND user_id = $2 RETURNING *`,
                [taskId, user.id]
            );

            if (result.rowCount === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Erreur de suppression de tâche')
                    .setDescription(`Aucune tâche trouvée avec l'ID ${taskId} pour ${user.tag}.`)
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .setTimestamp();
                interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: MessageFlags.Ephemeral
                });
            }
            else {
                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Tâche supprimée')
                    .setDescription(`La tâche avec l'ID ${taskId} a été supprimée pour ${user.tag}.`)
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .setTimestamp();
                interaction.reply({
                    embeds: [successEmbed],
                    ephemeral: MessageFlags.Ephemeral
                });
            }
        }
        catch (error) {
            console.error('❌ Erreur lors de la suppression de la tâche:', error);
            interaction.reply('❌ Une erreur est survenue lors de la suppression de la tâche.');
        }
        
    }
    

    async listRun(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const username = user.username;
        try {
            const result = await pool.query(
                `SELECT id, task, created_at, status FROM monica_tasks WHERE user_id = $1 ORDER BY created_at DESC`,
                [user.id]
            );

            if (result.rowCount === 0) {
                const noTasksEmbed = new EmbedBuilder()
                    .setColor('#7a34ba')
                    .setTitle('Aucune tâche trouvée')
                    .setDescription(`Aucune tâche n'a été trouvée pour ${user.tag}.`)
                    .setAuthor({ name: username, iconURL: user.displayAvatarURL() })
                    .setTimestamp();
                interaction.reply({
                    embeds: [noTasksEmbed],
                    ephemeral: MessageFlags.Ephemeral
                });
            }
            else {
                const tasksList = result.rows.map(row => `**ID:** ${row.id} | **Tâche:** ${row.task} | **Créée le:** ${new Date(row.created_at).toLocaleString()} | Status: ${row.status} `).join('\n');
                const tasksEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`Tâches pour ${user.tag}`)
                    .setDescription(tasksList)
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .setTimestamp();
                interaction.reply({
                    embeds: [tasksEmbed],
                    ephemeral: MessageFlags.Ephemeral
                });
            }

        }
        catch (error) {
            console.error('❌ Erreur lors de la récupération des tâches:', error);
            interaction.reply('❌ Une erreur est survenue lors de la récupération des tâches.');
        }

    }

    async setStatusRun(interaction) {
        const taskId = interaction.options.getString('id');
        const status = interaction.options.getString('status');
        const user = interaction.options.getUser('user') || interaction.user;

        try {
            const result = await pool.query(
                `UPDATE monica_tasks SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
                [status, taskId, user.id]
            );

            if (result.rowCount === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Erreur de mise à jour du statut de la tâche')
                    .setDescription(`Aucune tâche trouvée avec l'ID ${taskId} pour ${user.tag}.`)
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .setTimestamp();
                interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: MessageFlags.Ephemeral
                });
            }

            else {
                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Statut de la tâche mis à jour')
                    .setDescription(`Le statut de la tâche avec l'ID ${taskId} a été mis à jour pour ${user.tag}.`)
                    .addFields(
                        { name: 'Nouveau statut', value: status, inline: true }
                    )
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .setTimestamp();
                interaction.reply({
                    embeds: [successEmbed],
                    ephemeral: MessageFlags.Ephemeral
                });
            }
        }
        catch (error) {
            console.error('❌ Erreur lors de la mise à jour du statut de la tâche:', error);
            interaction.reply('❌ Une erreur est survenue lors de la mise à jour du statut de la tâche.');
        }

    }
}
module.exports = { TasksCommand };