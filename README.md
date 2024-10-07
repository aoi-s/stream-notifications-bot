# Stream Notifications Bot

## フォーク元(https://github.com/tatsumin39/stream-notifications-bot) からの変更点
- 同一箱のチャンネルをすべて登録するなど、多チャンネル運用を前提にした構造に変更しています。
- DiscordチャンネルのWebhook URLとデータ取得間隔を.envでの指定からDBに格納するように変更しています。
  - YouTubeチャンネルごとに通知先を変えることで、多チャンネル運用をした場合でも見やすくなります。
- live/upcomingスラッシュコマンドで、特定チャンネルの情報を取得することを可能にしました。

## 目次

1. [概要](#概要)
2. [機能一覧](#機能一覧)
3. [前提条件](#前提条件)
4. [プロジェクトのディレクトリ構造](#プロジェクトのディレクトリ構造)
5. [環境変数](#環境変数)
6. [セットアップ](#セットアップ)
7. [利用方法](#利用方法)
8. [管理者向け機能](#管理者向け機能)
9. [注意事項](#注意事項)
10. [ライセンス](#ライセンス)

## 概要

このプロジェクトは、Discord ボットを使用して YouTube のライブ配信や動画の通知を行うものです。指定されたチャンネルの RSS フィードを監視し、新しい動画が投稿されたり、ライブ配信が開始されたりした際に、Discord チャンネルに通知を送信します。

## 機能一覧

- **最新動画情報の取得**: YouTube チャンネルの RSS フィードから最新の動画情報を定期的に取得します。
- **データベース保存**: 取得した動画情報を PostgreSQL データベースに保存します。
- **新動画通知**: 新しい動画が投稿された場合、指定された Discord チャンネルに通知を送信します。
  - **複数チャンネル対応**: 複数の Discord チャンネルへの通知が可能です。
  - **更新頻度設定**: 各チャンネル毎に更新頻度を設定できます。
- **スラッシュコマンド**: Discord のスラッシュコマンドを使用して、現在配信中の動画や配信予定の動画情報を表示します。
  - **`/live`コマンド**: 現在配信中の動画情報を表示します。
  - **`/upcoming`コマンド**: 直近の配信予定の動画情報を表示します。
  - **`/reminderlist`コマンド**: 登録されているリマインダーのリストを表示します。
- **リマインダー通知**: 絵文字リアクションを使用して、配信 5 分前にリマインダー通知を送信します。
- **データベースの自動クリーンアップ**: 適切なステータスに遷移できなくなった動画データを自動的に削除します。
- **データベース操作（管理者向け）**: 管理者は Discord DM を介してデータベースのメンテナンスを行うことができます。
  - **SQL クエリの送信**: 管理者は SQL クエリを送信してデータベースを操作できます。
  - **自動削除**: 実行結果は設定した時間後に自動的に削除されます。

## 前提条件

このプロジェクトを実行する前に、以下のものが必要です。

- Node.js
- npm (Node.js に付属)
- PostgreSQL
- 有効な Discord Bot トークン
- YouTube Data API のキー

## プロジェクトのディレクトリ構造

```
.
├── .env.example
├── LICENSE
├── README.md
├── index.js
├── package-lock.json
├── package.json
└── src
    ├── config
    │   ├── dbConfig.example.js
    │   └── dbConfig.js
    ├── database
    │   ├── executeQuery.js
    │   ├── getChannelsData.js
    │   ├── queryParser.js
    │   ├── reminderModel.js
    │   ├── updateChannelIcon.js
    │   └── videoData.js
    ├── discord
    │   ├── bot.js
    │   ├── messages.js
    │   ├── notification.js
    │   └── reminderInteractions.js
    ├── reminders
    │   └── schedule.js
    ├── slashCommand
    │   ├── create.js
    │   ├── createConfig.json
    │   ├── delete.js
    │   ├── show.js
    │   ├── update.js
    │   └── updateConfig.json
    ├── tasks
    │   ├── cleanUpVideoData.js
    │   ├── reminderScheduler.js
    │   └── youtubeFeed.js
    ├── utils
    │   ├── convertDuration.js
    │   ├── formatDate.js
    │   ├── formatResultsAsTable.js
    │   └── isUrlAccessible.js
    └── youtube
        ├── api.js
        ├── checkAndUpdate.js
        └── feed.js
```

## 環境変数

このプロジェクトには `.env.example` ファイルが含まれており、これを参考にして `.env` ファイルを作成してください。

### 環境変数の一覧

このプロジェクトには `.env.example` ファイルが含まれており、これを参考にして `.env` ファイルを作成してください。

| 環境変数名                 | 説明                                                    |
| -------------------------- | ------------------------------------------------------- |
| YOUTUBE_API_KEY            | YouTube Data API のキー                                 |
| DISCORD_BOT_TOKEN          | Discord Bot のトークン                                  |
| CLIENT_ID                  | Discord クライアント ID                                 |
| GUILD_ID                   | Discord ギルド(サーバー)ID                              |
| ADMIN_USER_ID              | 管理者の Discord ユーザー ID                            |
| DB_HOST                    | データベースのホスト名                                  |
| DB_NAME                    | データベース名                                          |
| DB_USER                    | データベースユーザー名                                  |
| DB_PASSWORD                | データベースのパスワード                                |
| DB_PORT                    | データベースのポート番号                                |
| REMINDER_SEARCH_INTERVAL   | リマインダー検索の間隔（分）                            |
| REMINDER_RECHECK_INTERVAL  | リマインダー再検索の間隔（分）                          |
| MESSAGE_DELETE_TIMEOUT     | DM 自動削除の間隔（秒）                                 |

Fly.io や Heroku などのサービスを使用する場合は、接続文字列として`DATABASE_URL`を使用してください。

## セットアップ

### YouTube Data API のキーの発行

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセスします。
2. プロジェクトを選択または新しいプロジェクトを作成します。
3. クイック アクセスから「API とサービス」→「ライブラリ」を選択します。
4. 「YouTube Data API v3」を検索し、有効にします。
5. 左側のメニューから「認証情報」を選択し、「認証情報を作成」→「API キー」をクリックします。
6. 作成された API キーをコピーし、`.env` ファイルの `YOUTUBE_API_KEY` に設定します。

### Discord Bot の作成

#### DISCORD_BOT_TOKEN の取得方法

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセスし、[New Application]をクリックします。
2. アプリケーション名を入力し、「Create」をクリックします。
3. 左側のメニューから「Bot」を選択し、以下の手順で進みます。
   - 「Reset Token」をクリックします。
   - 「Yes, do it!」の順番にクリックします。
   - 表示されたボットのトークンをコピーします。
4. Authorization Flow のセクションで以下を有効にし、「Save Changes」をクリックします。
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT `
5. コピーしたトークンを `.env` ファイルの `DISCORD_BOT_TOKEN` に設定します。

#### CLIENT_ID の取得方法

1. 左側のメニューから「OAuth2」を選択し、「Client ID」をコピーします。
2. コピーした ID を`.env` ファイルの `CLIENT_ID` に設定します。

### OAuth2 設定

1. 「OAuth2」から「OAuth2 URL Generator」に進みます。
2. 「scopes」で以下を有効します。
   - `bot`
   - `applications.commands`
3. BOT PERMISSIONS セクションで以下を有効にします。

- `Send Messages`
- `Read Message History`
- `Use Slash Commands`

4. 生成された URL をコピーしてブラウザで開き、ボットをサーバーに追加します。

#### GUILD_ID の取得方法

1. Discord の「ユーザー設定」の「詳細設定」から`開発者モード`を有効にします。
2. Discord アプリケーションで対象のサーバー名を右クリックし、「サーバー ID をコピー」を選択します。
3. コピーした ID を `.env` ファイルの `GUILD_ID` に設定します。

### Discord チャンネルの webhook URL の取得

1. Discord チャンネルを右クリックし、チャンネルの編集をクリックします。
2. 「連携サービス」セクションに移動し、ウェブフックを作成をクリックします。
3. 作成されたウェブフックをクリックし、「ウェブフック URL をコピー」をクリックします。
4. コピーした URL を`.env` ファイルに追加します。

### 管理者の Discord ユーザー ID の取得

1. Discord を開き、対象のユーザー名を右クリックします。
2. 「ユーザー ID をコピー」をクリックします。
3. コピーした ID を `.env` ファイルの `ADMIN_USER_ID` に設定します。

### データベースのセットアップ

#### 1. PostgreSQL をインストールし、起動します。

#### 2. 以下のコマンドを実行してデータベースとユーザーを作成します。

```sql
CREATE DATABASE your_database_name;
CREATE USER your_database_user WITH PASSWORD 'your_database_password';
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_database_user;
```

#### 3. .env ファイルにデータベースの接続情報を設定します。

#### 4. dbConfig.js の設定

データベース接続の設定は `dbConfig.js` ファイルで行います。サンプルファイルとして `dbConfig.example.js` が含まれているので、環境に合わせて設定を変更し、`dbConfig.js` として保存してください。

### データベース設計

このプロジェクトでは、アプリケーションのデータを管理するために 3 つの主要なテーブルを持つデータベースを使用します。以下に各テーブルの概要とスキーマを説明します。

#### 1. `channels` テーブル

チャンネルの基本情報とそれに関連する Discord の通知設定を保持します。

| 列名                 | 型           | 説明                        |
| -------------------- | ------------ | --------------------------- |
| channel_id           | VARCHAR(255) | YouTube チャンネル ID       |
| channel_name         | VARCHAR(255) | YouTube チャンネル名        |
| channel_icon_url     | VARCHAR(255) | チャンネルのアイコンの URL  |
| discord_channel_name | VARCHAR(255) | 通知先 Discord チャンネル名 |
| discord_webhook_url | VARCHAR(255) | 通知先 Discord WebhookURL |
| date_fetch_interval | INTERGER     | データ取得間隔(分) |

#### 2. `video_data` テーブル

YouTube からのビデオ情報とその配信ステータスを管理します。

| 列名                 | 型                       | 説明                              |
| -------------------- | ------------------------ | --------------------------------- |
| video_id             | VARCHAR(255)             | 動画の一意識別子                  |
| title                | VARCHAR(255)             | 動画のタイトル                    |
| published            | TIMESTAMP WITH TIME ZONE | 動画が公開された日時              |
| updated              | TIMESTAMP WITH TIME ZONE | 動画情報が最後に更新された日時    |
| channel              | VARCHAR(255)             | 動画が属する YouTube チャンネル名 |
| status               | VARCHAR(50)              | 動画のライブ配信ステータス        |
| scheduled_start_time | TIMESTAMP WITH TIME ZONE | 配信予定開始時刻                  |
| actual_start_time    | TIMESTAMP WITH TIME ZONE | 実際の配信開始時刻                |
| actual_end_time      | TIMESTAMP WITH TIME ZONE | 配信終了時刻                    |
| duration             | VARCHAR(50)              | 動画の長さ（HH:MM:SS 形式）       |

#### 3. `reminder` テーブル

ユーザー設定に基づくリマインダー情報とその通知状態を追跡します。

| 列名            | 型                       | 説明                              |
| --------------- | ------------------------ | --------------------------------- |
| id              | INTEGER                  | 主キー、自動インクリメント        |
| user_id         | BIGINT                   | リマインダーを設定したユーザー ID |
| message_content | TEXT                     | リマインダーのメッセージ内容      |
| reminder_time   | TIMESTAMP WITH TIME ZONE | リマインダーの設定時刻            |
| scheduled       | BOOLEAN                  | スケジュール登録状況　　          |
| executed        | BOOLEAN                  | リマインダー実行状況              |
| video_id        | VARCHAR(255)             | YouTube のビデオ ID               |

### データベースのテーブル作成

以下の SQL を実行して、データベースのテーブルを作成します。

```sql
CREATE TABLE channels (
    channel_id VARCHAR(255) PRIMARY KEY,
    channel_name VARCHAR(255) NOT NULL,
    channel_icon_url VARCHAR(255),
    discord_channel_name VARCHAR(255) NOT NULL,
    discord_webhook_url VARCHAR(255) NOT NULL,
    data_fetch_interval INTEGER NOT NULL
);

CREATE TABLE video_data (
    video_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    published TIMESTAMP NOT NULL,
    updated TIMESTAMP NOT NULL,
    channel VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration VARCHAR(50)
);

CREATE TABLE reminder (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    message_content TEXT NOT NULL,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled BOOLEAN DEFAULT FALSE,
    executed BOOLEAN DEFAULT FALSE,
    video_id VARCHAR(255),
    FOREIGN KEY (video_id) REFERENCES video_data(video_id)
);
```

### channels テーブルへのデータ登録

1. `channels` テーブルにデータを登録します。以下は、例として登録する SQL 文です。

```sql
INSERT INTO channels (channel_id, channel_name, discord_channel_name, discord_webhook_url, data_fetch_interval)
VALUES ('UCJFZiqLMntJufDCHc6bQixg', 'hololive ホロライブ - VTuber Group', 'hololive_公式', 'https://discord.com/api/webhooks/, '10');
```

必要に応じて、channel_id, channel_name, discord_channel_name を適切な値に置き換えてください。

### アプリケーションのインストール

リポジトリをクローンします。

```bash
git clone https://github.com/aoi-s/stream-notifications-bot.git
cd stream-notifications-bot
```

必要なパッケージをインストールします。

```bash
npm install
```

アプリケーションの起動
以下のコマンドでアプリケーションを起動します。

```bash
node index.js
```

### Discord スラッシュコマンドの登録

スラッシュコマンドを登録するには、以下のコマンドを実行します。

```bash
node src/slashCommand/create.js src/slashCommand/createConfig.json
```

### スラッシュコマンドの更新

登録済みのスラッシュコマンドを更新するには、次の手順に従います。

1. 登録済みスラッシュコマンドの ID を確認します。
   node src/slashCommand/showSlashCommands.js

2. 更新するスラッシュコマンドの定義をスラッシュコマンドの ID を指定して JSON ファイル (updateConfig.json) として保存します。

3. JSON ファイルを指定して、次のコマンドを実行します。

```bash
node src/slashCommand/update.js src/slashCommand/updateConfig.json
```

### スラッシュコマンドの削除

登録済みのスラッシュコマンドを削除するには、次の手順に従います。

1. 登録済みスラッシュコマンドの ID を確認します。
   node src/slashCommand/showSlashCommands.js

2. 削除したいスラッシュコマンドの ID を指定して、次のコマンドを実行します。

```bash
node src/slashCommand/delete.js <commandId>
```

### 利用方法

#### リマインダーの登録

1. ライブ配信予定の投稿に対して絵文字 ⏰ (alarm_clock) でリアクションを実施します。
2. ライブ配信予定の 5 分前に Discord Bot から DM にて通知が届きます。
3. ライブ配信予定が変更になった場合は新しい配信予定時刻に基づきリマインダー設定が更新されます。

#### スラッシュコマンドの利用

- **live コマンド**

  - Discord Bot が参加しているチャンネルで `/live` コマンドを実行すると、現在ライブ配信中の情報が表示されます。
  - 引数としてチャンネル名を指定することで、特定チャンネルの情報を表示します。(DBに登録されたチャンネル名と部分一致します)

- **upcoming コマンド**

  - Discord Bot が参加しているチャンネルで `/upcoming` コマンドを実行すると、現在時刻から 15 分以内に開始予定のライブ配信情報が表示されます。
  - 引数としてチャンネル名を指定することで、特定チャンネルの情報を表示します。(DBに登録されたチャンネル名と部分一致します)
  - `/upcoming 60` のようにオプションとして任意の分数を指定することで、60 分以内に開始予定のライブ配信情報を表示します。

- **reminderlist コマンド**
  - Discord Bot が参加しているチャンネルで `/reminderlist` コマンドを実行すると、登録した有効なリマインダーが表示されます。

## 管理者向け機能

### データベースの自動クリーンアップ

ライブ配信予定の動画が削除や非公開化された場合やライブ配信中に限定公開になった場合など、適切なステータス遷移が行われないことがあります。この状況はスラッシュコマンドの`/live`や`/upcoming`の結果に影響する可能性があります。

このため、定期的なメンテナンスタスクの一部として`cleanUpVideoData.js`は 5 分ごとに以下の操作を実行します。これにより、`video_data` テーブルが最新のエントリのみを保持し、データベースのパフォーマンスと精度が向上します。

- `upcoming` ステータスの動画で、`scheduled_start_time`が 13 時間以上経過したものを削除します。
- `live` ステータスの動画で、`actual_start_time`が 13 時間以上経過したものを削除します。

### Discord Bot との DM によるメンテナンス

環境変数に管理者のユーザー ID を`ADMIN_USER_ID`として設定したユーザーは、Discord Bot との DM を介してデータベースのメンテナンスを行うことができます。以下に例を示します。

#### 使用例

- **動画データの検索**

  ```sql
  SELECT * FROM "video_data" WHERE "status" = 'upcoming' ORDER BY "scheduled_start_time" ASC LIMIT 5;
  ```

- **チャンネル情報の更新**

  ```sql
  UPDATE "channels" SET channel_name = '<チャンネル名>' WHERE channel_id = '<チャンネルID>';
  ```

- **動画データの削除**
  ```sql
  DELETE FROM "video_data" WHERE "video_id" = '<ビデオID>';
  ```

実行結果は、環境変数 MESSAGE_DELETE_TIMEOUT で設定された秒数が経過後に自動的に削除されます。ただし、Discord Bot を再起動すると自動削除が行われず、DM に実行結果が残る場合があります。

## 注意事項

### リアルタイム通知について

本システムはリアルタイム通知を保証するものではありません。YouTube の更新情報がフィードに反映されるタイミングにより、通知が遅れる可能性があります。

### 対象チャンネルの追加について

チャンネル追加時には 1 チャンネル直近 5 件のデータを取得します。そのため一度に大量のチャンネルを追加すると通知が大量に発生する可能性があります。その結果 Discord のメッセージ制限に抵触することがあります。この点を考慮して、チャンネル情報の追加は慎重に実施してください。

## ライセンス

このプロジェクトは [MIT license](LICENSE) の下で公開されています。
