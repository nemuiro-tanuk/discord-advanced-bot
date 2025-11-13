const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS, ERRORS } = require('../../config/constants');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('再生キューを表示します')
    .addIntegerOption(option =>
      option
        .setName('page')
        .setDescription('ページ番号')
        .setRequired(false)
        .setMinValue(1)
    ),
  guildOnly: true,

  async execute(interaction, client) {
    const musicManager = client.modules.get('music');
    const player = musicManager.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      return interaction.reply({
        content: ERRORS.NO_QUEUE,
        ephemeral: true,
      });
    }

    const page = interaction.options.getInteger('page') || 1;
    const itemsPerPage = 10;
    const queue = player.queue;
    const totalPages = Math.ceil(queue.size / itemsPerPage) || 1;

    if (page > totalPages) {
      return interaction.reply({
        content: `❌ ページ番号は1〜${totalPages}の範囲で指定してください。`,
        ephemeral: true,
      });
    }

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const tracks = queue.slice(start, end);

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📋 再生キュー')
      .setDescription(
        `**現在再生中:**\n` +
        `[${queue.current.title}](${queue.current.uri})\n` +
        `${musicManager.formatTime(player.position)} / ${musicManager.formatTime(queue.current.duration)}\n\n` +
        `**次の曲:**`
      );

    if (tracks.length === 0) {
      embed.addFields({ name: 'キュー', value: 'キューは空です' });
    } else {
      const trackList = tracks.map((track, index) => {
        const position = start + index + 1;
        return `${position}. [${track.title}](${track.uri}) - ${musicManager.formatTime(track.duration)}`;
      }).join('\n');

      embed.addFields({ name: 'キュー', value: trackList });
    }

    embed.addFields(
      { name: 'キュー内の曲数', value: `${queue.size}`, inline: true },
      { name: 'ページ', value: `${page} / ${totalPages}`, inline: true },
      { name: 'ボリューム', value: `${player.volume}%`, inline: true }
    );

    embed.setFooter({ text: `リクエスト: ${interaction.user.tag}` });
    embed.setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
