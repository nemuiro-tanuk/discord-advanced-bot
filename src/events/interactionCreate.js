const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // スラッシュコマンド
    if (interaction.isChatInputCommand()) {
      await client.commandHandler.executeCommand(interaction);
      return;
    }

    // ボタン
    if (interaction.isButton()) {
      await handleButton(interaction, client);
      return;
    }

    // セレクトメニュー
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
      return;
    }

    // モーダル
    if (interaction.isModalSubmit()) {
      await handleModal(interaction, client);
      return;
    }

    // オートコンプリート
    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction, client);
      return;
    }
  },
};

/**
 * ボタンインタラクションを処理
 */
async function handleButton(interaction, client) {
  const [action, ...params] = interaction.customId.split(':');

  try {
    switch (action) {
      case 'verify':
        // 認証ボタン
        await handleVerifyButton(interaction, client);
        break;

      case 'recruit_join':
        // 募集参加ボタン
        await handleRecruitJoinButton(interaction, params);
        break;

      case 'recruit_leave':
        // 募集離脱ボタン
        await handleRecruitLeaveButton(interaction, params);
        break;

      case 'ticket_close':
        // チケットクローズボタン
        await handleTicketCloseButton(interaction, params);
        break;

      case 'giveaway_enter':
        // ギブアウェイ参加ボタン
        await handleGiveawayEnterButton(interaction, params);
        break;

      default:
        logger.warn(`Unknown button action: ${action}`);
        await interaction.reply({
          content: '❌ 不明なボタンです。',
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error(`Error handling button ${action}:`, { error: error.message });
    
    const errorMessage = {
      content: '❌ ボタンの処理中にエラーが発生しました。',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

/**
 * セレクトメニューインタラクションを処理
 */
async function handleSelectMenu(interaction, client) {
  const [action, ...params] = interaction.customId.split(':');

  try {
    switch (action) {
      case 'tts_speaker':
        // TTS話者選択
        await handleTtsSpeakerSelect(interaction, params);
        break;

      case 'language':
        // 言語選択
        await handleLanguageSelect(interaction, params);
        break;

      default:
        logger.warn(`Unknown select menu action: ${action}`);
        await interaction.reply({
          content: '❌ 不明な選択メニューです。',
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error(`Error handling select menu ${action}:`, { error: error.message });
    
    const errorMessage = {
      content: '❌ 選択メニューの処理中にエラーが発生しました。',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

/**
 * モーダルインタラクションを処理
 */
async function handleModal(interaction, client) {
  const [action, ...params] = interaction.customId.split(':');

  try {
    switch (action) {
      case 'recruit_create':
        // 募集作成モーダル
        await handleRecruitCreateModal(interaction, params);
        break;

      case 'ticket_create':
        // チケット作成モーダル
        await handleTicketCreateModal(interaction, params);
        break;

      case 'company_create':
        // 会社作成モーダル
        await handleCompanyCreateModal(interaction, params);
        break;

      default:
        logger.warn(`Unknown modal action: ${action}`);
        await interaction.reply({
          content: '❌ 不明なモーダルです。',
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error(`Error handling modal ${action}:`, { error: error.message });
    
    const errorMessage = {
      content: '❌ モーダルの処理中にエラーが発生しました。',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

/**
 * オートコンプリートを処理
 */
async function handleAutocomplete(interaction, client) {
  const command = client.commandHandler.commands.get(interaction.commandName);

  if (!command || !command.autocomplete) {
    return;
  }

  try {
    await command.autocomplete(interaction, client);
  } catch (error) {
    logger.error(`Error handling autocomplete for ${interaction.commandName}:`, {
      error: error.message,
    });
  }
}

// プレースホルダー関数（実際の実装は各モジュールで行う）
async function handleVerifyButton(interaction, client) {
  await interaction.reply({
    content: '🔄 認証機能は実装中です。',
    ephemeral: true,
  });
}

async function handleRecruitJoinButton(interaction, params) {
  await interaction.reply({
    content: '🔄 募集参加機能は実装中です。',
    ephemeral: true,
  });
}

async function handleRecruitLeaveButton(interaction, params) {
  await interaction.reply({
    content: '🔄 募集離脱機能は実装中です。',
    ephemeral: true,
  });
}

async function handleTicketCloseButton(interaction, params) {
  await interaction.reply({
    content: '🔄 チケットクローズ機能は実装中です。',
    ephemeral: true,
  });
}

async function handleGiveawayEnterButton(interaction, params) {
  await interaction.reply({
    content: '🔄 ギブアウェイ参加機能は実装中です。',
    ephemeral: true,
  });
}

async function handleTtsSpeakerSelect(interaction, params) {
  await interaction.reply({
    content: '🔄 TTS話者選択機能は実装中です。',
    ephemeral: true,
  });
}

async function handleLanguageSelect(interaction, params) {
  await interaction.reply({
    content: '🔄 言語選択機能は実装中です。',
    ephemeral: true,
  });
}

async function handleRecruitCreateModal(interaction, params) {
  await interaction.reply({
    content: '🔄 募集作成機能は実装中です。',
    ephemeral: true,
  });
}

async function handleTicketCreateModal(interaction, params) {
  await interaction.reply({
    content: '🔄 チケット作成機能は実装中です。',
    ephemeral: true,
  });
}

async function handleCompanyCreateModal(interaction, params) {
  await interaction.reply({
    content: '🔄 会社作成機能は実装中です。',
    ephemeral: true,
  });
}
