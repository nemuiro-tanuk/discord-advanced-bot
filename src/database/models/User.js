const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  discriminator: {
    type: String,
  },
  avatar: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  economy: {
    balance: {
      type: Number,
      default: 1000,
    },
    bank: {
      type: Number,
      default: 0,
    },
    lastDaily: {
      type: Date,
    },
    lastWork: {
      type: Date,
    },
    inventory: [{
      itemId: String,
      quantity: Number,
      acquiredAt: Date,
    }],
  },
  stats: {
    commandsUsed: {
      type: Number,
      default: 0,
    },
    messagesCount: {
      type: Number,
      default: 0,
    },
    voiceTime: {
      type: Number,
      default: 0,
    },
  },
  moderation: {
    warnings: [{
      reason: String,
      moderatorId: String,
      timestamp: { type: Date, default: Date.now },
    }],
    mutes: [{
      reason: String,
      moderatorId: String,
      duration: Number,
      timestamp: { type: Date, default: Date.now },
    }],
    bans: [{
      reason: String,
      moderatorId: String,
      timestamp: { type: Date, default: Date.now },
    }],
  },
  aiChat: {
    conversationHistory: [{
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      timestamp: { type: Date, default: Date.now },
    }],
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
  },
  games: {
    genshin: {
      uid: String,
      region: String,
      lastUpdated: Date,
    },
    starrail: {
      uid: String,
      region: String,
      lastUpdated: Date,
    },
  },
  preferences: {
    language: {
      type: String,
      default: 'ja',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    dmsEnabled: {
      type: Boolean,
      default: true,
    },
  },
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
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 残高を更新するメソッド
userSchema.methods.updateBalance = function(amount) {
  this.economy.balance += amount;
  if (this.economy.balance < 0) {
    this.economy.balance = 0;
  }
  return this.save();
};

// 銀行残高を更新するメソッド
userSchema.methods.updateBank = function(amount) {
  this.economy.bank += amount;
  if (this.economy.bank < 0) {
    this.economy.bank = 0;
  }
  return this.save();
};

// 警告を追加するメソッド
userSchema.methods.addWarning = function(reason, moderatorId) {
  this.moderation.warnings.push({
    reason,
    moderatorId,
    timestamp: new Date(),
  });
  return this.save();
};

// AI会話履歴を追加するメソッド
userSchema.methods.addChatHistory = function(role, content) {
  this.aiChat.conversationHistory.push({
    role,
    content,
    timestamp: new Date(),
  });
  
  // 履歴が10件を超えたら古いものを削除
  if (this.aiChat.conversationHistory.length > 10) {
    this.aiChat.conversationHistory = this.aiChat.conversationHistory.slice(-10);
  }
  
  return this.save();
};

// インデックス
userSchema.index({ userId: 1 });
userSchema.index({ 'economy.balance': -1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
