const { Subcommand } = require('@sapphire/plugin-subcommands');
const { MessageFlags, EmbedBuilder } = require('discord.js');
const pool = require('../../lib/database');

class BirthdayCommand extends Subcommand {
  constructor(context, options) {
    super(context, {
        ...options,
        name: 'anniversaire',
        description: 'Commandes de contrôle des anniversaires',
        subcommands: [
            {
                name: 'add',
                chatInputRun: 'addRun',
            },
            {
                name: 'remove',
                chatInputRun: 'removeRun',
            },
            {
                name: 'liste',
                chatInputRun: 'listRun',
            }
        ]
    });
  }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => {
            builder
                .setName('anniversaire')
                .setDescription('Commandes de contrôle des anniversaires')
                .addSubcommand((sub) =>
                    sub.setName('add')
                        .setDescription('Définir la date de ton anniversaire')
                        .addStringOption((opt) =>
                            opt.setName('date')
                                .setDescription('Date de ton anniversaire (format: JJ-MM-AAAA ou JJ-MM)')
                                .setRequired(true)
                        )
                )
                .addSubcommand((sub) =>
                    sub.setName('remove')
                        .setDescription('Retire la date de ton anniversaire')
                )
                .addSubcommand((sub) =>
                    sub.setName('liste')
                        .setDescription('Affiche la liste des anniversaires dans ce serveur')
                );
            }
        );
    }

    async addRun(interaction) {
        const date = interaction.options.getString('date');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // format to date JJ-MM-AAAA or JJ-MM
        const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])(-\d{4})?$/;

        if (!dateRegex.test(date)) {
            return interaction.reply({ content: 'Format de date invalide. Utilisez le format JJ-MM-AAAA ou JJ-MM.', ephemeral: MessageFlags.Ephemeral });
        }
        
        try { 
            // formatted a date JJ/MM/AAAA or JJ/MM to display in the reply
            const [day, month, year] = date.split('-');
            const formattedDate = year ? `${day}/${month}/${year}` : `${day}-${month}`; 

            const query = `
                INSERT INTO monica_birthdays (guild_id, user_id, birthday_date)
                VALUES ($1, $2, $3)
                ON CONFLICT (guild_id, user_id)
                DO UPDATE SET birthday_date = EXCLUDED.birthday_date;
                `;
            await pool.query(query, [guildId, userId, date]);
            return interaction.reply({ content: `Ton anniversaire a été défini au **${formattedDate}**.`, ephemeral: MessageFlags.Ephemeral });
        }
        catch (error) {
            console.error('Erreur lors de l\'ajout de l\'anniversaire:', error);
            return interaction.reply({ content: 'Une erreur est survenue lors de l\'ajout de ton anniversaire.', ephemeral: MessageFlags.Ephemeral });
        }
    }

    async removeRun(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const query = `
                DELETE FROM monica_birthdays
                WHERE guild_id = $1 AND user_id = $2;
            `;
            await pool.query(query, [guildId, userId]);
            return interaction.reply({ content: 'Ton anniversaire a été retiré.', ephemeral: MessageFlags.Ephemeral });
        }
        catch (error) {
            console.error('Erreur lors de la suppression de l\'anniversaire:', error);
            return interaction.reply({ content: 'Une erreur est survenue lors de la suppression de ton anniversaire.', ephemeral: MessageFlags.Ephemeral });
        }
    }

    async listRun(interaction) {
        const guildId = interaction.guild.id;

        let description = '';

        try { 
            const query = `
                SELECT user_id, birthday_date
                FROM monica_birthdays
                WHERE guild_id = $1;
            `;
            const results = await pool.query(query, [guildId]);
            // create loop with result
            for (const row of results.rows) {
                const user = await interaction.guild.members.fetch(row.user_id);
                const birthday = row.birthday_date


                const day = String(birthday.getDate()).padStart(2, '0');
                const month = String(birthday.getUTCMonth() + 1).padStart(2, '0');
                const year = birthday.getUTCFullYear()

                if (!birthday) continue;

                const age = calculateAge(birthday);

                description += `**${user}** fête son anniversaire le **${day}**/**${month}**/**${year}** (**${age} ans**)\n\n`
            }

            if (!description) {
                description = "Aucun anniversaire"
            }

            const listEmbed = new EmbedBuilder()
                .setTitle("Liste des anniversaires")
                .setDescription(description)
                .setColor('Random')

            await interaction.reply({ embeds: [listEmbed] });

        } catch (error) {
            console.error('Erreur lors de la récupération de la liste des anniversaires:', error);
            return interaction.reply({ content: 'Une erreur est survenue lors de la récupération de la liste des anniversaires.', ephemeral: MessageFlags.Ephemeral });
        }
    }
}

function calculateAge(birthday){
    const today = new Date();
    let age = today.getUTCFullYear() - birthday.getUTCFullYear();

    const hasHadBirthdayThisYear = 
    today.getUTCMonth() > birthday.getUTCMonth() ||
    (today.getUTCMonth() === birthday.getUTCMonth() && today.getUTCDate() >= birthday.getUTCDate())

    if(!hasHadBirthdayThisYear) {
        age--;
    }
    return age;
}

module.exports = { BirthdayCommand };