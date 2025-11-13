const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../utils/logger');
const Guild = require('../database/models/Guild');
const User = require('../database/models/User');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      logger.info(`New member joined: ${member.user.tag} in guild ${member.guild.name}`);

      // ギルド設定を取得
      const guildData = await Guild.findOne({ guildId: member.guild.id });

      if (!guildData) {
        logger.warn(`Guild data not found for ${member.guild.id}`);
        return;
      }

      // ユーザーデータを作成または更新
      await User.findOneAndUpdate(
        { userId: member.user.id },
        {
          userId: member.user.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          avatar: member.user.avatar,
        },
        { upsert: true, new: true }
      );

      // 未認証ロールを付与
      if (guildData.roles.unverified) {
        try {
          const unverifiedRole = member.guild.roles.cache.get(guildData.roles.unverified);
          if (unverifiedRole) {
            await member.roles.add(unverifiedRole);
            logger.info(`Added unverified role to ${member.user.tag}`);
          }
        } catch (error) {
          logger.error('Failed to add unverified role:', { error: error.message });
        }
      }

      // 認証メッセージを送信
      await sendVerificationMessage(member, guildData);

      // ウェルカムメッセージを送信
      if (guildData.channels.welcome) {
        await sendWelcomeMessage(member, guildData);
      }

    } catch (error) {
      logger.error('Error in guildMemberAdd event:', {
        error: error.message,
        stack: error.stack,
        memberId: member.user.id,
        guildId: member.guild.id,
      });
    }
  },
};

/**
 * 認証メッセージを送信
 */
async function sendVerificationMessage(member, guildData) {
  try {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🔐 認証が必要です')
      .setDescription(
        `${member.guild.name} へようこそ!\n\n` +
        'サーバーを利用するには、以下のボタンをクリックして認証を完了してください。\n\n' +
        '認証プロセス:\n' +
        '1️⃣ 下のボタンをクリック\n' +
        '2️⃣ reCAPTCHAを完了\n' +
        '3️⃣ 利用規約に同意\n' +
        '4️⃣ 認証完了!'
      )
      .setThumbnail(member.guild.iconURL())
      .setFooter({ text: 'BOTではない場合は認証してください' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('verify')
      .setLabel('認証を開始')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('✅');

    const row = new ActionRowBuilder().addComponents(button);

    await member.send({
      embeds: [embed],
      components: [row],
    }).catch(error => {
      logger.warn(`Could not send DM to ${member.user.tag}:`, { error: error.message });
    });

  } catch (error) {
    logger.error('Failed to send verification message:', { error: error.message });
  }
}

/**
 * ウェルカムメッセージを送信
 */
async function sendWelcomeMessage(member, guildData) {
  try {
    const welcomeChannel = member.guild.channels.cache.get(guildData.channels.welcome);

    if (!welcomeChannel) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('👋 新しいメンバーが参加しました!')
      .setDescription(
        `${member} さんが ${member.guild.name} に参加しました!\n\n` +
        '認証を完了してサーバーを楽しんでください。'
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `メンバー数: ${member.guild.memberCount}` })
      .setTimestamp();

    await welcomeChannel.send({ embeds: [embed] });

  } catch (error) {
    logger.error('Failed to send welcome message:', { error: error.message });
  }
}
