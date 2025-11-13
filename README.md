# Discord BOT - 統合型高機能BOT

## 概要

このプロジェクトは、discord.js v14をベースとした高機能Discord BOTです。以下の既存BOTの機能を統合し、それを上回る機能性・UX・運用性を実現します。

### 統合対象BOT
- ProBot (モデレーション)
- MEE6 (レベリング・自動化)
- TakasumiBOT (多機能)
- Jockie Music / Lara (音楽再生)
- OwO Bot (経済・ゲーム)
- Wick / Vortex / Auttaja (セキュリティ)
- Dyno / Carl-bot (管理・自動化)
- Ticket Tool (チケットシステム)
- GiveawayBot (ギブアウェイ)
- VirtualCrypto (仮想通貨)
- Discord翻訳 (多言語翻訳)

## 主要機能

### 🎵 音楽再生 (Lavalink)
- YouTube/Spotify検索・再生
- プレイリスト管理
- 複数サーバー同時再生対応
- キュー管理・ボリューム調整

### 🗣️ VOICEVOX音声読み上げ
- su-shiki API連携
- 話者・話速・ピッチ設定
- チャンネル別ON/OFF
- 音声キャッシュ機能

### 🤖 Gemini AIチャット
- Gemini 2.5 Pro連携
- 会話履歴管理
- コスト管理(月額¥3,000上限)
- 高品質/低コストモード切替

### 💰 経済システム
- サーバー独自通貨
- 疑似株式市場(起業・上場・売買)
- 疑似FX取引
- 銀行・ローン・買収機能
- チャート画像自動生成

### 🔐 認証システム
- reCAPTCHA連携
- 利用規約同意
- Vercel API連携
- 自動ロール付与

### 🎮 ゲームサポート
- 原神ビルドカード (Enka.Network)
- 崩壊スターレイル (Mihomo API)
- 画像付きビルドカード生成

### 📢 マルチ募集・VC管理
- スレッド自動作成
- 参加/キャンセル管理
- 一時VC作成・監視
- AFK自動移動(3時間ルール)

### 📅 定時投稿
- 天気情報(地域別)
- ニュース配信
- 画像付き投稿
- スケジュール管理

### 🛡️ モデレーション
- 自動モデレーション
- 警告・ミュート・BAN
- ログ記録
- フィルタリング

### 🎫 チケットシステム
- チケット作成・管理
- カテゴリ別対応
- ログ保存

### 🎁 ギブアウェイ
- 抽選イベント作成
- 自動抽選・当選通知
- 参加条件設定

### 🌐 翻訳機能
- 多言語自動翻訳
- リアクション翻訳

## 技術スタック

- **言語**: Node.js (JavaScript)
- **Discord**: discord.js v14+
- **音声**: @discordjs/voice + Lavalink
- **TTS**: su-shiki (VOICEVOX) API
- **AI**: Gemini 2.5 Pro
- **DB**: Azure Cosmos DB for MongoDB (Free Tier, 32GB)
- **キュー**: Redis / Upstash + BullMQ
- **画像生成**: Canvas / SVG
- **スケジューラ**: node-cron

## プロジェクト構造

```
discord-bot/
├── src/
│   ├── index.js                 # エントリーポイント
│   ├── config/                  # 設定ファイル
│   │   ├── config.js
│   │   └── constants.js
│   ├── commands/                # スラッシュコマンド
│   │   ├── music/
│   │   ├── moderation/
│   │   ├── economy/
│   │   ├── ai/
│   │   ├── voice/
│   │   ├── game/
│   │   └── utility/
│   ├── events/                  # イベントハンドラ
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   ├── guildMemberAdd.js
│   │   └── voiceStateUpdate.js
│   ├── handlers/                # ハンドラ
│   │   ├── commandHandler.js
│   │   ├── eventHandler.js
│   │   └── errorHandler.js
│   ├── modules/                 # 機能モジュール
│   │   ├── music/               # Lavalink音楽再生
│   │   ├── tts/                 # VOICEVOX TTS
│   │   ├── ai/                  # Gemini AIチャット
│   │   ├── economy/             # 経済システム
│   │   ├── auth/                # 認証システム
│   │   ├── recruitment/         # マルチ募集
│   │   ├── voice/               # 一時VC管理
│   │   ├── scheduler/           # 定時投稿
│   │   ├── moderation/          # モデレーション
│   │   ├── ticket/              # チケット
│   │   ├── giveaway/            # ギブアウェイ
│   │   ├── game/                # ゲームサポート
│   │   ├── translation/         # 翻訳
│   │   └── image/               # 画像生成
│   ├── database/                # データベース
│   │   ├── connection.js
│   │   └── models/
│   │       ├── Guild.js
│   │       ├── User.js
│   │       ├── Economy.js
│   │       ├── Company.js
│   │       └── Transaction.js
│   └── utils/                   # ユーティリティ
│       ├── logger.js
│       ├── cache.js
│       ├── queue.js
│       └── helpers.js
├── tests/                       # テスト
├── docs/                        # ドキュメント
├── .env.example                 # 環境変数サンプル
├── .gitignore
├── package.json
└── README.md
```

## 環境変数

以下の環境変数を `.env` ファイルに設定してください:

```env
# Discord
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id

# Lavalink
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass

# Database
COSMOS_MONGO_URI=your_cosmos_connection_string

# VOICEVOX (su-shiki)
SU_SHIKI_API_KEY=your_sushiki_api_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MONTHLY_BUDGET=3000

# Weather & News
WEATHER_API_KEY=your_weather_api_key
NEWS_API_KEY=your_news_api_key

# Vercel (認証)
VERCEL_WEBHOOK_SECRET=your_webhook_secret

# Redis (キュー)
REDIS_URL=your_redis_url

# その他
NODE_ENV=production
LOG_LEVEL=info
```

## インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集

# データベースのセットアップ
npm run db:setup

# 開発モードで起動
npm run dev

# 本番モードで起動
npm start
```

## デプロイ

### Oracle Cloud Always Free

1. Ampere A1インスタンスを作成
2. Node.js環境をセットアップ
3. PM2またはsystemdで自動起動設定
4. 環境変数を設定
5. BOTを起動

詳細は `docs/deployment.md` を参照してください。

## 開発ワークフロー

このプロジェクトはPR単位で機能を実装していきます:

1. ✅ 初期アーキテクチャ & コアモジュール
2. 🔄 認証モジュール (Vercel連携)
3. 🔄 VOICEVOX TTS モジュール
4. 🔄 Gemini Chat モジュール
5. 🔄 スレッド募集・一時VC管理
6. 🔄 経済システム
7. 🔄 定時投稿 & 画像生成
8. 🔄 管理者API & DBスキーマ
9. 🔄 監視 & 運用手順
10. 🔄 デプロイ構成

## ライセンス

ISC

## 注意事項

- 外部APIの利用規約を遵守してください
- ゲーム関連APIは非公式のものもあるため、利用は自己責任で行ってください
- 個人情報・認証情報の取り扱いには十分注意してください
- コスト管理(Gemini API等)を適切に行ってください

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
