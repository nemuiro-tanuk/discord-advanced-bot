module.exports = {
  // カラー定義
  COLORS: {
    PRIMARY: 0x5865F2,
    SUCCESS: 0x57F287,
    WARNING: 0xFEE75C,
    ERROR: 0xED4245,
    INFO: 0x5865F2,
  },

  // 権限レベル
  PERMISSION_LEVELS: {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
    OWNER: 3,
  },

  // エラーメッセージ
  ERRORS: {
    NO_PERMISSION: '❌ この操作を実行する権限がありません。',
    INVALID_ARGS: '❌ 引数が無効です。',
    NOT_IN_VOICE: '❌ ボイスチャンネルに参加してください。',
    BOT_NOT_IN_VOICE: '❌ BOTがボイスチャンネルに参加していません。',
    SAME_VOICE_CHANNEL: '❌ BOTと同じボイスチャンネルに参加してください。',
    NO_QUEUE: '❌ 再生キューが空です。',
    DATABASE_ERROR: '❌ データベースエラーが発生しました。',
    API_ERROR: '❌ 外部APIエラーが発生しました。',
    RATE_LIMIT: '❌ レート制限に達しました。しばらく待ってから再試行してください。',
    INSUFFICIENT_BALANCE: '❌ 残高が不足しています。',
  },

  // 成功メッセージ
  SUCCESS: {
    COMMAND_EXECUTED: '✅ コマンドが正常に実行されました。',
    SETTINGS_UPDATED: '✅ 設定が更新されました。',
    USER_WARNED: '✅ ユーザーに警告を発行しました。',
    USER_MUTED: '✅ ユーザーをミュートしました。',
    USER_BANNED: '✅ ユーザーをBANしました。',
    TICKET_CREATED: '✅ チケットが作成されました。',
    GIVEAWAY_CREATED: '✅ ギブアウェイが作成されました。',
  },

  // 音楽再生関連
  MUSIC: {
    MAX_QUEUE_SIZE: 100,
    DEFAULT_VOLUME: 50,
    MAX_VOLUME: 200,
    SEARCH_LIMIT: 10,
  },

  // TTS関連
  TTS: {
    MAX_TEXT_LENGTH: 200,
    DEFAULT_SPEAKER: 1,
    DEFAULT_SPEED: 1.0,
    DEFAULT_PITCH: 0,
    QUEUE_LIMIT: 10,
  },

  // AI関連
  AI: {
    MAX_HISTORY_LENGTH: 10,
    MAX_MESSAGE_LENGTH: 2000,
    COST_PER_1K_TOKENS: 0.5, // 仮の値
  },

  // 経済システム関連
  ECONOMY: {
    CURRENCY_SYMBOL: '💰',
    WORK_COOLDOWN: 3600000, // 1時間
    DAILY_COOLDOWN: 86400000, // 24時間
    MIN_WORK_REWARD: 50,
    MAX_WORK_REWARD: 200,
    TRANSFER_FEE: 0.05, // 5%
    STOCK_TRADE_FEE: 0.01, // 1%
  },

  // モデレーション関連
  MODERATION: {
    MAX_WARNINGS: 3,
    MUTE_DURATION: 3600000, // 1時間
    AUTO_BAN_THRESHOLD: 5,
  },

  // チケット関連
  TICKET: {
    MAX_OPEN_TICKETS: 5,
    TICKET_CATEGORY_NAME: 'チケット',
  },

  // ギブアウェイ関連
  GIVEAWAY: {
    MIN_DURATION: 60000, // 1分
    MAX_DURATION: 2592000000, // 30日
    MAX_WINNERS: 20,
  },

  // ボイスチャンネル関連
  VOICE: {
    TEMP_VC_PREFIX: '🔊',
    MAX_TEMP_VCS: 50,
    IDLE_CHECK_INTERVAL: 300000, // 5分
  },

  // レート制限
  RATE_LIMITS: {
    COMMANDS_PER_MINUTE: 10,
    API_CALLS_PER_MINUTE: 30,
    TTS_PER_MINUTE: 5,
  },

  // キャッシュTTL
  CACHE_TTL: {
    GUILD_SETTINGS: 3600, // 1時間
    USER_DATA: 1800, // 30分
    VOICE_FILE: 86400, // 24時間
    IMAGE_FILE: 43200, // 12時間
    API_RESPONSE: 300, // 5分
  },

  // 画像生成関連
  IMAGE: {
    MAX_WIDTH: 2000,
    MAX_HEIGHT: 2000,
    DEFAULT_FORMAT: 'png',
    QUALITY: 90,
  },

  // スケジューラ関連
  SCHEDULER: {
    WEATHER_CHANNELS: [],
    NEWS_CHANNELS: [],
  },

  // ゲーム関連
  GAME: {
    GENSHIN_REGIONS: ['asia', 'eu', 'na', 'cht'],
    STARRAIL_REGIONS: ['asia', 'eu', 'na', 'cht'],
  },

  // 翻訳関連
  TRANSLATION: {
    SUPPORTED_LANGUAGES: ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'ru'],
    DEFAULT_TARGET_LANG: 'ja',
  },

  // ログレベル
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },

  // イベント名
  EVENTS: {
    READY: 'ready',
    INTERACTION_CREATE: 'interactionCreate',
    MESSAGE_CREATE: 'messageCreate',
    GUILD_MEMBER_ADD: 'guildMemberAdd',
    GUILD_MEMBER_REMOVE: 'guildMemberRemove',
    VOICE_STATE_UPDATE: 'voiceStateUpdate',
  },

  // インタラクションタイプ
  INTERACTION_TYPES: {
    COMMAND: 'COMMAND',
    BUTTON: 'BUTTON',
    SELECT_MENU: 'SELECT_MENU',
    MODAL: 'MODAL',
  },
};
