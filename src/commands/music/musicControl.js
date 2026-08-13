const { Subcommand } = require('@sapphire/plugin-subcommands');


class MusicControlCommand extends Subcommand {
  constructor(context, options) {
    super(context, {
        ...options,
        name: 'music',
        description: 'Commandes de contrôle de la musique',
        subcommands: [
            {
                name: 'volume',
                chatInputRun: 'volumeRun',
            },
            {
                name: 'loop',
                chatInputRun: 'loopRun',
            },
            {
                name: 'random',
                chatInputRun: 'randomRun',
            }
        ]
    });
  }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => {
            builder
                .setName('music')
                .setDescription('Commandes de contrôle de la musique')
                .addSubcommand((sub) =>
                    sub.setName('volume')
                        .setDescription('Défini le volume de la musique pour tout le monde')
                        .addIntegerOption((opt) =>
                            opt.setName('level')
                                .setDescription('Niveau de volume (0-100)')
                                .setRequired(true)
                                .setMinValue(0)
                                .setMaxValue(100)
                        )
                )
                .addSubcommand((sub) =>
                    sub.setName('loop')
                        .setDescription('Active ou désactive la boucle pour la musique en cours')
                )
                .addSubcommand((sub) =>
                    sub.setName('random')
                        .setDescription('Joue une musique aléatoire dans la playlist')
                );
        }
        );
    }

    async volumeRun(interaction) {
        const { kazagumo } = require('@sapphire/framework').container;
        const player = kazagumo.players.get(interaction.guildId);

        if (!player) return interaction.reply({ content: '❌ Aucune musique en cours.', ephemeral: true });
        const level = interaction.options.getInteger('level');
        if (level === 0) {
            await player.setVolume(0);
            return interaction.reply({ content: '🔇 Volume mis à 0 (muet)', ephemeral: true });
        }
        await player.setVolume(level);
        interaction.reply({ content: `🔊 Volume réglé à ${level}%`, ephemeral: true });
    }
    /* LoopCmd */
    async loopRun(interaction) {
        const { kazagumo } = require('@sapphire/framework').container;
        const player = kazagumo.players.get(interaction.guildId);

        if (!player) return interaction.reply({ content: '❌ Aucune musique en cours.', ephemeral: true });

        const isLooping = player.queue.current?.isLooping || false;
        player.queue.current.isLooping = !isLooping;
        interaction.reply({ content: `🔁 Boucle ${!isLooping ? 'activée' : 'désactivée'} pour la musique en cours.`, ephemeral: true });

    }
    /* RandomCmd */
    async randomRun(interaction) {
        const { kazagumo } = require('@sapphire/framework').container;
        const player = kazagumo.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Aucune musique en cours.', ephemeral: true });

        const queue = player.queue;
        if (queue.length === 0) return interaction.reply({ content: '❌ Aucune musique dans la file d\'attente.', ephemeral: true });
        const randomIndex = Math.floor(Math.random() * queue.length);
        const randomTrack = queue[randomIndex];
        player.queue.splice(randomIndex, 1);
        player.queue.unshift(randomTrack);
        player.stop();
        interaction.reply({ 
            content: `🎲 Musique aléatoire sélectionnée : **${randomTrack.title}**`, 
            ephemeral: true });
        }




  /* END OF CODE */
}

module.exports = { MusicControlCommand };