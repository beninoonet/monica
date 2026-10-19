const {
    EmbedBuilder,
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
    GuildScheduledEventStatus
} = require('discord.js');
const pool = require('../database');
const TwitchClient = require('./twitchApi');

const PREVIEW_UPDATE_INTERVAL = 30 * 60 * 1000;

function buildStreamEmbed(channel, stream) {
    return new EmbedBuilder()
        .setColor('#9146FF')
        .setTitle(`${channel.twitch_display_name} est en live sur Twitch !`)
        .setURL(`https://www.twitch.tv/${channel.twitch_login}`)
        .setDescription(stream.title || 'Nouveau live en cours.')
        .addFields({ name: 'Jeu', value: stream.game_name || 'Non précisé', inline: true })
        .setImage(stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
        .setTimestamp(new Date(stream.started_at));
}

async function announceStreamEnd(client, channel) {
    const announcementChannel = await client.channels.fetch(channel.announcement_channel_id).catch((error) => {
        console.error(`❌ Impossible de récupérer le salon d'annonce Twitch ${channel.announcement_channel_id}:`, error);
        return null;
    });
    if (announcementChannel && announcementChannel.isTextBased()) {
        try {
            if (channel.announcement_message_id) {
                const message = await announcementChannel.messages.fetch(channel.announcement_message_id);
                await message.edit({
                    content: `⚫ **${channel.twitch_display_name}** a terminé son live Twitch.`,
                    embeds: []
                });
            } else {
                await announcementChannel.send({
                    content: `⚫ **${channel.twitch_display_name}** a terminé son live Twitch.`
                });
            }
        } catch (error) {
            console.error(`❌ Impossible de modifier le message de fin du live Twitch ${channel.twitch_login}:`, error);
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
        await event.delete();
    } catch (error) {
        console.error(
            `❌ Impossible de supprimer l'évènement Discord du live Twitch ${channel.twitch_login}:`,
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
        image: stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'),
        entityMetadata: { location: `https://www.twitch.tv/${channel.twitch_login}` },
        description: stream.title || `Live Twitch de ${channel.twitch_display_name}`
    });
    await event.setStatus(GuildScheduledEventStatus.Active);
    return event.id;
}

async function checkTwitchStreams(client) {
    const configured = await pool.query(
        `SELECT guild_id, twitch_login, twitch_display_name, announcement_channel_id,
                last_stream_id, announcement_message_id, preview_updated_at,
                scheduled_event_id, is_live
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
                     SET is_live = FALSE, last_stream_id = NULL,
                         announcement_message_id = NULL, preview_updated_at = NULL,
                         scheduled_event_id = NULL
                     WHERE guild_id = $1 AND twitch_login = $2`,
                    [channel.guild_id, channel.twitch_login]
                );
            }
            continue;
        }
        if (channel.is_live && channel.last_stream_id === stream.id) {
            if (
                channel.announcement_message_id &&
                (!channel.preview_updated_at ||
                    Date.now() - new Date(channel.preview_updated_at).getTime() >= PREVIEW_UPDATE_INTERVAL)
            ) {
                const announcementChannel = await client.channels.fetch(channel.announcement_channel_id).catch((error) => {
                    console.error(`❌ Impossible de récupérer le salon d'annonce Twitch ${channel.announcement_channel_id}:`, error);
                    return null;
                });
                if (announcementChannel && announcementChannel.isTextBased()) {
                    try {
                        const message = await announcementChannel.messages.fetch(channel.announcement_message_id);
                        await message.edit({ embeds: [buildStreamEmbed(channel, stream)] });
                        await pool.query(
                            `UPDATE monica_twitch_channels SET preview_updated_at = NOW()
                             WHERE guild_id = $1 AND twitch_login = $2`,
                            [channel.guild_id, channel.twitch_login]
                        );
                    } catch (error) {
                        console.error(`❌ Impossible de mettre à jour la preview Twitch ${channel.twitch_login}:`, error);
                    }
                }
            }
            continue;
        }
        // Stream is live and either it's a new stream or the channel was previously offline
        if (channel.is_live) {
            await announceStreamEnd(client, channel);
        }
        const announcementChannel = await client.channels.fetch(channel.announcement_channel_id).catch((error) => {
            console.error(`❌ Impossible de récupérer le salon d'annonce Twitch ${channel.announcement_channel_id}:`, error);
            return null;
        });
        if (!announcementChannel || !announcementChannel.isTextBased()) continue;
        const announcement = await announcementChannel.send({
            content: `🔴 **${channel.twitch_display_name}** est en live ! \n||@everyone||`,
            embeds: [buildStreamEmbed(channel, stream)]
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
             SET is_live = TRUE, last_stream_id = $1, announcement_message_id = $2,
                 preview_updated_at = NOW(), scheduled_event_id = $3
             WHERE guild_id = $4 AND twitch_login = $5`,
            [stream.id, announcement.id, scheduledEventId, channel.guild_id, channel.twitch_login]
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
