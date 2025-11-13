const logger = require('../../utils/logger');
const User = require('../../database/models/User');
const { Company, Transaction } = require('../../database/models/Economy');
const { v4: uuidv4 } = require('crypto').randomUUID || require('uuid').v4;

class EconomyManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * ユーザーの残高を取得
   */
  async getBalance(userId) {
    try {
      const user = await User.findOne({ userId });
      
      if (!user) {
        return { success: false, message: 'ユーザーが見つかりません。' };
      }

      return {
        success: true,
        balance: user.economy.balance,
        bank: user.economy.bank,
        total: user.economy.balance + user.economy.bank,
      };
    } catch (error) {
      logger.error('Failed to get balance:', { error: error.message, userId });
      return { success: false, message: '残高の取得に失敗しました。' };
    }
  }

  /**
   * 通貨を追加
   */
  async addMoney(userId, amount, reason = 'unknown') {
    try {
      const user = await User.findOne({ userId });
      
      if (!user) {
        return { success: false, message: 'ユーザーが見つかりません。' };
      }

      await user.updateBalance(amount);
      
      logger.transaction('add', userId, amount, { reason });
      
      return { success: true, newBalance: user.economy.balance };
    } catch (error) {
      logger.error('Failed to add money:', { error: error.message, userId, amount });
      return { success: false, message: '通貨の追加に失敗しました。' };
    }
  }

  /**
   * 通貨を減らす
   */
  async removeMoney(userId, amount, reason = 'unknown') {
    try {
      const user = await User.findOne({ userId });
      
      if (!user) {
        return { success: false, message: 'ユーザーが見つかりません。' };
      }

      if (user.economy.balance < amount) {
        return { success: false, message: '残高が不足しています。' };
      }

      await user.updateBalance(-amount);
      
      logger.transaction('remove', userId, amount, { reason });
      
      return { success: true, newBalance: user.economy.balance };
    } catch (error) {
      logger.error('Failed to remove money:', { error: error.message, userId, amount });
      return { success: false, message: '通貨の削除に失敗しました。' };
    }
  }

  /**
   * 通貨を送金
   */
  async transfer(fromUserId, toUserId, amount, guildId) {
    try {
      const fromUser = await User.findOne({ userId: fromUserId });
      const toUser = await User.findOne({ userId: toUserId });

      if (!fromUser || !toUser) {
        return { success: false, message: 'ユーザーが見つかりません。' };
      }

      if (fromUser.economy.balance < amount) {
        return { success: false, message: '残高が不足しています。' };
      }

      // 手数料を計算
      const fee = Math.floor(amount * 0.05); // 5%
      const totalAmount = amount + fee;

      if (fromUser.economy.balance < totalAmount) {
        return { success: false, message: '手数料を含めた残高が不足しています。' };
      }

      // 送金実行
      await fromUser.updateBalance(-totalAmount);
      await toUser.updateBalance(amount);

      // トランザクション記録
      await Transaction.create({
        transactionId: uuidv4(),
        guildId,
        type: 'transfer',
        fromUserId,
        toUserId,
        amount,
        fee,
        status: 'completed',
      });

      logger.transaction('transfer', fromUserId, amount, { toUserId, fee });

      return {
        success: true,
        amount,
        fee,
        newBalance: fromUser.economy.balance,
      };
    } catch (error) {
      logger.error('Failed to transfer money:', {
        error: error.message,
        fromUserId,
        toUserId,
        amount,
      });
      return { success: false, message: '送金に失敗しました。' };
    }
  }

  /**
   * デイリーボーナスを取得
   */
  async claimDaily(userId) {
    try {
      const user = await User.findOne({ userId });
      
      if (!user) {
        return { success: false, message: 'ユーザーが見つかりません。' };
      }

      const now = Date.now();
      const lastDaily = user.economy.lastDaily ? user.economy.lastDaily.getTime() : 0;
      const cooldown = 24 * 60 * 60 * 1000; // 24時間

      if (now - lastDaily < cooldown) {
        const timeLeft = cooldown - (now - lastDaily);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        return {
          success: false,
          message: `デイリーボーナスは ${hoursLeft} 時間後に受け取れます。`,
        };
      }

      const bonus = 100;
      await user.updateBalance(bonus);
      user.economy.lastDaily = new Date();
      await user.save();

      logger.transaction('daily', userId, bonus);

      return { success: true, amount: bonus, newBalance: user.economy.balance };
    } catch (error) {
      logger.error('Failed to claim daily:', { error: error.message, userId });
      return { success: false, message: 'デイリーボーナスの取得に失敗しました。' };
    }
  }

  /**
   * 仕事をする
   */
  async work(userId) {
    try {
      const user = await User.findOne({ userId });
      
      if (!user) {
        return { success: false, message: 'ユーザーが見つかりません。' };
      }

      const now = Date.now();
      const lastWork = user.economy.lastWork ? user.economy.lastWork.getTime() : 0;
      const cooldown = 60 * 60 * 1000; // 1時間

      if (now - lastWork < cooldown) {
        const timeLeft = cooldown - (now - lastWork);
        const minutesLeft = Math.floor(timeLeft / (60 * 1000));
        return {
          success: false,
          message: `仕事は ${minutesLeft} 分後にできます。`,
        };
      }

      const reward = Math.floor(Math.random() * 150) + 50; // 50-200
      await user.updateBalance(reward);
      user.economy.lastWork = new Date();
      await user.save();

      logger.transaction('work', userId, reward);

      return { success: true, amount: reward, newBalance: user.economy.balance };
    } catch (error) {
      logger.error('Failed to work:', { error: error.message, userId });
      return { success: false, message: '仕事の実行に失敗しました。' };
    }
  }

  /**
   * リーダーボードを取得
   */
  async getLeaderboard(guildId, limit = 10) {
    try {
      const users = await User.find()
        .sort({ 'economy.balance': -1 })
        .limit(limit);

      return {
        success: true,
        leaderboard: users.map((user, index) => ({
          rank: index + 1,
          userId: user.userId,
          username: user.username,
          balance: user.economy.balance,
        })),
      };
    } catch (error) {
      logger.error('Failed to get leaderboard:', { error: error.message });
      return { success: false, message: 'リーダーボードの取得に失敗しました。' };
    }
  }
}

module.exports = EconomyManager;
