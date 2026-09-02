require("dotenv").config();
const { Listener, Events, container } = require('@sapphire/framework');
const { ActivityType } = require('discord.js');

/* RSS */
const { IntervalRSS } = require('../lib/RSS/IntervalRSS');
/* DB */
const pool = require('../lib/database');
const { initDatabase } = require('../lib/initDatabase');

class ReadyListener extends Listener {
  constructor(context, options) {
    super(context, { ...options, event: Events.ClientReady, once: true });
  }



async run(client) {
    /* Client as ready */
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    
    client.user.setActivity('💗 Amour Passager', { type: ActivityType.Listening });

    IntervalRSS; // every 12 hours
    pool.connect()
      .then(() => {
        console.log('✅ Connecté à la base de données PostgreSQL');
      })
      .catch((err) => {
        console.error('❌ Erreur lors de la connexion à la base de données PostgreSQL:', err);
      });

    // Initialize the database tables
    await initDatabase().then(() => {
      console.log('✅ Tables de la base de données initialisées');
    }
    ).catch((err) => {
      console.error('❌ Erreur lors de l\'initialisation des tables de la base de données:', err);
    });

      // Add a guild to the database when the bot is ready
      for (const guild of client.guilds.cache.values()) {
        pool.query(
        `INSERT INTO monica_guilds (guild_id, name, member_count, joined_at, owner_id)
         VALUES ($1, $2, $3, NOW(), $4)
          ON CONFLICT (guild_id) DO NOTHING`,
        [guild.id, guild.name, guild.memberCount, guild.ownerId]
      )
      .then(() => {
        console.log('✅ Guild ajoutée à la base de données.');
      })
      .catch((err) => {
        console.error('❌ Erreur lors de l\'ajout de la guild à la base de données:', err);
      });
    }
    

  }
}

module.exports = { ReadyListener };