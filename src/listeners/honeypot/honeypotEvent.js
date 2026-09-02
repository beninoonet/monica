require("dotenv").config();
const { Listener, Events } = require('@sapphire/framework');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isHoneypotChannel } = require('../../lib/honeypotLib');

const { getLogChannel } = require('../../lib/getLogChannel');
class HoneypotEvent extends Listener {
  constructor(context, options) {
    super(context, { ...options, event: Events.MessageCreate, once: false });
  }

async run(message) {
  const { guild, channel } = message;
  if (!guild || !channel) return;

  const logChannel = await getLogChannel(guild.id);
  if (!logChannel) {
    console.error('❌ Impossible de récupérer le canal de journalisation.');
    return;
  }

  // Check if the channel is a honeypot channel
  const isHoneypot = await isHoneypotChannel(guild.id, channel.id);
  if (!isHoneypot) return;
  // if hierarchy is higher than the bot, do not ban
  if (guild.members.me.roles.highest.position <= message.member.roles.highest.position) {
    console.log(`L'utilisateur ${message.author.tag} a un rôle plus élevé que le bot, il ne sera pas banni.`);
    return;
  }

  // Check if the user hasn't been banned yet
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator) || message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    guild.members.ban(message.author.id, { reason: 'Tentative de spam dans le salon pot de miel', deleteMessageDays: 2 })
      .then(() => {
        console.log(`Utilisateur ${message.author.tag} banni pour avoir envoyé un message dans le salon pot de miel.`);
        const embed = new EmbedBuilder()
          .setTitle('Utilisateur banni (Pot de Miel)')
          .setDescription(`L'utilisateur ${message.author.tag} a été banni pour avoir envoyé un message dans le salon **pot de miel**.`)
          .setColor('#ff0000');
        logChannel.send({ embeds: [embed] });
      })
      .catch((err) => {
        console.error('❌ Erreur lors du bannissement de l\'utilisateur :', err);
      });
  } else {
    console.log(`L'utilisateur ${message.author.tag} a les permissions d'administrateur ou de gestion du serveur, il ne sera pas banni.`);
  }

  console.log(`Message reçu dans le salon pot de miel : ${message.content}`);
    }
}

module.exports = { HoneypotEvent };