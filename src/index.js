require("dotenv").config();
const { SapphireClient, ApplicationCommandRegistries, container } = require("@sapphire/framework");
const { GatewayIntentBits } = require("discord.js");
// subcommand plugin
const { SubcommandPluginIdentifiers } = require('@sapphire/plugin-subcommands');


// Init a command only on a specific guild for development
ApplicationCommandRegistries.setDefaultGuildIds([process.env.GUILD_ID]);

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],

  loadMessageCommandListeners: true,
  loadDefaultErrorListeners: true,

});

// Command to test the join and quit events
/* client.on('messageCreate', (message) => {
  if (message.content === 'join') {
    try {
      client.emit('guildMemberAdd', message.member);
      }
     catch (error) {
      console.error('Error executing join message listener:', error);
    }
  }

  if (message.content === 'quit') {
    try {
      client.emit('guildMemberRemove', message.member);
      }
     catch (error) {
      console.error('Error executing quit message listener:', error);
    }
  }
}); */

client.login(process.env.DISCORD_TOKEN)