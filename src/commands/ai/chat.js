const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  category: 'ai',
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('AIとチャットします')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('AIに送信するメッセージ')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('mode')
        .setDescription('応答モード')
        .setRequired(false)
        .addChoices(
          { name: '高品質', value: 'high' },
          { name: '低コスト', value: 'low' }
        )
    ),
  cooldown: 10,

  async execute(interaction, client) {
    const message = interaction.options.getString('message');
    const mode = interaction.options.getString('mode') || 'high';

    await interaction.deferReply();

    try {
      const aiManager = client.modules.get('ai');

      if (!aiManager) {
        return interaction.editReply({
          content: '❌ AI機能が利用できません。',
        });
      }

      // 使用状況をチェック
      const usage = aiManager.getUsageStats();
      if (usage.percentage >= 100) {
        return interaction.editReply({
          content: '❌ 月間予算に達しました。来月まで待ってください。',
        });
      }

      // AIチャットを生成
      const result = await aiManager.chat(interaction.user.id, message, { mode });

      if (!result.success) {
        return interaction.editReply({
          content: `❌ ${result.message}`,
        });
      }

      // 応答が長い場合は分割
      const response = result.response;
      if (response.length > 2000) {
        // 最初の2000文字を送信
        await interaction.editReply(response.substring(0, 2000));
        
        // 残りを分割して送信
        let remaining = response.substring(2000);
        while (remaining.length > 0) {
          await interaction.followUp(remaining.substring(0, 2000));
          remaining = remaining.substring(2000);
        }
      } else {
        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('🤖 AI応答')
          .setDescription(response)
          .setFooter({
            text: `トークン: ${result.tokens} | コスト: ¥${result.cost.toFixed(2)} | 月間使用率: ${usage.percentage.toFixed(1)}%`,
          })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      logger.error('Error in chat command:', { error: error.message });
      return interaction.editReply({
        content: '❌ AIチャットの実行中にエラーが発生しました。',
      });
    }
  },
};
