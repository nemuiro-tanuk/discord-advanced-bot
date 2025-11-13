const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS, ERRORS } = require('../../config/constants');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('音楽を再生します')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('曲名またはURL')
        .setRequired(true)
    ),
  cooldown: 3,
  guildOnly: true,

  async execute(interaction, client) {
    const query = interaction.options.getString('query');
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    // ボイスチャンネルチェック
    if (!voiceChannel) {
      return interaction.reply({
        content: ERRORS.NOT_IN_VOICE,
        ephemeral: true,
      });
    }

    // 権限チェック
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        content: '❌ ボイスチャンネルへの接続または発言の権限がありません。',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const musicManager = client.modules.get('music');

      if (!musicManager) {
        return interaction.editReply({
          content: '❌ 音楽機能が利用できません。',
        });
      }

      // トラックを検索
      const searchResult = await musicManager.search(query, interaction.user);

      if (!searchResult.success) {
        return interaction.editReply({
          content: `❌ ${searchResult.message}`,
        });
      }

      const { result } = searchResult;

      // プレイヤーを取得または作成
      const player = musicManager.getPlayer(
        interaction.guild.id,
        voiceChannel.id,
        interaction.channel.id
      );

      // プレイヤーを接続
      if (!player.voiceChannel) {
        player.connect();
      }

      // トラックを追加
      if (result.loadType === 'PLAYLIST_LOADED') {
        // プレイリストの場合
        for (const track of result.tracks) {
          await musicManager.play(player, track);
        }

        const embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('📋 プレイリストを追加しました')
          .setDescription(`**${result.playlist.name}**\n${result.tracks.length} 曲`)
          .setFooter({ text: `リクエスト: ${interaction.user.tag}` })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });

      } else {
        // 単一トラックの場合
        const track = result.tracks[0];
        await musicManager.play(player, track);

        const embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle(player.queue.size === 0 ? '🎵 再生中' : '📋 キューに追加')
          .setDescription(`[${track.title}](${track.uri})`)
          .addFields(
            { name: 'アーティスト', value: track.author, inline: true },
            { name: '長さ', value: musicManager.formatTime(track.duration), inline: true },
            { name: 'キュー位置', value: `${player.queue.size}`, inline: true }
          )
          .setThumbnail(track.thumbnail)
          .setFooter({ text: `リクエスト: ${interaction.user.tag}` })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      client.logger.error('Error in play command:', { error: error.message });
      return interaction.editReply({
        content: '❌ 音楽の再生中にエラーが発生しました。',
      });
    }
  },
};
