const logger = require('../utils/logger');
const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Bot logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);

    // ステータスを設定
    client.user.setPresence({
      activities: [{
        name: '/help でコマンドを確認',
        type: ActivityType.Playing,
      }],
      status: 'online',
    });

    // 定期的にステータスを更新
    setInterval(() => {
      const statuses = [
        { name: '/help でコマンドを確認', type: ActivityType.Playing },
        { name: `${client.guilds.cache.size} サーバーで稼働中`, type: ActivityType.Watching },
        { name: '音楽を再生中 🎵', type: ActivityType.Listening },
      ];

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      client.user.setPresence({
        activities: [status],
        status: 'online',
      });
    }, 300000); // 5分ごと

    // 音楽マネージャーを初期化
    const musicManager = client.modules.get('music');
    if (musicManager) {
      musicManager.initialize();
    }

    logger.info('Bot is ready!');
  },
};
