# デプロイガイド

このガイドでは、BOTをOracle Cloud Always Freeインスタンスにデプロイする手順を説明します。

## 1. Oracle Cloud Always Freeインスタンスの準備

1.  **インスタンス作成**: Oracle Cloudにログインし、Ampere A1ベースのVMインスタンスを作成します。
    *   **OS**: Ubuntu 22.04
    *   **シェイプ**: VM.Standard.A1.Flex
    *   **OCPU**: 2 OCPU
    *   **メモリ**: 12 GB
2.  **ネットワーク設定**: イングレスルールで、BOTが必要とするポート（SSH、Lavalink、ヘルスチェック等）を開放します。
3.  **SSH接続**: `opc`ユーザーでインスタンスにSSH接続します。

## 2. 環境構築

インスタンスに接続後、以下のコマンドを実行して必要なソフトウェアをインストールします。

```bash
# パッケージリストを更新
sudo apt update && sudo apt upgrade -y

# Node.js (v18以降) をインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Java (Lavalink用) をインストール
sudo apt install -y openjdk-17-jre

# Gitをインストール
sudo apt install -y git

# PM2 (プロセス管理) をインストール
sudo npm install -g pm2
```

## 3. BOTのセットアップ

1.  **リポジトリをクローン**:

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **依存関係をインストール**:

    ```bash
    npm install
    ```

3.  **環境変数を設定**:

    ```bash
    cp .env.example .env
    nano .env
    ```

    `.env`ファイルに必要な情報をすべて入力します。

4.  **コマンドをデプロイ**:

    ```bash
    npm run deploy-commands
    ```

## 4. Lavalinkサーバーのセットアップ

1.  **Lavalink.jarをダウンロード**:

    ```bash
    wget https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar
    ```

2.  **application.ymlを作成**:

    ```yaml
    server:
      port: 2333
    lavalink:
      server:
        password: "youshallnotpass" # .envファイルと一致させる
    ```

3.  **Lavalinkを起動**:

    ```bash
    java -jar Lavalink.jar
    ```

    PM2で管理する場合は以下のようにします。

    ```bash
    pm2 start "java -jar Lavalink.jar" --name lavalink
    ```

## 5. BOTの起動

PM2を使用してBOTを起動し、永続化します。

```bash
# BOTを起動
pm2 start src/index.js --name discord-bot

# PM2のプロセスリストを保存
pm2 save

# OS起動時にPM2が自動起動するように設定
pm2 startup
```

## 6. 監視

-   **PM2**: `pm2 monit`でBOTのCPU・メモリ使用率を監視できます。
-   **ログ**: ログは`logs/`ディレクトリに保存されます。`pm2 logs discord-bot`でも確認できます。
-   **ヘルスチェック**: `HEALTH_CHECK_PORT`で指定したポートにアクセスすることで、BOTのヘルスチェックが可能です。

## 7. Render / Vercel連携

-   **ダッシュボード (Render)**: ダッシュボード用のWebアプリケーションをRenderにデプロイします。BOTのAPIと連携するために、環境変数にBOTのAPIエンドポイントと認証キーを設定します。
-   **認証API (Vercel)**: ユーザー認証用のAPIをVercelにデプロイします。BOTからのリクエストを検証するために、`VERCEL_WEBHOOK_SECRET`を環境変数に設定します。
