const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * データベースに接続
   */
  async connect() {
    if (this.isConnected) {
      logger.info('Database already connected');
      return this.connection;
    }

    try {
      logger.info('Connecting to database...');
      
      // Mongoose接続オプション
      const options = {
        ...config.database.options,
        dbName: config.database.name,
      };

      // 接続
      this.connection = await mongoose.connect(config.database.uri, options);
      this.isConnected = true;

      logger.info('Database connected successfully', {
        host: this.connection.connection.host,
        name: this.connection.connection.name,
      });

      // 接続イベントリスナー
      mongoose.connection.on('error', (error) => {
        logger.error('Database connection error:', { error: error.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('Database reconnected');
        this.isConnected = true;
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to database:', { error: error.message });
      throw error;
    }
  }

  /**
   * データベース接続を切断
   */
  async disconnect() {
    if (!this.isConnected) {
      logger.info('Database not connected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', { error: error.message });
      throw error;
    }
  }

  /**
   * 接続状態を確認
   */
  checkConnection() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * データベースのヘルスチェック
   */
  async healthCheck() {
    try {
      if (!this.checkConnection()) {
        return { status: 'disconnected', healthy: false };
      }

      // 簡単なクエリを実行して接続を確認
      await mongoose.connection.db.admin().ping();

      return {
        status: 'connected',
        healthy: true,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      };
    } catch (error) {
      logger.error('Database health check failed:', { error: error.message });
      return {
        status: 'error',
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * トランザクションを開始（Azure Cosmos DBでサポートされている場合）
   */
  async startTransaction() {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      return session;
    } catch (error) {
      logger.error('Failed to start transaction:', { error: error.message });
      throw error;
    }
  }

  /**
   * トランザクションをコミット
   */
  async commitTransaction(session) {
    try {
      await session.commitTransaction();
      session.endSession();
      logger.debug('Transaction committed');
    } catch (error) {
      logger.error('Failed to commit transaction:', { error: error.message });
      throw error;
    }
  }

  /**
   * トランザクションをロールバック
   */
  async abortTransaction(session) {
    try {
      await session.abortTransaction();
      session.endSession();
      logger.debug('Transaction aborted');
    } catch (error) {
      logger.error('Failed to abort transaction:', { error: error.message });
      throw error;
    }
  }

  /**
   * データベースの統計情報を取得
   */
  async getStats() {
    try {
      if (!this.checkConnection()) {
        return null;
      }

      const stats = await mongoose.connection.db.stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
      };
    } catch (error) {
      logger.error('Failed to get database stats:', { error: error.message });
      return null;
    }
  }
}

// シングルトンインスタンスをエクスポート
module.exports = new Database();
