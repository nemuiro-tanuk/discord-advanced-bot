const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../utils/logger');
const config = require('../../config/config');
const User = require('../../database/models/User');

class AIManager {
  constructor(client) {
    this.client = client;
    this.genAI = new GoogleGenerativeAI(config.ai.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.ai.model });
    this.monthlyUsage = 0;
    this.monthlyBudget = config.ai.monthlyBudget;
    this.costPerToken = 0.0005; // 仮の値
  }

  /**
   * チャットを生成
   */
  async chat(userId, message, options = {}) {
    try {
      // バジェットチェック
      if (this.monthlyUsage >= this.monthlyBudget) {
        return {
          success: false,
          message: '月間予算に達しました。来月まで待ってください。',
        };
      }

      // ユーザーの会話履歴を取得
      const user = await User.findOne({ userId });
      const history = user?.aiChat?.conversationHistory || [];

      // 会話履歴を整形
      const formattedHistory = this.formatHistory(history);

      // プロンプトを構築
      const prompt = this.buildPrompt(formattedHistory, message, options);

      // Gemini APIを呼び出し
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // トークン使用量を推定（実際のAPIレスポンスに応じて調整）
      const estimatedTokens = this.estimateTokens(prompt + text);
      const cost = estimatedTokens * this.costPerToken;
      this.monthlyUsage += cost;

      // 会話履歴を保存
      if (user) {
        await user.addChatHistory('user', message);
        await user.addChatHistory('assistant', text);
        user.aiChat.totalTokensUsed += estimatedTokens;
        await user.save();
      }

      logger.info('AI chat generated', {
        userId,
        tokens: estimatedTokens,
        cost,
        monthlyUsage: this.monthlyUsage,
      });

      return {
        success: true,
        response: text,
        tokens: estimatedTokens,
        cost,
      };

    } catch (error) {
      logger.error('Failed to generate AI chat:', {
        error: error.message,
        userId,
      });
      return {
        success: false,
        message: 'AI応答の生成に失敗しました。',
      };
    }
  }

  /**
   * 会話履歴をフォーマット
   */
  formatHistory(history) {
    // 最新の10件のみを使用
    const recentHistory = history.slice(-10);

    return recentHistory.map(entry => ({
      role: entry.role,
      content: entry.content,
    }));
  }

  /**
   * プロンプトを構築
   */
  buildPrompt(history, message, options = {}) {
    const { mode = 'high', systemPrompt = null } = options;

    let prompt = '';

    // システムプロンプト
    if (systemPrompt) {
      prompt += `${systemPrompt}\n\n`;
    } else {
      prompt += this.getDefaultSystemPrompt(mode);
    }

    // 会話履歴
    if (history.length > 0) {
      prompt += '会話履歴:\n';
      history.forEach(entry => {
        const role = entry.role === 'user' ? 'ユーザー' : 'アシスタント';
        prompt += `${role}: ${entry.content}\n`;
      });
      prompt += '\n';
    }

    // 現在のメッセージ
    prompt += `ユーザー: ${message}\nアシスタント: `;

    return prompt;
  }

  /**
   * デフォルトのシステムプロンプトを取得
   */
  getDefaultSystemPrompt(mode) {
    if (mode === 'low') {
      return 'あなたは簡潔に答えるアシスタントです。短く要点をまとめて回答してください。\n\n';
    }

    return `あなたは親切で知識豊富なアシスタントです。
ユーザーの質問に丁寧に答え、必要に応じて詳細な説明を提供してください。
不適切な内容や有害な内容には応答しないでください。\n\n`;
  }

  /**
   * トークン数を推定
   */
  estimateTokens(text) {
    // 簡易的な推定（実際のトークナイザーを使用する場合は要調整）
    // 日本語: 約2文字で1トークン
    // 英語: 約4文字で1トークン
    const japaneseChars = (text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
    const otherChars = text.length - japaneseChars;

    return Math.ceil(japaneseChars / 2 + otherChars / 4);
  }

  /**
   * 月間使用量をリセット
   */
  resetMonthlyUsage() {
    this.monthlyUsage = 0;
    logger.info('Reset monthly AI usage');
  }

  /**
   * 使用状況を取得
   */
  getUsageStats() {
    return {
      monthlyUsage: this.monthlyUsage,
      monthlyBudget: this.monthlyBudget,
      remaining: this.monthlyBudget - this.monthlyUsage,
      percentage: (this.monthlyUsage / this.monthlyBudget) * 100,
    };
  }

  /**
   * モードを切り替え（高品質/低コスト）
   */
  async switchMode(guildId, mode) {
    // ギルド設定を更新
    const Guild = require('../../database/models/Guild');
    const guild = await Guild.findOne({ guildId });

    if (!guild) {
      return { success: false, message: 'ギルド設定が見つかりません。' };
    }

    guild.features.aiChat.mode = mode;
    await guild.save();

    logger.info('AI mode switched', { guildId, mode });
    return { success: true };
  }

  /**
   * 会話履歴をクリア
   */
  async clearHistory(userId) {
    try {
      const user = await User.findOne({ userId });

      if (!user) {
        return { success: false, message: 'ユーザーが見つかりません。' };
      }

      user.aiChat.conversationHistory = [];
      await user.save();

      logger.info('Cleared AI chat history', { userId });
      return { success: true };

    } catch (error) {
      logger.error('Failed to clear AI chat history:', {
        error: error.message,
        userId,
      });
      return { success: false, message: '履歴のクリアに失敗しました。' };
    }
  }

  /**
   * 要約を生成
   */
  async summarize(text, maxLength = 200) {
    try {
      const prompt = `以下のテキストを${maxLength}文字以内で要約してください:\n\n${text}`;
      
      const result = await this.model.generateContent(prompt);
      const summary = result.response.text();

      return { success: true, summary };

    } catch (error) {
      logger.error('Failed to generate summary:', { error: error.message });
      return { success: false, message: '要約の生成に失敗しました。' };
    }
  }
}

module.exports = AIManager;
