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


client.login(process.env.DISCORD_TOKEN)