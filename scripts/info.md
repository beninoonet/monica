# HOW TO USE A SCRIPT

deleteAllCommands.js: This script is used to delete all commands from the bot. To use it, run the following command in your terminal:

setup a **.env** with the following variables:

```
DISCORD_TOKEN=your_discord_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
```

GUILD_ID is optional, if you want to delete commands from a specific guild, you can set it. If you want to delete global commands, just leave it empty.
if you want to use the script, you can run the following command:

#### WITH GUILD_ID

```
node deleteCommands.js
```

#### WITHOUT GUILD_ID

```
node deleteAllCommands.js
```
