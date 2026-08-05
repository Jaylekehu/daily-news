import assert from "node:assert/strict";
import { buildWechatPayload, formatSentAt } from "./notify-wechat.mjs";

const success = buildWechatPayload({
  result: "success",
  reportDate: "2026-08-05",
  dailyUrl: "https://daily.2077.fun",
  openId: "test-open-id",
  templateId: "test-template-id",
  sentAt: "2026-08-05T04:30:00.000Z"
});

assert.equal(success.title, "8月5日日报发布成功");
assert.equal(success.summary, "含15条新闻：https://daily.2077.fun");
assert.equal(success.payload.touser, "test-open-id");
assert.equal(success.payload.template_id, "test-template-id");
assert.equal(success.payload.url, "https://daily.2077.fun");
assert.equal(success.payload.data.first.value, success.title);
assert.equal(success.payload.data.keyword1.value, success.summary);
assert.equal(success.payload.data.remark.value, "发送时间：2026-08-05 12:30");
assert.equal(formatSentAt("2026-08-05T04:30:00.000Z"), "2026-08-05 12:30");

const failure = buildWechatPayload({
  result: "failure",
  reportDate: "2026-08-05",
  dailyUrl: "https://daily.2077.fun",
  openId: "test-open-id",
  templateId: "test-template-id"
});
assert.equal(failure.title, "8月5日日报发布失败");
assert.match(failure.summary, /^请检查运行：/);

console.log("WeChat notification tests passed.");
