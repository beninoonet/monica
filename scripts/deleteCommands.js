require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deleteCommands() {
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
  console.log('✅ Toutes les commandes supprimées');
}

async function checkCommands() {
  const commands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
  console.log('Commandes restantes :', commands.map(c => c.name));
}

deleteCommands();
checkCommands();