![Monica](https://i.postimg.cc/W1L8WwmR/moniicaa.jpg)

# Monica

## Description

Monica is a personal discord bot project that helps me to manage my private server. She is based on my old **Hina** projet

> 🔄️ **Currently on developement**

Monica est mon projet de bot discord personnel qui m'aide à gérer mon serveur privé. Elle est basée sur mon ancien projet **Hina**.

> 🔄️ **Actuellement en développement**

## Features / Fonctionnalités

| Name              | Status                                                 | Status |
| ----------------- | ------------------------------------------------------ | ------ |
| /report           | Command to report a member on guild                    | ✅     |
| Join & Quit MSG   | Send a message to join & quit member on guild          | ✅     |
| Rss               | Check every 12 hours a RSS link to send with a webhook | ✅     |
| Music             | Play a music with spotify (but need to clean a code)   | ✅     |
| /reminder         | Command to send a message to user after x minutes      | ✅     |
| Database          | Connection to PostGres DB                              | ✅     |
| /tasklist         | command tasklist connect with a db                     | ✅     |
| /giveaway         | Giveaway avec inscription, stockage PostgreSQL et tirage automatique | ✅ |
| Webhook URL on db | Connect a webhook url to db                             | ❌     |

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

# Discord channel IDs (only for testing )
REPORT_CHANNEL=
WELCOME_CHANNEL=
LOG_CHANNEL=

# Database configuration
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# Twitch API (https://dev.twitch.tv/console)
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

# LAVALINK configuration
LAVALINK_PASSWORD=
LAVALINK_HOST=
LAVALINK_PORT=
```

after that, you can run the bot with the following command:

```
node .
```

### Annonces Twitch

Les administrateurs peuvent configurer les annonces avec :

- `/twitch add username channel` pour ajouter une chaîne et son salon d'annonce ;
- `/twitch remove username` pour retirer une chaîne ;
- `/twitch list` pour afficher les chaînes configurées ;
- `/twitch channel channel` pour changer le salon d'annonce de toutes les chaînes.

Le bot vérifie les chaînes configurées toutes les minutes et publie une annonce
au début et à la fin de chaque live. Un évènement externe Discord est créé pour
chaque nouveau live et activé immédiatement, puis sa date de fin est fixée et
l'évènement est marqué comme terminé lorsque le stream s'arrête.
Les chaînes, l'état du dernier live et l'évènement associé sont conservés dans
PostgreSQL. Le bot doit disposer de la permission **Gérer les évènements**.
Les variables `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET` sont nécessaires.

### Giveaways

La commande `/giveaway` ouvre un formulaire pour le gain, sa description, la durée
(`30m`, `2h`, `2d`, etc.), le nombre de gagnants et une image optionnelle. Le
giveaway est enregistré avec un identifiant dans PostgreSQL, puis publié avec un
bouton `Participer`. Les participations sont liées à cet identifiant et le bot
tire automatiquement les gagnants à l'expiration.
