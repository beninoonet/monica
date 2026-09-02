const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags, AttachmentBuilder } = require('discord.js');
require('dotenv').config();



class SmashOrPassCommand extends Command {
    constructor(context, options) {
        super(context, { ...options });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('smashorpass')
                .setDescription('Lance un mini-jeu de Smash or Pass')
                .addAttachmentOption((opt) =>
                    opt
                        .setName('image')
                        .setDescription('Image à utiliser pour le sondage')
                        .setRequired(true)
                )
        );
    }

    async chatInputRun(interaction) {
        
        const imageAttachment = interaction.options.getAttachment('image');
        const response = await fetch(imageAttachment.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const filename = imageAttachment.name || 'image.png';

        const file = new AttachmentBuilder(buffer, { name: filename });


        const state = {
            smashVote: 0,
            passVote: 0,
            voters: new Set(),
        };

        const buildEmbed = (status = 'En cours') => {
            const totalVotes = state.smashVote + state.passVote;
            const SmashWinCondition = state.smashVote > state.passVote;
            const embed = new EmbedBuilder()
                .setTimestamp()
                .setAuthor({ name: `Proposé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTitle('Smash or Pass')
                .setColor(status === 'En cours' ? 'Green' : (SmashWinCondition ? 'Green' : 'Red'))
                .setImage(`attachment://${filename}`)
                .setFooter({ text: `Total Votes: ${totalVotes} | Vous avez 3 minutes` })
                .addFields(
                    { name: 'Votes Smash', value: `${state.smashVote}`, inline: true },
                    { name: 'Votes Pass', value: `${state.passVote}`, inline: true }
                );

            if (status === 'ended') {
                embed.setTitle(`Smash or Pass - Terminé`)
                    .setFooter({ text: `Résultat final | Total Votes: ${totalVotes}` })
                    .addFields(
                        { name: 'Résultat', value: SmashWinCondition ? 'Smash a gagné !' : 'Pass a gagné !', inline: false }
                    );
            }

            return embed;
        }; 

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('smash')
                    .setLabel('Smash')
                    .setEmoji({ id: '1528458542091337941', name: 'smash' }) // Use custom emoji if provided, otherwise fallback to ❌
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('pass')
                    .setLabel('Pass')
                    .setEmoji({ id: '1528458541143167199', name: 'pass' }) // Use custom emoji if provided, otherwise fallback to ❌
                    .setStyle(ButtonStyle.Danger)
            );

        const { resource } = await interaction.reply({ 
            embeds: [buildEmbed()],
            components: [row],
            files: [file],
            withResponse: true
        });

        const message = resource.message; 

        // security: only allow the user who initiated the command to vote
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3 * 60 * 1000, // 3 minutes
        });

        collector.on('collect', async (buttonInteraction) => {
            // Anti revote
            if (state.voters.has(buttonInteraction.user.id)) {
                await buttonInteraction.reply({ content: '❌ Vous avez déjà voté !', flags: MessageFlags.Ephemeral });
                return;
            }

            state.voters.add(buttonInteraction.user.id);
            if (buttonInteraction.customId === 'smash') {
                state.smashVote++;
            } else if (buttonInteraction.customId === 'pass') {
                state.passVote++;
            }

            await buttonInteraction.update({ embeds: [buildEmbed()], components: [row], files: [file] });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                ButtonBuilder.from(row.components[0]).setDisabled(true),
                ButtonBuilder.from(row.components[1]).setDisabled(true)
            );

            await interaction.editReply({ embeds: [buildEmbed('ended')], components: [disabledRow], files: [file] });
        });
    }
}

module.exports = {
    SmashOrPassCommand
};