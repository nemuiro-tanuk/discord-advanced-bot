const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
  category: 'economy',
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('残高を確認します')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('残高を確認するユーザー')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    try {
      const economyManager = client.modules.get('economy');

      if (!economyManager) {
        return interaction.reply({
          content: '❌ 経済機能が利用できません。',
          ephemeral: true,
        });
      }

      const result = await economyManager.getBalance(targetUser.id);

      if (!result.success) {
        return interaction.reply({
          content: `❌ ${result.message}`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('💰 残高')
        .setDescription(`${targetUser.username} の残高`)
        .addFields(
          { name: '財布', value: `${result.balance.toLocaleString()} コイン`, inline: true },
          { name: '銀行', value: `${result.bank.toLocaleString()} コイン`, inline: true },
          { name: '合計', value: `${result.total.toLocaleString()} コイン`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error in balance command:', { error: error.message });
      return interaction.reply({
        content: '❌ 残高の確認中にエラーが発生しました。',
        ephemeral: true,
      });
    }
  },
};
