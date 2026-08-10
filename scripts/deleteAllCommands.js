require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ✅ Wrapper dans une fonction async
async function deleteCommands() {
  // Supprimer TOUTES les commandes globales
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
  console.log('✅ Toutes les commandes supprimées');
}

async function checkCommands() {
  const commands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
  console.log('Commandes restantes :', commands.map(c => c.name));
}

deleteCommands();
checkCommands();