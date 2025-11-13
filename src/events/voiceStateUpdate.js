const logger = require('../utils/logger');
const Guild = require('../database/models/Guild');

// ユーザーのVC滞在時間を追跡
const voiceTracking = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    try {
      const member = newState.member;
      const guildId = newState.guild.id;

      // ユーザーがVCに参加した場合
      if (!oldState.channelId && newState.channelId) {
        await handleVoiceJoin(member, newState, client);
      }

      // ユーザーがVCから退出した場合
      if (oldState.channelId && !newState.channelId) {
        await handleVoiceLeave(member, oldState, client);
      }

      // ユーザーがVCを移動した場合
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        await handleVoiceMove(member, oldState, newState, client);
      }

      // 一時VCの自動削除チェック
      if (oldState.channelId) {
        await checkTempVCDeletion(oldState, client);
      }

    } catch (error) {
      logger.error('Error in voiceStateUpdate event:', {
        error: error.message,
        stack: error.stack,
      });
    }
  },
};

/**
 * VC参加を処理
 */
async function handleVoiceJoin(member, state, client) {
  const userId = member.id;
  const channelId = state.channelId;

  // 滞在時間の追跡を開始
  if (!voiceTracking.has(userId)) {
    voiceTracking.set(userId, {
      channelId,
      joinedAt: Date.now(),
      aloneStartTime: null,
    });
  }

  logger.debug(`${member.user.tag} joined voice channel ${channelId}`);

  // 一人だけの場合、単独滞在時間の追跡を開始
  const channel = state.channel;
  if (channel && channel.members.size === 1) {
    const tracking = voiceTracking.get(userId);
    tracking.aloneStartTime = Date.now();
  }
}

/**
 * VC退出を処理
 */
async function handleVoiceLeave(member, state, client) {
  const userId = member.id;

  // 滞在時間を記録
  if (voiceTracking.has(userId)) {
    const tracking = voiceTracking.get(userId);
    const duration = Date.now() - tracking.joinedAt;

    logger.debug(`${member.user.tag} left voice channel after ${Math.floor(duration / 1000)}s`);

    // TODO: 統計情報をデータベースに保存

    voiceTracking.delete(userId);
  }
}

/**
 * VC移動を処理
 */
async function handleVoiceMove(member, oldState, newState, client) {
  const userId = member.id;

  // 古いチャンネルの追跡を終了
  if (voiceTracking.has(userId)) {
    const tracking = voiceTracking.get(userId);
    tracking.channelId = newState.channelId;
    tracking.joinedAt = Date.now();
    tracking.aloneStartTime = null;
  }

  logger.debug(`${member.user.tag} moved from ${oldState.channelId} to ${newState.channelId}`);

  // 新しいチャンネルで一人だけの場合
  const newChannel = newState.channel;
  if (newChannel && newChannel.members.size === 1) {
    const tracking = voiceTracking.get(userId);
    if (tracking) {
      tracking.aloneStartTime = Date.now();
    }
  }
}

/**
 * 一時VCの自動削除をチェック
 */
async function checkTempVCDeletion(state, client) {
  const channel = state.channel;

  if (!channel || channel.members.size > 0) {
    return;
  }

  try {
    const guildData = await Guild.findOne({ guildId: state.guild.id });

    if (!guildData) {
      return;
    }

    // 一時VCかどうかをチェック
    const tempVC = guildData.tempVoiceChannels.find(vc => vc.channelId === channel.id);

    if (tempVC) {
      // 空になった一時VCを削除
      await channel.delete('一時VCが空になったため削除');
      
      // データベースから削除
      guildData.tempVoiceChannels = guildData.tempVoiceChannels.filter(
        vc => vc.channelId !== channel.id
      );
      await guildData.save();

      logger.info(`Deleted empty temp VC: ${channel.name} (${channel.id})`);
    }
  } catch (error) {
    logger.error('Failed to check temp VC deletion:', { error: error.message });
  }
}

/**
 * 3時間単独滞在チェック（定期実行）
 */
function startIdleCheck(client) {
  setInterval(async () => {
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000;

    for (const [userId, tracking] of voiceTracking.entries()) {
      if (!tracking.aloneStartTime) {
        continue;
      }

      const aloneTime = now - tracking.aloneStartTime;

      if (aloneTime >= threeHours) {
        try {
          // ユーザーを取得
          const guild = client.guilds.cache.find(g => 
            g.members.cache.has(userId)
          );

          if (!guild) {
            continue;
          }

          const member = guild.members.cache.get(userId);
          if (!member || !member.voice.channelId) {
            voiceTracking.delete(userId);
            continue;
          }

          // ギルド設定を取得
          const guildData = await Guild.findOne({ guildId: guild.id });

          if (!guildData) {
            continue;
          }

          // AFKチャンネルに移動
          if (guildData.channels.afk) {
            const afkChannel = guild.channels.cache.get(guildData.channels.afk);
            
            if (afkChannel) {
              await member.voice.setChannel(afkChannel, '3時間単独滞在のためAFKチャンネルに移動');
              logger.info(`Moved ${member.user.tag} to AFK channel after 3 hours alone`);
            }
          } else {
            // AFKチャンネルがない場合は切断
            await member.voice.disconnect('3時間単独滞在のため切断');
            logger.info(`Disconnected ${member.user.tag} after 3 hours alone`);
          }

          voiceTracking.delete(userId);

        } catch (error) {
          logger.error('Failed to handle idle user:', {
            error: error.message,
            userId,
          });
        }
      }
    }
  }, 5 * 60 * 1000); // 5分ごとにチェック

  logger.info('Started voice idle check');
}

// エクスポート
module.exports.startIdleCheck = startIdleCheck;
