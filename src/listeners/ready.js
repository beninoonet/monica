const { Listener, Events } = require('@sapphire/framework');
const { ActivityType } = require('discord.js');
class ReadyListener extends Listener {
  constructor(context, options) {
    super(context, { ...options, event: Events.ClientReady, once: true });
  }

async run(client) {
    /* Client as ready */
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setActivity('En préparation', { type: ActivityType.Listening });

  }
}

module.exports = { ReadyListener };