const { SlashCommandBuilder } = require('discord.js');
const { ERRORS, TTS } = require('../../config/constants');

module.exports = {
  category: 'voice',
  data: new SlashCommandBuilder()
    .setName('tts')
    .setDescription('テキストを音声で読み上げます')
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('読み上げるテキスト')
        .setRequired(true)
        .setMaxLength(TTS.MAX_TEXT_LENGTH)
    )
    .addIntegerOption(option =>
      option
        .setName('speaker')
        .setDescription('話者ID')
        .setRequired(false)
        .setMinValue(0)
    )
    .addNumberOption(option =>
      option
        .setName('speed')
        .setDescription('話速(0.5〜2.0)')
        .setRequired(false)
        .setMinValue(0.5)
        .setMaxValue(2.0)
    )
    .addNumberOption(option =>
      option
        .setName('pitch')
        .setDescription('ピッチ(-0.15〜0.15)')
        .setRequired(false)
        .setMinValue(-0.15)
        .setMaxValue(0.15)
    ),
  cooldown: 5,
  guildOnly: true,

  async execute(interaction, client) {
    const text = interaction.options.getString('text');
    const speaker = interaction.options.getInteger('speaker') || TTS.DEFAULT_SPEAKER;
    const speed = interaction.options.getNumber('speed') || TTS.DEFAULT_SPEED;
    const pitch = interaction.options.getNumber('pitch') || TTS.DEFAULT_PITCH;

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: ERRORS.NOT_IN_VOICE,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const ttsManager = client.modules.get('tts');

      if (!ttsManager) {
        return interaction.editReply({
          content: '❌ TTS機能が利用できません。',
        });
      }

      // ボイスチャンネルに接続していない場合は接続
      if (!ttsManager.connections.has(interaction.guild.id)) {
        const joinResult = ttsManager.joinChannel(interaction.guild.id, voiceChannel.id);
        
        if (!joinResult.success) {
          return interaction.editReply({
            content: `❌ ${joinResult.message}`,
          });
        }
      }

      // 読み上げ
      const speakResult = await ttsManager.speak(interaction.guild.id, text, {
        speaker,
        speed,
        pitch,
      });

      if (!speakResult.success) {
        return interaction.editReply({
          content: `❌ ${speakResult.message}`,
        });
      }

      return interaction.editReply({
        content: `🗣️ テキストを読み上げます: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      });

    } catch (error) {
      logger.error('Error in tts command:', { error: error.message });
      return interaction.editReply({
        content: '❌ TTSの実行中にエラーが発生しました。',
      });
    }
  },
};
