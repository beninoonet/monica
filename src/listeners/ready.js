const { Listener, Events } = require('@sapphire/framework');
const { ActivityType } = require('discord.js');

const { IntervalRSS } = require('../lib/IntervalRSS');

class ReadyListener extends Listener {
  constructor(context, options) {
    super(context, { ...options, event: Events.ClientReady, once: true });
  }



async run(client) {
    /* Client as ready */
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    
    client.user.setActivity('💗 Amour Parano', { type: ActivityType.Listening });


    // IntervalRSS; // Start the interval for checking RSS feeds every 30 minutes
    
  }
}

module.exports = { ReadyListener };