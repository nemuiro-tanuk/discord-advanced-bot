const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('コマンド一覧とヘルプを表示します')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('詳細を表示するコマンド名')
        .setRequired(false)
    ),
  
  async execute(interaction, client) {
    const commandName = interaction.options.getString('command');

    // 特定のコマンドのヘルプを表示
    if (commandName) {
      const command = client.commandHandler.commands.get(commandName);

      if (!command) {
        return interaction.reply({
          content: `❌ コマンド \`${commandName}\` が見つかりません。`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📖 コマンド: /${command.data.name}`)
        .setDescription(command.data.description)
        .addFields(
          { name: 'カテゴリ', value: command.category || 'その他', inline: true },
          { name: 'クールダウン', value: command.cooldown ? `${command.cooldown}秒` : 'なし', inline: true }
        );

      if (command.data.options && command.data.options.length > 0) {
        const options = command.data.options.map(opt => {
          const required = opt.required ? '(必須)' : '(任意)';
          return `\`${opt.name}\` ${required} - ${opt.description}`;
        }).join('\n');

        embed.addFields({ name: 'オプション', value: options });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 全コマンドのカテゴリ別一覧を表示
    const categories = client.commandHandler.getCommandsByCategory();

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📚 コマンド一覧')
      .setDescription(
        'このBOTで利用可能なコマンド一覧です。\n' +
        '詳細を見るには `/help <コマンド名>` を使用してください。'
      )
      .setFooter({ text: `合計 ${client.commandHandler.commands.size} コマンド` });

    for (const [category, commands] of Object.entries(categories)) {
      const commandList = commands
        .map(cmd => `\`/${cmd.data.name}\``)
        .join(', ');

      embed.addFields({
        name: getCategoryEmoji(category) + ' ' + category,
        value: commandList || 'なし',
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

/**
 * カテゴリの絵文字を取得
 */
function getCategoryEmoji(category) {
  const emojis = {
    'music': '🎵',
    'moderation': '🛡️',
    'economy': '💰',
    'ai': '🤖',
    'voice': '🗣️',
    'game': '🎮',
    'utility': '🔧',
  };

  return emojis[category.toLowerCase()] || '📁';
}
