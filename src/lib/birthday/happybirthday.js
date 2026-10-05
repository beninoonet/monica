// happybirthday.js
const { EmbedBuilder } = require('discord.js');
const pool = require('../database');

const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

async function sendBirthdayMessage(client) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dateString = `${day}-${month}`;

    try {
        const query = `
            SELECT user_id, guild_id
            FROM monica_birthdays
            WHERE TO_CHAR(birthday_date, 'DD-MM') = $1;
        `;
        const results = await pool.query(query, [dateString]);

        for (const row of results.rows) {
            const guild = await client.guilds.fetch(row.guild_id);
            const member = await guild.members.fetch(row.user_id);
            const embed = new EmbedBuilder()
                .setTitle('🎉 Joyeux anniversaire !')
                .setDescription(`Aujourd'hui, c'est l'anniversaire de ${member}! 🎂`
                )
                .setColor('Random')
                .setTimestamp();

            const ageQuery = `
                SELECT birthday_date
                FROM monica_birthdays
                WHERE user_id = $1 AND guild_id = $2;
            `;
            const ageResult = await pool.query(ageQuery, [row.user_id, row.guild_id]);
            const age = calculateAge(ageResult.rows[0].birthday_date);
            embed.setDescription(`Aujourd'hui, c'est l'anniversaire de ${member}! 🎂 (Age: ${age})`);

            const channel = guild.systemChannel || guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
            if (channel) {
                await channel.send({ embeds: [embed] });
            } else {
                console.warn(`Aucun canal trouvé pour envoyer le message d'anniversaire dans la guilde ${guild.name}.`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message d\'anniversaire:', error);
    }
}

module.exports = { sendBirthdayMessage };