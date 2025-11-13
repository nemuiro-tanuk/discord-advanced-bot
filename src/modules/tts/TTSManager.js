const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
const logger = require('../../utils/logger');
const config = require('../../config/config');

class TTSManager {
  constructor(client) {
    this.client = client;
    this.connections = new Map();
    this.players = new Map();
    this.queues = new Map();
    this.cacheDir = config.cache.voiceDir;

    // キャッシュディレクトリを作成
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * テキストを音声に変換
   */
  async synthesize(text, speaker = 1, speed = 1.0, pitch = 0) {
    try {
      // キャッシュキーを生成
      const cacheKey = this.generateCacheKey(text, speaker, speed, pitch);
      const cachePath = path.join(this.cacheDir, `${cacheKey}.wav`);

      // キャッシュが存在する場合は返す
      if (fs.existsSync(cachePath)) {
        logger.debug('Using cached TTS audio', { cacheKey });
        return { success: true, audioPath: cachePath, cached: true };
      }

      // su-shiki APIを使用して音声を生成
      const audioQuery = await this.createAudioQuery(text, speaker);
      const audio = await this.synthesizeAudio(audioQuery, speaker, speed, pitch);

      // キャッシュに保存
      fs.writeFileSync(cachePath, audio);
      logger.debug('Generated and cached TTS audio', { cacheKey });

      return { success: true, audioPath: cachePath, cached: false };

    } catch (error) {
      logger.error('Failed to synthesize TTS:', {
        error: error.message,
        text: text.substring(0, 50),
      });
      return { success: false, message: '音声生成に失敗しました。' };
    }
  }

  /**
   * AudioQueryを作成
   */
  async createAudioQuery(text, speaker) {
    const response = await axios.post(
      `${config.tts.baseUrl}/audio_query`,
      null,
      {
        params: {
          text,
          speaker,
        },
        headers: {
          'x-api-key': config.tts.apiKey,
        },
      }
    );

    return response.data;
  }

  /**
   * 音声を合成
   */
  async synthesizeAudio(audioQuery, speaker, speed, pitch) {
    // パラメータを調整
    audioQuery.speedScale = speed;
    audioQuery.pitchScale = pitch;

    const response = await axios.post(
      `${config.tts.baseUrl}/synthesis`,
      audioQuery,
      {
        params: { speaker },
        headers: {
          'x-api-key': config.tts.apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * ボイスチャンネルに接続
   */
  joinChannel(guildId, channelId) {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      const channel = guild.channels.cache.get(channelId);

      if (!channel) {
        return { success: false, message: 'チャンネルが見つかりません。' };
      }

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      this.connections.set(guildId, connection);

      // 接続状態を監視
      connection.on(VoiceConnectionStatus.Disconnected, () => {
        logger.info(`TTS disconnected from guild ${guildId}`);
        this.cleanup(guildId);
      });

      connection.on(VoiceConnectionStatus.Destroyed, () => {
        logger.info(`TTS connection destroyed for guild ${guildId}`);
        this.cleanup(guildId);
      });

      // プレイヤーを作成
      const player = createAudioPlayer();
      this.players.set(guildId, player);
      connection.subscribe(player);

      // プレイヤーイベント
      player.on(AudioPlayerStatus.Idle, () => {
        this.processQueue(guildId);
      });

      player.on('error', (error) => {
        logger.error('TTS player error:', { error: error.message, guildId });
        this.processQueue(guildId);
      });

      logger.info(`TTS joined channel in guild ${guildId}`);
      return { success: true, connection };

    } catch (error) {
      logger.error('Failed to join voice channel:', {
        error: error.message,
        guildId,
        channelId,
      });
      return { success: false, message: 'ボイスチャンネルへの接続に失敗しました。' };
    }
  }

  /**
   * ボイスチャンネルから退出
   */
  leaveChannel(guildId) {
    const connection = this.connections.get(guildId);

    if (connection) {
      connection.destroy();
      this.cleanup(guildId);
      logger.info(`TTS left channel in guild ${guildId}`);
      return { success: true };
    }

    return { success: false, message: 'ボイスチャンネルに接続していません。' };
  }

  /**
   * テキストを読み上げ
   */
  async speak(guildId, text, options = {}) {
    const { speaker = 1, speed = 1.0, pitch = 0 } = options;

    // 音声を生成
    const result = await this.synthesize(text, speaker, speed, pitch);

    if (!result.success) {
      return result;
    }

    // キューに追加
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, []);
    }

    this.queues.get(guildId).push(result.audioPath);

    // プレイヤーがアイドル状態なら再生開始
    const player = this.players.get(guildId);
    if (player && player.state.status === AudioPlayerStatus.Idle) {
      this.processQueue(guildId);
    }

    return { success: true };
  }

  /**
   * キューを処理
   */
  processQueue(guildId) {
    const queue = this.queues.get(guildId);
    const player = this.players.get(guildId);

    if (!queue || queue.length === 0 || !player) {
      return;
    }

    const audioPath = queue.shift();

    try {
      const resource = createAudioResource(audioPath);
      player.play(resource);
      logger.debug('Playing TTS audio', { guildId, audioPath });
    } catch (error) {
      logger.error('Failed to play TTS audio:', {
        error: error.message,
        guildId,
        audioPath,
      });
      this.processQueue(guildId);
    }
  }

  /**
   * キャッシュキーを生成
   */
  generateCacheKey(text, speaker, speed, pitch) {
    const data = `${text}-${speaker}-${speed}-${pitch}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 古いキャッシュを削除
   */
  clearOldCache(maxAge = 86400000) {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();

      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          logger.debug('Deleted old TTS cache', { file });
        }
      });

      logger.info('Cleared old TTS cache');
    } catch (error) {
      logger.error('Failed to clear TTS cache:', { error: error.message });
    }
  }

  /**
   * クリーンアップ
   */
  cleanup(guildId) {
    this.connections.delete(guildId);
    this.players.delete(guildId);
    this.queues.delete(guildId);
  }

  /**
   * 話者一覧を取得
   */
  async getSpeakers() {
    try {
      const response = await axios.get(`${config.tts.baseUrl}/speakers`, {
        headers: {
          'x-api-key': config.tts.apiKey,
        },
      });

      return { success: true, speakers: response.data };
    } catch (error) {
      logger.error('Failed to get speakers:', { error: error.message });
      return { success: false, message: '話者一覧の取得に失敗しました。' };
    }
  }
}

module.exports = TTSManager;
