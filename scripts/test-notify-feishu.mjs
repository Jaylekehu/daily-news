import assert from "node:assert/strict";
import {
  buildNotification,
  formatShortDate,
  resolveNotificationDate,
  shorten
} from "./notify-feishu.mjs";

const success = buildNotification({
  result: "success",
  reportDate: "2026-07-30",
  dailyUrl: "https://daily.2077.fun"
});
assert.equal(success.title, "7月30日日报发布成功");
assert.equal(success.summary, "含15条新闻：https://daily.2077.fun");
assert.equal(success.payload.content.text.split("\n").length, 2);
assert.match(success.payload.content.text, /^7月30日日报发布成功\n/);
assert.match(success.payload.content.text, /https:\/\/daily\.2077\.fun$/);

const failure = buildNotification({
  result: "failure",
  reportDate: "2026-07-30",
  dailyUrl: "https://daily.2077.fun"
});
assert.equal(failure.title, "7月30日日报发布失败");
assert.match(failure.summary, /^请检查运行：/);

assert.equal(resolveNotificationDate("2026-07-30"), "2026-07-30");
assert.equal(formatShortDate("2026-07-30"), "7月30日");
assert.equal(shorten("123456", 5), "1234…");

console.log("Feishu notification tests passed.");
