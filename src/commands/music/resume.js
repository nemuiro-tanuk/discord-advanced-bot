const { SlashCommandBuilder } = require('discord.js');
const { ERRORS } = require('../../config/constants');

module.exports = {
  category: 'music',
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('音楽を再開します'),
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

    const result = musicManager.resume(player);

    if (!result.success) {
      return interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true,
      });
    }

    return interaction.reply('▶️ 音楽を再開しました。');
  },
};
