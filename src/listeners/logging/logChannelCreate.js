const { Listener, Events } = require('@sapphire/framework');

const { EmbedBuilder } = require('discord.js');
require("dotenv").config();


class LogChannelCreateListener extends Listener {
    constructor(context, options) {
        super(context, {    
            ...options,
            event: Events.ChannelCreate,
            once: false,
        });
    }

    async run(channel) {

        channel.send({ content: `Le salon ${channel} a été créé !` });

    }

}

module.exports = { LogChannelCreateListener };