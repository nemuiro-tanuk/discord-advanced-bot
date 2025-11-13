const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  /**
   * コマンドを読み込む
   */
  async loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      
      if (!fs.statSync(folderPath).isDirectory()) {
        continue;
      }

      const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        
        try {
          const command = require(filePath);

          if (!command.data || !command.execute) {
            logger.warn(`Command at ${filePath} is missing required properties`);
            continue;
          }

          this.commands.set(command.data.name, command);
          logger.debug(`Loaded command: ${command.data.name} from ${folder}/${file}`);
        } catch (error) {
          logger.error(`Failed to load command from ${filePath}:`, { error: error.message });
        }
      }
    }

    logger.info(`Loaded ${this.commands.size} commands`);
    return this.commands;
  }

  /**
   * コマンドを実行
   */
  async executeCommand(interaction) {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Command not found: ${interaction.commandName}`);
      return;
    }

    try {
      // クールダウンチェック
      if (!this.checkCooldown(interaction, command)) {
        return;
      }

      // 権限チェック
      if (command.permissions && !interaction.member.permissions.has(command.permissions)) {
        await interaction.reply({
          content: '❌ このコマンドを実行する権限がありません。',
          ephemeral: true,
        });
        return;
      }

      // ギルド限定チェック
      if (command.guildOnly && !interaction.guild) {
        await interaction.reply({
          content: '❌ このコマンドはサーバー内でのみ使用できます。',
          ephemeral: true,
        });
        return;
      }

      // コマンド実行
      logger.info(`Executing command: ${interaction.commandName}`, {
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
      });

      await command.execute(interaction, this.client);

      // クールダウン設定
      this.setCooldown(interaction, command);

    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
      });

      const errorMessage = {
        content: '❌ コマンドの実行中にエラーが発生しました。',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  /**
   * クールダウンをチェック
   */
  checkCooldown(interaction, command) {
    if (!command.cooldown) {
      return true;
    }

    const now = Date.now();
    const cooldownAmount = command.cooldown * 1000;

    if (!this.cooldowns.has(command.data.name)) {
      this.cooldowns.set(command.data.name, new Collection());
    }

    const timestamps = this.cooldowns.get(command.data.name);
    const userCooldown = timestamps.get(interaction.user.id);

    if (userCooldown) {
      const expirationTime = userCooldown + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        interaction.reply({
          content: `⏱️ このコマンドは ${timeLeft.toFixed(1)} 秒後に再度使用できます。`,
          ephemeral: true,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * クールダウンを設定
   */
  setCooldown(interaction, command) {
    if (!command.cooldown) {
      return;
    }

    const timestamps = this.cooldowns.get(command.data.name);
    timestamps.set(interaction.user.id, Date.now());

    setTimeout(() => {
      timestamps.delete(interaction.user.id);
    }, command.cooldown * 1000);
  }

  /**
   * コマンドをリロード
   */
  async reloadCommand(commandName) {
    const command = this.commands.get(commandName);

    if (!command) {
      throw new Error(`Command ${commandName} not found`);
    }

    // キャッシュをクリア
    const commandPath = require.resolve(`../commands/${command.category}/${commandName}.js`);
    delete require.cache[commandPath];

    // 再読み込み
    const newCommand = require(commandPath);
    this.commands.set(commandName, newCommand);

    logger.info(`Reloaded command: ${commandName}`);
    return newCommand;
  }

  /**
   * すべてのコマンドをリロード
   */
  async reloadAllCommands() {
    // キャッシュをクリア
    this.commands.forEach((command, name) => {
      const commandPath = require.resolve(`../commands/${command.category}/${name}.js`);
      delete require.cache[commandPath];
    });

    this.commands.clear();
    await this.loadCommands();

    logger.info('Reloaded all commands');
  }

  /**
   * コマンドリストを取得
   */
  getCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * カテゴリ別にコマンドを取得
   */
  getCommandsByCategory() {
    const categories = {};

    this.commands.forEach(command => {
      const category = command.category || 'その他';
      
      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push(command);
    });

    return categories;
  }
}

module.exports = CommandHandler;
