const { Manager } = require('erela.js');
const logger = require('../../utils/logger');
const config = require('../../config/config');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.manager = null;
    this.queues = new Map();
  }

  /**
   * Lavalinkマネージャーを初期化
   */
  initialize() {
    this.manager = new Manager({
      nodes: [{
        host: config.lavalink.host,
        port: config.lavalink.port,
        password: config.lavalink.password,
        secure: config.lavalink.secure,
      }],
      send: (id, payload) => {
        const guild = this.client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
      },
    });

    // イベントリスナーを設定
    this.setupEventListeners();

    // Lavalinkに接続
    this.manager.init(this.client.user.id);
    logger.info('Music manager initialized');

    return this.manager;
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // ノード接続イベント
    this.manager.on('nodeConnect', (node) => {
      logger.info(`Lavalink node connected: ${node.options.identifier}`);
    });

    // ノード切断イベント
    this.manager.on('nodeDisconnect', (node, reason) => {
      logger.warn(`Lavalink node disconnected: ${node.options.identifier}`, { reason });
    });

    // ノードエラーイベント
    this.manager.on('nodeError', (node, error) => {
      logger.error(`Lavalink node error: ${node.options.identifier}`, {
        error: error.message,
      });
    });

    // トラック開始イベント
    this.manager.on('trackStart', (player, track) => {
      logger.debug(`Track started: ${track.title} in guild ${player.guild}`);
      
      const channel = this.client.channels.cache.get(player.textChannel);
      if (channel) {
        channel.send(`🎵 再生中: **${track.title}** by ${track.author}`);
      }
    });

    // トラック終了イベント
    this.manager.on('trackEnd', (player, track) => {
      logger.debug(`Track ended: ${track.title} in guild ${player.guild}`);
    });

    // トラックエラーイベント
    this.manager.on('trackError', (player, track, error) => {
      logger.error(`Track error: ${track.title}`, { error: error.message });
      
      const channel = this.client.channels.cache.get(player.textChannel);
      if (channel) {
        channel.send(`❌ トラックの再生中にエラーが発生しました: ${track.title}`);
      }
    });

    // トラックスタックイベント
    this.manager.on('trackStuck', (player, track, threshold) => {
      logger.warn(`Track stuck: ${track.title}`, { threshold });
      
      const channel = this.client.channels.cache.get(player.textChannel);
      if (channel) {
        channel.send(`⚠️ トラックがスタックしました。スキップします...`);
      }
      
      player.stop();
    });

    // キュー終了イベント
    this.manager.on('queueEnd', (player) => {
      logger.debug(`Queue ended in guild ${player.guild}`);
      
      const channel = this.client.channels.cache.get(player.textChannel);
      if (channel) {
        channel.send('✅ キューが終了しました。');
      }

      // 一定時間後に切断
      setTimeout(() => {
        if (player.queue.size === 0 && !player.playing) {
          player.destroy();
          if (channel) {
            channel.send('👋 ボイスチャンネルから退出しました。');
          }
        }
      }, 300000); // 5分
    });
  }

  /**
   * プレイヤーを作成または取得
   */
  getPlayer(guildId, voiceChannelId, textChannelId) {
    let player = this.manager.players.get(guildId);

    if (!player) {
      player = this.manager.create({
        guild: guildId,
        voiceChannel: voiceChannelId,
        textChannel: textChannelId,
        selfDeafen: true,
      });
    }

    return player;
  }

  /**
   * トラックを検索
   */
  async search(query, requester) {
    try {
      // URLかどうかを判定
      const isUrl = /^https?:\/\//.test(query);
      const searchQuery = isUrl ? query : `ytsearch:${query}`;

      const result = await this.manager.search(searchQuery, requester);

      if (result.loadType === 'NO_MATCHES') {
        return { success: false, message: '検索結果が見つかりませんでした。' };
      }

      if (result.loadType === 'LOAD_FAILED') {
        return { success: false, message: 'トラックの読み込みに失敗しました。' };
      }

      return { success: true, result };

    } catch (error) {
      logger.error('Failed to search track:', { error: error.message, query });
      return { success: false, message: '検索中にエラーが発生しました。' };
    }
  }

  /**
   * トラックを再生
   */
  async play(player, track) {
    try {
      player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      }

      return { success: true };

    } catch (error) {
      logger.error('Failed to play track:', { error: error.message });
      return { success: false, message: '再生中にエラーが発生しました。' };
    }
  }

  /**
   * 再生を一時停止
   */
  pause(player) {
    if (!player.playing) {
      return { success: false, message: '現在再生中ではありません。' };
    }

    player.pause(true);
    return { success: true };
  }

  /**
   * 再生を再開
   */
  resume(player) {
    if (!player.paused) {
      return { success: false, message: '一時停止中ではありません。' };
    }

    player.pause(false);
    return { success: true };
  }

  /**
   * トラックをスキップ
   */
  skip(player) {
    if (!player.queue.current) {
      return { success: false, message: '再生中のトラックがありません。' };
    }

    player.stop();
    return { success: true };
  }

  /**
   * 再生を停止してキューをクリア
   */
  stop(player) {
    player.queue.clear();
    player.stop();
    return { success: true };
  }

  /**
   * ボリュームを設定
   */
  setVolume(player, volume) {
    if (volume < 0 || volume > 200) {
      return { success: false, message: 'ボリュームは0〜200の範囲で指定してください。' };
    }

    player.setVolume(volume);
    return { success: true };
  }

  /**
   * シークする
   */
  seek(player, position) {
    if (!player.queue.current) {
      return { success: false, message: '再生中のトラックがありません。' };
    }

    if (position < 0 || position > player.queue.current.duration) {
      return { success: false, message: '無効な位置です。' };
    }

    player.seek(position);
    return { success: true };
  }

  /**
   * リピートモードを設定
   */
  setRepeat(player, mode) {
    // mode: 'none', 'track', 'queue'
    const modes = {
      none: 0,
      track: 1,
      queue: 2,
    };

    if (!modes.hasOwnProperty(mode)) {
      return { success: false, message: '無効なリピートモードです。' };
    }

    player.setTrackRepeat(mode === 'track');
    player.setQueueRepeat(mode === 'queue');

    return { success: true };
  }

  /**
   * キューをシャッフル
   */
  shuffle(player) {
    if (player.queue.size < 2) {
      return { success: false, message: 'キューに十分なトラックがありません。' };
    }

    player.queue.shuffle();
    return { success: true };
  }

  /**
   * プレイヤーを破棄
   */
  destroyPlayer(guildId) {
    const player = this.manager.players.get(guildId);

    if (player) {
      player.destroy();
      return { success: true };
    }

    return { success: false, message: 'プレイヤーが見つかりません。' };
  }

  /**
   * 時間をフォーマット
   */
  formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));

    return parts.join(':');
  }
}

module.exports = MusicManager;
