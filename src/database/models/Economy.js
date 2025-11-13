const mongoose = require('mongoose');

// 会社スキーマ
const companySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  ownerId: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  stock: {
    symbol: {
      type: String,
      unique: true,
      sparse: true,
    },
    totalShares: {
      type: Number,
      default: 1000,
    },
    availableShares: {
      type: Number,
      default: 1000,
    },
    currentPrice: {
      type: Number,
      default: 100,
    },
    priceHistory: [{
      price: Number,
      timestamp: { type: Date, default: Date.now },
    }],
  },
  shareholders: [{
    userId: String,
    shares: Number,
    purchasePrice: Number,
    purchasedAt: { type: Date, default: Date.now },
  }],
  financials: {
    revenue: {
      type: Number,
      default: 0,
    },
    expenses: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    assets: {
      type: Number,
      default: 0,
    },
  },
  events: [{
    type: { type: String },
    description: String,
    impact: Number,
    timestamp: { type: Date, default: Date.now },
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

// 株価を更新するメソッド
companySchema.methods.updateStockPrice = function(newPrice) {
  this.stock.currentPrice = newPrice;
  this.stock.priceHistory.push({
    price: newPrice,
    timestamp: new Date(),
  });
  
  // 履歴が100件を超えたら古いものを削除
  if (this.stock.priceHistory.length > 100) {
    this.stock.priceHistory = this.stock.priceHistory.slice(-100);
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

// 株式を購入するメソッド
companySchema.methods.buyShares = function(userId, shares, price) {
  if (this.stock.availableShares < shares) {
    throw new Error('利用可能な株式が不足しています');
  }
  
  this.stock.availableShares -= shares;
  
  const existingShareholder = this.shareholders.find(s => s.userId === userId);
  if (existingShareholder) {
    existingShareholder.shares += shares;
  } else {
    this.shareholders.push({
      userId,
      shares,
      purchasePrice: price,
      purchasedAt: new Date(),
    });
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

// 株式を売却するメソッド
companySchema.methods.sellShares = function(userId, shares) {
  const shareholder = this.shareholders.find(s => s.userId === userId);
  if (!shareholder || shareholder.shares < shares) {
    throw new Error('売却する株式が不足しています');
  }
  
  shareholder.shares -= shares;
  this.stock.availableShares += shares;
  
  if (shareholder.shares === 0) {
    this.shareholders = this.shareholders.filter(s => s.userId !== userId);
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

companySchema.index({ guildId: 1, companyId: 1 });
companySchema.index({ 'stock.symbol': 1 });

const Company = mongoose.model('Company', companySchema);

// トランザクションスキーマ
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['transfer', 'work', 'daily', 'stock_buy', 'stock_sell', 'fx_trade', 'loan', 'payment'],
    required: true,
  },
  fromUserId: {
    type: String,
  },
  toUserId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  fee: {
    type: Number,
    default: 0,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

transactionSchema.index({ guildId: 1, timestamp: -1 });
transactionSchema.index({ fromUserId: 1, timestamp: -1 });
transactionSchema.index({ toUserId: 1, timestamp: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

// FX取引スキーマ
const fxTradeSchema = new mongoose.Schema({
  tradeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  pair: {
    type: String,
    required: true, // 例: USD/JPY
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  openPrice: {
    type: Number,
    required: true,
  },
  closePrice: {
    type: Number,
  },
  leverage: {
    type: Number,
    default: 1,
  },
  profit: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
  openedAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: {
    type: Date,
  },
});

fxTradeSchema.index({ guildId: 1, userId: 1, status: 1 });

const FxTrade = mongoose.model('FxTrade', fxTradeSchema);

module.exports = {
  Company,
  Transaction,
  FxTrade,
};
