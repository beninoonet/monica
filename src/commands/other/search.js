const { Subcommand } = require('@sapphire/plugin-subcommands');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const TwitchClient = require('../../lib/twitch/twitchApi');

class SearchCommand extends Subcommand {
  constructor(context, options) {
    super(context, {
        ...options,
        name: 'search',
        description: 'Commandes de recherche',
        subcommands: [
            {
                name: 'streamer',
                chatInputRun: 'streamerRun',
            },
            {
                name: 'anime',
                chatInputRun: 'animeRun',
            },
        ]
    });
  }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => {
            builder
                .setName('search')
                .setDescription('Commandes de recherche')
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
                .addSubcommand((sub) =>
                    sub.setName('streamer')
                        .setDescription('Recherche un streamer sur Twitch')
                        .addStringOption((opt) =>
                            opt.setName('username')
                                .setDescription('Nom d\'utilisateur du streamer')
                                .setRequired(true)
                        ))
                .addSubcommand((sub) =>
                    sub.setName('anime')
                        .setDescription('Recherche un anime sur MyAnimeList')
                        .addStringOption((opt) =>
                            opt.setName('title')
                                .setDescription('Titre de l\'anime')
                                .setRequired(true)
                        ));
                    
        }
        );
    }

    async streamerRun(interaction) {
    
       try {
         const username = interaction.options.getString('username');

        // Call the Twitch API to get the streamer information
        const twitchClient = new TwitchClient();
        const streams = await twitchClient.getUserByName(username);

        if (!streams) {
            return interaction.reply({ content: `Aucun streamer trouvé avec le nom d'utilisateur "${username}".`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Streamer: ${streams.display_name}`)
            .setImage(streams.offline_image_url || streams.profile_image_url)
            .setDescription(`${streams.description || 'Aucune description disponible.'}`)
            .setFields(
                { name: 'Nom d\'utilisateur', value: streams.login, inline: false },
                { name: 'ID', value: streams.id, inline: true },
                { name: 'Type', value: streams.type || 'N/A', inline: true },
                { name: 'Vues totales', value: streams.view_count.toString(), inline: true },
                { name: 'Créé le', value: new Date(streams.created_at).toLocaleDateString(), inline: true }
            )
            .setThumbnail(streams.profile_image_url)
            .setColor('#9146FF');
        
        return interaction.reply({ embeds: [embed] });
       } catch (error) {
        console.error('Erreur lors de la récupération du streamer:', error);
        return interaction.reply({ content: 'Une erreur est survenue lors de la récupération du streamer.', ephemeral: true });
       }
    }
  /* END OF CODE */
}

module.exports = { SearchCommand };