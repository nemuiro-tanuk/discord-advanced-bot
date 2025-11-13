require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config/config');
const logger = require('./utils/logger');
const database = require('./database/connection');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const { startIdleCheck } = require('./events/voiceStateUpdate');

// クライアントを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
});

// ハンドラを初期化
client.commandHandler = new CommandHandler(client);
client.eventHandler = new EventHandler(client);

// モジュールコレクション
client.modules = new Collection();

// モジュールをインポート
const MusicManager = require('./modules/music/MusicManager');
const TTSManager = require('./modules/tts/TTSManager');
const AIManager = require('./modules/ai/AIManager');
const EconomyManager = require('./modules/economy/EconomyManager');

// モジュールを初期化
client.modules.set('music', new MusicManager(client));
client.modules.set('tts', new TTSManager(client));
client.modules.set('ai', new AIManager(client));
client.modules.set('economy', new EconomyManager(client));

/**
 * BOTを初期化
 */
async function initialize() {
  try {
    logger.info('Initializing bot...');

    // データベースに接続
    await database.connect();
    logger.info('Database connected');

    // コマンドを読み込み
    await client.commandHandler.loadCommands();
    logger.info('Commands loaded');

    // イベントを読み込み
    await client.eventHandler.loadEvents();
    logger.info('Events loaded');

    // Discordにログイン
    await client.login(config.discord.token);
    logger.info('Logged in to Discord');

    // VC監視を開始
    startIdleCheck(client);

    // ログローテーション（毎日実行）
    setInterval(() => {
      logger.rotateOldLogs(30); // 30日以上古いログを削除
    }, 24 * 60 * 60 * 1000);

  } catch (error) {
    logger.error('Failed to initialize bot:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

/**
 * BOTをシャットダウン
 */
async function shutdown() {
  try {
    logger.info('Shutting down bot...');

    // Discordから切断
    client.destroy();
    logger.info('Disconnected from Discord');

    // データベース接続を切断
    await database.disconnect();
    logger.info('Database disconnected');

    logger.info('Bot shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// プロセス終了時のハンドラ
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 未処理のエラーをキャッチ
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', {
    error: error.message,
    stack: error.stack,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', {
    error: error.message,
    stack: error.stack,
  });
  shutdown();
});

// BOTを起動
initialize();

module.exports = client;
