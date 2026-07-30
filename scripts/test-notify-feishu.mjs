import assert from "node:assert/strict";
import {
  buildNotification,
  resolveNotificationDate,
  shorten
} from "./notify-feishu.mjs";

const success = buildNotification({
  result: "success",
  reportDate: "2026-07-30",
  dailyUrl: "https://daily.2077.fun"
});
assert.equal(success.title, "日报任务完成");
assert.equal(success.summary, "2026-07-30 日报已生成并部署");
assert.match(success.payload.content.text, /^日报\n日报任务完成/);
assert.match(success.payload.content.text, /https:\/\/daily\.2077\.fun$/);

const failure = buildNotification({
  result: "failure",
  reportDate: "2026-07-30",
  dailyUrl: "https://daily.2077.fun"
});
assert.equal(failure.title, "日报任务失败");
assert.match(failure.summary, /请检查日志$/);

assert.equal(resolveNotificationDate("2026-07-30"), "2026-07-30");
assert.equal(shorten("123456", 5), "1234…");

console.log("Feishu notification tests passed.");
