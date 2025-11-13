const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class EventHandler {
  constructor(client) {
    this.client = client;
    this.events = new Map();
  }

  /**
   * イベントを読み込む
   */
  async loadEvents() {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      
      try {
        const event = require(filePath);

        if (!event.name || !event.execute) {
          logger.warn(`Event at ${filePath} is missing required properties`);
          continue;
        }

        // イベントリスナーを登録
        if (event.once) {
          this.client.once(event.name, (...args) => this.handleEvent(event, ...args));
        } else {
          this.client.on(event.name, (...args) => this.handleEvent(event, ...args));
        }

        this.events.set(event.name, event);
        logger.debug(`Loaded event: ${event.name} from ${file}`);
      } catch (error) {
        logger.error(`Failed to load event from ${filePath}:`, { error: error.message });
      }
    }

    logger.info(`Loaded ${this.events.size} events`);
    return this.events;
  }

  /**
   * イベントを処理
   */
  async handleEvent(event, ...args) {
    try {
      await event.execute(...args, this.client);
    } catch (error) {
      logger.error(`Error handling event ${event.name}:`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * イベントをリロード
   */
  async reloadEvent(eventName) {
    const event = this.events.get(eventName);

    if (!event) {
      throw new Error(`Event ${eventName} not found`);
    }

    // リスナーを削除
    this.client.removeAllListeners(eventName);

    // キャッシュをクリア
    const eventPath = require.resolve(`../events/${eventName}.js`);
    delete require.cache[eventPath];

    // 再読み込み
    const newEvent = require(eventPath);

    if (newEvent.once) {
      this.client.once(newEvent.name, (...args) => this.handleEvent(newEvent, ...args));
    } else {
      this.client.on(newEvent.name, (...args) => this.handleEvent(newEvent, ...args));
    }

    this.events.set(eventName, newEvent);
    logger.info(`Reloaded event: ${eventName}`);
    return newEvent;
  }

  /**
   * すべてのイベントをリロード
   */
  async reloadAllEvents() {
    // すべてのリスナーを削除
    this.events.forEach((event, name) => {
      this.client.removeAllListeners(name);
    });

    // キャッシュをクリア
    this.events.forEach((event, name) => {
      const eventPath = require.resolve(`../events/${name}.js`);
      delete require.cache[eventPath];
    });

    this.events.clear();
    await this.loadEvents();

    logger.info('Reloaded all events');
  }

  /**
   * イベントリストを取得
   */
  getEvents() {
    return Array.from(this.events.values());
  }
}

module.exports = EventHandler;
