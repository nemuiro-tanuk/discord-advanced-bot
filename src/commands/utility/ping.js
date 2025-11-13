const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('BOTの応答速度を確認します'),
  
  async execute(interaction, client) {
    const sent = await interaction.reply({
      content: '🏓 Pong!',
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'レイテンシ', value: `${latency}ms`, inline: true },
        { name: 'API レイテンシ', value: `${apiLatency}ms`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: null,
      embeds: [embed],
    });
  },
};
