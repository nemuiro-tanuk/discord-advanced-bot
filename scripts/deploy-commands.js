require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');
const commandFolders = fs.readdirSync(commandsPath);

// すべてのコマンドを読み込み
for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  
  if (!fs.statSync(folderPath).isDirectory()) {
    continue;
  }

  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);

    if (command.data && command.execute) {
      commands.push(command.data.toJSON());
      console.log(`✓ Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠ Skipped ${file}: missing data or execute`);
    }
  }
}

// REST APIクライアントを作成
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// コマンドをデプロイ
(async () => {
  try {
    console.log(`\nStarted refreshing ${commands.length} application (/) commands.`);

    // グローバルコマンドとしてデプロイ
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log(`✓ Successfully reloaded ${data.length} application (/) commands globally.`);

    // 特定のギルドにデプロイする場合（開発用）
    if (process.env.DISCORD_GUILD_ID) {
      const guildData = await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.DISCORD_GUILD_ID
        ),
        { body: commands },
      );

      console.log(`✓ Successfully reloaded ${guildData.length} commands in guild ${process.env.DISCORD_GUILD_ID}.`);
    }

  } catch (error) {
    console.error('Error deploying commands:', error);
  }
})();
