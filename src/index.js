require("dotenv").config();
const { SapphireClient, ApplicationCommandRegistries } = require("@sapphire/framework");
const { GatewayIntentBits } = require("discord.js");

ApplicationCommandRegistries.setDefaultGuildIds([process.env.GUILD_ID]);

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  loadMessageCommandListeners: true,
  loadDefaultErrorListeners: true,


});

client.on('messageCreate', (message) => {
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
});

client.login(process.env.DISCORD_TOKEN)