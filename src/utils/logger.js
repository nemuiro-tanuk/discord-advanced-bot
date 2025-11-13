const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Logger {
  constructor() {
    this.logDir = config.app.logFilePath;
    this.logLevel = config.app.logLevel;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    // ログディレクトリが存在しない場合は作成
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * ログレベルの数値を取得
   */
  getLevelValue(level) {
    return this.levels[level] || 0;
  }

  /**
   * 現在のタイムスタンプを取得
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * ログメッセージをフォーマット
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  /**
   * ログをファイルに書き込み
   */
  writeToFile(level, message) {
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.logDir, `${level}-${date}.log`);
    
    fs.appendFileSync(filename, message + '\n', 'utf8');
  }

  /**
   * ログを出力
   */
  log(level, message, meta = {}) {
    if (this.getLevelValue(level) > this.getLevelValue(this.logLevel)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);

    // コンソールに出力
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }

    // ファイルに書き込み
    try {
      this.writeToFile(level, formattedMessage);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  /**
   * エラーログ
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * 警告ログ
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * 情報ログ
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * デバッグログ
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * トランザクションログ（経済システム用）
   */
  transaction(type, userId, amount, details = {}) {
    const message = `Transaction: ${type} - User: ${userId} - Amount: ${amount}`;
    this.info(message, { type: 'transaction', ...details });
    
    // トランザクション専用ログファイルにも記録
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.logDir, `transaction-${date}.log`);
    const formattedMessage = this.formatMessage('transaction', message, details);
    
    try {
      fs.appendFileSync(filename, formattedMessage + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write transaction log:', error);
    }
  }

  /**
   * 監査ログ（管理操作用）
   */
  audit(action, userId, details = {}) {
    const message = `Audit: ${action} - User: ${userId}`;
    this.info(message, { type: 'audit', ...details });
    
    // 監査専用ログファイルにも記録
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.logDir, `audit-${date}.log`);
    const formattedMessage = this.formatMessage('audit', message, details);
    
    try {
      fs.appendFileSync(filename, formattedMessage + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * ログファイルのローテーション（古いログを削除）
   */
  rotateOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to rotate logs:', { error: error.message });
    }
  }
}

// シングルトンインスタンスをエクスポート
module.exports = new Logger();
