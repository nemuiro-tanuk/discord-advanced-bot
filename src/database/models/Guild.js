const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  settings: {
    prefix: {
      type: String,
      default: '!',
    },
    language: {
      type: String,
      default: 'ja',
    },
    timezone: {
      type: String,
      default: 'Asia/Tokyo',
    },
  },
  features: {
    music: {
      enabled: { type: Boolean, default: true },
      defaultVolume: { type: Number, default: 50 },
      maxQueueSize: { type: Number, default: 100 },
    },
    tts: {
      enabled: { type: Boolean, default: true },
      defaultSpeaker: { type: Number, default: 1 },
      defaultSpeed: { type: Number, default: 1.0 },
      defaultPitch: { type: Number, default: 0 },
      enabledChannels: [{ type: String }],
    },
    aiChat: {
      enabled: { type: Boolean, default: true },
      mode: { type: String, enum: ['high', 'low'], default: 'high' },
      enabledChannels: [{ type: String }],
    },
    economy: {
      enabled: { type: Boolean, default: true },
      currencyName: { type: String, default: 'コイン' },
      currencySymbol: { type: String, default: '💰' },
    },
    moderation: {
      enabled: { type: Boolean, default: true },
      autoModEnabled: { type: Boolean, default: false },
      logChannelId: { type: String },
      muteRoleId: { type: String },
    },
    tickets: {
      enabled: { type: Boolean, default: true },
      categoryId: { type: String },
      supportRoleId: { type: String },
    },
    giveaways: {
      enabled: { type: Boolean, default: true },
    },
    translation: {
      enabled: { type: Boolean, default: true },
      autoTranslate: { type: Boolean, default: false },
    },
  },
  channels: {
    welcome: { type: String },
    goodbye: { type: String },
    logs: { type: String },
    modLogs: { type: String },
    weather: { type: String },
    news: { type: String },
    afk: { type: String },
  },
  roles: {
    verified: { type: String },
    unverified: { type: String },
    muted: { type: String },
    moderator: { type: String },
    admin: { type: String },
  },
  scheduler: {
    weather: {
      enabled: { type: Boolean, default: false },
      schedule: { type: String, default: '0 0 7,19 * * *' },
      location: { type: String, default: 'Tokyo' },
    },
    news: {
      enabled: { type: Boolean, default: false },
      schedule: { type: String, default: '0 0 8,20 * * *' },
      category: { type: String, default: 'general' },
    },
  },
  tempVoiceChannels: [{
    channelId: { type: String },
    ownerId: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  recruitmentTemplates: [{
    name: { type: String },
    description: { type: String },
    maxParticipants: { type: Number, default: 4 },
    fields: [{ name: String, value: String }],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 更新時にupdatedAtを自動更新
guildSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// インデックス
guildSchema.index({ guildId: 1 });
guildSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Guild', guildSchema);
