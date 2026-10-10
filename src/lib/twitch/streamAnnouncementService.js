const {
    EmbedBuilder,
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
    GuildScheduledEventStatus
} = require('discord.js');
const pool = require('../database');
const TwitchClient = require('./twitchApi');

async function announceStreamEnd(client, channel) {
    const announcementChannel = await client.channels.fetch(channel.announcement_channel_id).catch((error) => {
        console.error(`❌ Impossible de récupérer le salon d'annonce Twitch ${channel.announcement_channel_id}:`, error);
        return null;
    });
    if (announcementChannel && announcementChannel.isTextBased()) {
        try {
            await announcementChannel.send({
                content: `⚫ **${channel.twitch_display_name}** a terminé son live Twitch.`
            });
        } catch (error) {
            console.error(`❌ Impossible d'envoyer la fin du live Twitch ${channel.twitch_login}:`, error);
        }
    }

    if (!channel.scheduled_event_id) return;

    const guild = await client.guilds.fetch(channel.guild_id).catch((error) => {
        console.error(`❌ Impossible de récupérer le serveur ${channel.guild_id} pour terminer l'évènement Twitch:`, error);
        return null;
    });
    if (!guild) return;

    try {
        const event = await guild.scheduledEvents.fetch(channel.scheduled_event_id);
        if (event.status === GuildScheduledEventStatus.Active) {
            await event.setScheduledEndTime(new Date());
            await event.setStatus(GuildScheduledEventStatus.Completed);
        } else if (event.status === GuildScheduledEventStatus.Scheduled) {
            await event.setStatus(GuildScheduledEventStatus.Canceled);
        }
    } catch (error) {
        console.error(
            `❌ Impossible de finaliser l'évènement Discord du live Twitch ${channel.twitch_login}:`,
            error
        );
    }
}

async function createStreamEvent(guild, channel, stream) {
    const scheduledStartTime = new Date(Date.now() + 1000);
    const event = await guild.scheduledEvents.create({
        name: `${channel.twitch_display_name} - Live Twitch`,
        scheduledStartTime,
        scheduledEndTime: new Date(scheduledStartTime.getTime() + 4 * 60 * 60 * 1000),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        entityMetadata: { location: `https://www.twitch.tv/${channel.twitch_login}` },
        description: stream.title || `Live Twitch de ${channel.twitch_display_name}`
    });
    await event.setStatus(GuildScheduledEventStatus.Active);
    return event.id;
}

async function checkTwitchStreams(client) {
    const configured = await pool.query(
        `SELECT guild_id, twitch_login, twitch_display_name, announcement_channel_id,
                last_stream_id, scheduled_event_id, is_live
         FROM monica_twitch_channels`
    );
    if (!configured.rows.length) return;

    const streams = await new TwitchClient().getStreams(configured.rows.map((row) => row.twitch_login));
    const liveByLogin = new Map(streams.map((stream) => [stream.user_login.toLowerCase(), stream]));

    for (const channel of configured.rows) {
        const stream = liveByLogin.get(channel.twitch_login);
        if (!stream) {
            if (channel.is_live) {
                await announceStreamEnd(client, channel);
                await pool.query(
                    `UPDATE monica_twitch_channels
                     SET is_live = FALSE, last_stream_id = NULL, scheduled_event_id = NULL
                     WHERE guild_id = $1 AND twitch_login = $2`,
                    [channel.guild_id, channel.twitch_login]
                );
            }
            continue;
        }
        if (channel.is_live && channel.last_stream_id === stream.id) continue;
        // Stream is live and either it's a new stream or the channel was previously offline
        if (channel.is_live) {
            await announceStreamEnd(client, channel);
        }
        const announcementChannel = await client.channels.fetch(channel.announcement_channel_id).catch((error) => {
            console.error(`❌ Impossible de récupérer le salon d'annonce Twitch ${channel.announcement_channel_id}:`, error);
            return null;
        });
        if (!announcementChannel || !announcementChannel.isTextBased()) continue;
        const embed = new EmbedBuilder()
            .setColor('#9146FF')
            .setTitle(`${channel.twitch_display_name} est en live sur Twitch !`)
            .setURL(`https://www.twitch.tv/${channel.twitch_login}`)
            .setDescription(stream.title || 'Nouveau live en cours.')
            .addFields({ name: 'Jeu', value: stream.game_name || 'Non précisé', inline: true })
            .setImage(stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
            .setTimestamp(new Date(stream.started_at));

        await announcementChannel.send({
            content: `🔴 **${channel.twitch_display_name}** est en live !`,
            embeds: [embed]
        });

        const guild = await client.guilds.fetch(channel.guild_id).catch((error) => {
            console.error(`❌ Impossible de récupérer le serveur ${channel.guild_id} pour créer l'évènement Twitch:`, error);
            return null;
        });
        let scheduledEventId = null;
        if (guild) {
            try {
                scheduledEventId = await createStreamEvent(guild, channel, stream);
            } catch (error) {
                console.error(
                    `❌ Impossible de créer l’évènement Discord pour le live Twitch ${channel.twitch_login}:`,
                    error
                );
            }
        }


        // Update the database to mark the channel as live and store the last stream ID


        await pool.query(
            `UPDATE monica_twitch_channels
             SET is_live = TRUE, last_stream_id = $1, scheduled_event_id = $2
             WHERE guild_id = $3 AND twitch_login = $4`,
            [stream.id, scheduledEventId, channel.guild_id, channel.twitch_login]
        );
    }
}

function startTwitchAnnouncements(client) {
    const run = () => checkTwitchStreams(client).catch((error) => {
        console.error('❌ Erreur lors de la surveillance des lives Twitch:', error);
    });
    run();
    return setInterval(run, 60 * 1000);
}

module.exports = { startTwitchAnnouncements };
