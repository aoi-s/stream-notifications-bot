// ReadableStreamポリフィルを追加
if (typeof ReadableStream === "undefined") {
  global.ReadableStream =
    require("web-streams-polyfill/ponyfill/es6").ReadableStream;
}

// 環境変数の読み込み
import dotenv from "dotenv";
dotenv.config();

// Discord Botを起動
import "./src/discord/bot.js";

// タスクのインポート
import { startYoutubeFeed } from "./src/tasks/youtubeFeed.js";
import { searchAndScheduleReminders } from "./src/tasks/reminderScheduler.js";
import { cleanUpVideoData } from "./src/tasks/cleanUpVideoData.js";
import schedule from "node-schedule";

//channelsデータベースからデータを取得する
import { getChannelsData } from "../database/getChannelsData.js";

// スケジュール間隔の定数
const ONE_MINUTE_SCHEDULE = "0 * * * * *"; // 1分ごと
const FIVE_MINUTE_SCHEDULE = "0 */5 * * * *"; // 5分ごと
const TEN_MINUTE_SCHEDULE = "0 */10 * * * *"; // 10分ごと

// 1分ごとに実行するスケジュール
schedule.scheduleJob(ONE_MINUTE_SCHEDULE, function () {
  console.log(`-`.repeat(50));
  try {
    const channels = getChannelsData();
    for (let { channel_id, channel_name, channel_icon_url, discord_channel_name, discord_webhook_url, fetch_time } of channels) {
      if (fetch_time = 1){
        startYoutubeFeed(discord_channel_name, discord_webhook_url);
      }
    }
    searchAndScheduleReminders();
  } catch (error) {
    console.error(`⛔️ Error during task execution: ${error.message}`);
  }
});

// 5分ごとに実行するスケジュール
schedule.scheduleJob(FIVE_MINUTE_SCHEDULE, function () {
  try {
    cleanUpVideoData();
  } catch (error) {
    console.error(`⛔️ Error during task execution: ${error.message}`);
  }
});

// 10分ごとに実行するスケジュール
schedule.scheduleJob(TEN_MINUTE_SCHEDULE, function () {
  try {
    const channels = getChannelsData();
    for (let { channel_id, channel_name, channel_icon_url, discord_channel_name, discord_webhook_url, fetch_time } of channels) {
      if (fetch_time = 10){
        startYoutubeFeed(discord_channel_name, discord_webhook_url);
      }
    }
  } catch (error) {
    console.error(`⛔️ Error during task execution: ${error.message}`);
  }
});
