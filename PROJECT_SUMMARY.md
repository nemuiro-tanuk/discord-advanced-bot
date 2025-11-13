# Discord BOT プロジェクトサマリー

## プロジェクト概要

このプロジェクトは、discord.js v14をベースとした高機能Discord BOTです。音楽再生、AI チャット、経済システムなど、複数の既存BOTの機能を統合し、それを上回る機能性・UX・運用性を実現することを目標としています。

## GitHubリポジトリ

**リポジトリURL**: https://github.com/nemuiro-tanuk/discord-advanced-bot

## 実装済み機能

### コアシステム
プロジェクトは、モジュール化された設計に基づいて構築されています。コマンドハンドラとイベントハンドラにより、スラッシュコマンドとDiscordイベントを効率的に管理します。データベースはMongoDBまたはAzure Cosmos DB for MongoDBに対応しており、ギルド設定、ユーザー情報、経済データを永続化します。ロガーシステムは、操作ログ、エラーログ、トランザクションログ、監査ログを分離して記録し、ログローテーション機能も備えています。

### 音楽再生機能 (Lavalink)
Lavalinkを使用した音楽再生機能を実装しています。YouTube/Spotifyからの検索・再生、プレイリスト管理、複数サーバーでの同時再生に対応しています。基本コマンドとして、`/play`、`/pause`、`/resume`、`/skip`、`/stop`、`/queue`を提供し、キュー管理やトラックイベント処理も実装されています。

### VOICEVOX音声読み上げ (TTS)
su-shiki APIを利用したVOICEVOX音声読み上げ機能を実装しています。生成済み音声はキャッシュされ、再利用されます。複数の読み上げリクエストはキューで管理され、順次処理されます。話者、速度、ピッチのカスタマイズが可能です。

### Gemini AIチャット
Gemini 2.5 Proを使用したAIチャット機能を実装しています。ユーザー別の会話履歴を管理し、月間予算を制御するコスト管理機能を備えています。高品質モードと低コストモードの切り替えが可能です。

### 経済システム
サーバー独自の通貨システムを実装しています。残高確認、デイリーボーナス、仕事、ユーザー間送金などの基本機能を提供します。すべてのトランザクションは記録され、リーダーボード機能も実装されています。

### イベント処理
BOT起動時の初期化、コマンド/ボタン/モーダルの処理、新規メンバー参加時の認証フロー、ボイスチャンネルの参加/退出/移動の監視、3時間単独滞在ルールなど、主要なDiscordイベントを処理します。

### ユーティリティコマンド
レイテンシを確認する`/ping`コマンドと、コマンド一覧とヘルプを表示する`/help`コマンドを提供します。

## プロジェクト構造

```
discord-bot/
├── src/
│   ├── index.js                 # エントリーポイント
│   ├── config/                  # 設定ファイル
│   ├── commands/                # スラッシュコマンド
│   │   ├── music/               # 音楽コマンド
│   │   ├── ai/                  # AIコマンド
│   │   ├── economy/             # 経済コマンド
│   │   ├── voice/               # 音声コマンド
│   │   └── utility/             # ユーティリティコマンド
│   ├── events/                  # イベントハンドラ
│   ├── handlers/                # コマンド/イベントハンドラ
│   ├── modules/                 # 機能モジュール
│   │   ├── music/               # 音楽再生
│   │   ├── tts/                 # TTS
│   │   ├── ai/                  # AIチャット
│   │   └── economy/             # 経済システム
│   ├── database/                # データベース
│   │   ├── connection.js
│   │   └── models/              # データモデル
│   └── utils/                   # ユーティリティ
├── scripts/                     # スクリプト
├── docs/                        # ドキュメント
├── .env.example                 # 環境変数サンプル
├── package.json
└── README.md
```

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/nemuiro-tanuk/discord-advanced-bot.git
cd discord-advanced-bot
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.example`をコピーして`.env`を作成し、必要な情報を入力します。

```bash
cp .env.example .env
```

必要な環境変数:
- `DISCORD_BOT_TOKEN`: Discord BOTトークン
- `DISCORD_CLIENT_ID`: Discord クライアントID
- `COSMOS_MONGO_URI`: Azure Cosmos DB接続文字列
- `SU_SHIKI_API_KEY`: VOICEVOX (su-shiki) APIキー
- `GEMINI_API_KEY`: Gemini APIキー
- `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD`: Lavalink設定

### 4. Lavalinkサーバーをセットアップ

音楽再生機能を使用するには、Lavalinkサーバーが必要です。詳細は`docs/deployment.md`を参照してください。

### 5. コマンドをデプロイ

```bash
npm run deploy-commands
```

### 6. BOTを起動

```bash
npm start
```

開発モードで起動する場合:

```bash
npm run dev
```

## デプロイ

Oracle Cloud Always Freeインスタンスへのデプロイ手順は、`docs/deployment.md`に記載されています。PM2を使用した永続化、Lavalinkサーバーのセットアップ、監視設定などが含まれています。

## 今後の開発

実装予定の機能については、`docs/implementation-status.md`を参照してください。主な追加予定機能は以下の通りです:

- 認証システム (reCAPTCHA、Vercel連携)
- マルチ募集・VC管理
- 経済システム拡張 (会社設立、株式売買、FX)
- 定時投稿 (天気、ニュース)
- モデレーション、チケット、ギブアウェイ
- ゲームサポート (原神、崩壊スターレイル)
- 翻訳機能

## 技術スタック

- **言語**: Node.js (JavaScript)
- **Discord**: discord.js v14+
- **音声**: @discordjs/voice + Lavalink
- **TTS**: su-shiki (VOICEVOX) API
- **AI**: Gemini 2.5 Pro
- **DB**: Azure Cosmos DB for MongoDB
- **スケジューラ**: node-cron

## ライセンス

ISC License

## コントリビューション

プルリクエストやイシューの報告を歓迎します。詳細は`docs/implementation-status.md`のコントリビューションセクションを参照してください。
