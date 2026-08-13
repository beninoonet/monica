![Monica](https://i.postimg.cc/W1L8WwmR/moniicaa.jpg)

# Monica

## Description

Monica is a personal discord bot project that helps me to manage my private server. She is based on my old **Hina** projet

> 🔄️ **Currently on developement**

Monica est mon projet de bot discord personnel qui m'aide à gérer mon serveur privé. Elle est basée sur mon ancien projet **Hina**.

> 🔄️ **Actuellement en développement**

## Features / Fonctionnalités

| Name            | Status                                                   | Status |
| --------------- | -------------------------------------------------------- | ------ |
| Report          | Command to report a member on guild                      | ✅     |
| Join & Quit MSG | Send a message to join & quit member on guild            | ✅     |
| RSS             | Check every 30 minutes a RSS link to send with a webhook | ✅     |
| Music           | Play a music with spotify (but need to clean a code)     | ✅     |
| Reminder        | Command to send a message to user after x times          | ❌     |
| Database        | Connection to PostGres DB                                | ✅     |

## Installation

```
git clone https://github.com/beninoonet/monica.git
npm install
```

after that, you need to create a `.env` file with the following content:

```
# Discord bot configuration
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

# Webhook URLs
MANGA_WEBHOOK_URL=
APPLI_WEBHOOK_URL=

# API keys
RSS2JSON_API_KEY=

# Discord channel IDs
REPORT_CHANNEL=
WELCOME_CHANNEL=
LOG_CHANNEL=

# Database configuration
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# LAVALINK configuration
LAVALINK_PASSWORD=
LAVALINK_HOST=
LAVALINK_PORT=
```

after that, you can run the bot with the following command:

```
node .
```
