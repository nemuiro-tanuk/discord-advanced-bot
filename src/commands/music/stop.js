const { SlashCommandBuilder } = require('discord.js');
const { ERRORS } = require('../../config/constants');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('音楽を停止してキューをクリアします'),
  guildOnly: true,

  async execute(interaction, client) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: ERRORS.NOT_IN_VOICE,
        ephemeral: true,
      });
    }

    const musicManager = client.modules.get('music');
    const player = musicManager.manager.players.get(interaction.guild.id);

    if (!player) {
      return interaction.reply({
        content: ERRORS.BOT_NOT_IN_VOICE,
        ephemeral: true,
      });
    }

    if (player.voiceChannel !== voiceChannel.id) {
      return interaction.reply({
        content: ERRORS.SAME_VOICE_CHANNEL,
        ephemeral: true,
      });
    }

    musicManager.stop(player);
    musicManager.destroyPlayer(interaction.guild.id);

    return interaction.reply('⏹️ 音楽を停止してボイスチャンネルから退出しました。');
  },
};
