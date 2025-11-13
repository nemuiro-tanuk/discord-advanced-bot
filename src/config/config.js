require('dotenv').config();

module.exports = {
  // Discord設定
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
  },

  // Lavalink設定
  lavalink: {
    host: process.env.LAVALINK_HOST || 'localhost',
    port: parseInt(process.env.LAVALINK_PORT) || 2333,
    password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
    secure: process.env.LAVALINK_SECURE === 'true',
  },

  // データベース設定
  database: {
    uri: process.env.COSMOS_MONGO_URI,
    name: process.env.DB_NAME || 'discord_bot',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // VOICEVOX (su-shiki) 設定
  tts: {
    apiKey: process.env.SU_SHIKI_API_KEY,
    baseUrl: process.env.SU_SHIKI_BASE_URL || 'https://api.su-shiki.com/v2/voicevox',
    cacheTTL: parseInt(process.env.TTS_CACHE_TTL) || 86400,
    cacheDir: process.env.VOICE_CACHE_DIR || './cache/voice',
  },

  // Gemini AI設定
  ai: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    monthlyBudget: parseInt(process.env.GEMINI_MONTHLY_BUDGET) || 3000,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1000,
  },

  // 天気API設定
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    baseUrl: process.env.WEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5',
  },

  // ニュースAPI設定
  news: {
    apiKey: process.env.NEWS_API_KEY,
    baseUrl: process.env.NEWS_API_BASE_URL || 'https://newsapi.org/v2',
  },

  // Vercel認証設定
  auth: {
    webhookSecret: process.env.VERCEL_WEBHOOK_SECRET,
    apiUrl: process.env.VERCEL_API_URL,
    recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,
  },

  // Redis設定
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
  },

  // ゲームAPI設定
  game: {
    enkaBaseUrl: process.env.ENKA_API_BASE_URL || 'https://enka.network/api',
    mihomoBaseUrl: process.env.MIHOMO_API_BASE_URL || 'https://api.mihomo.me',
  },

  // アプリケーション設定
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
    logFilePath: process.env.LOG_FILE_PATH || './logs',
  },

  // 監視設定
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT) || 3001,
  },

  // レート制限設定
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  },

  // キャッシュ設定
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    voiceDir: process.env.VOICE_CACHE_DIR || './cache/voice',
    imageDir: process.env.IMAGE_CACHE_DIR || './cache/images',
  },

  // 経済システム設定
  economy: {
    startingBalance: parseInt(process.env.ECONOMY_STARTING_BALANCE) || 1000,
    dailyBonus: parseInt(process.env.ECONOMY_DAILY_BONUS) || 100,
    maxBalance: parseInt(process.env.ECONOMY_MAX_BALANCE) || 999999999,
  },

  // スケジューラ設定
  scheduler: {
    timezone: process.env.SCHEDULER_TIMEZONE || 'Asia/Tokyo',
    weatherSchedule: process.env.WEATHER_POST_SCHEDULE || '0 0 7,19 * * *',
    newsSchedule: process.env.NEWS_POST_SCHEDULE || '0 0 8,20 * * *',
  },

  // ボイスチャンネル設定
  voice: {
    idleTimeout: parseInt(process.env.VC_IDLE_TIMEOUT) || 10800, // 3時間
    afkChannelName: process.env.VC_AFK_CHANNEL_NAME || 'AFK',
  },

  // セキュリティ設定
  security: {
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
  },

  // 機能フラグ
  features: {
    music: process.env.ENABLE_MUSIC !== 'false',
    tts: process.env.ENABLE_TTS !== 'false',
    aiChat: process.env.ENABLE_AI_CHAT !== 'false',
    economy: process.env.ENABLE_ECONOMY !== 'false',
    games: process.env.ENABLE_GAMES !== 'false',
    translation: process.env.ENABLE_TRANSLATION !== 'false',
    moderation: process.env.ENABLE_MODERATION !== 'false',
    tickets: process.env.ENABLE_TICKETS !== 'false',
    giveaways: process.env.ENABLE_GIVEAWAYS !== 'false',
  },
};
