import { pathToFileURL } from "node:url";
import { buildDailyNotification } from "./notification-content.mjs";

const TOKEN_ENDPOINT = "https://api.weixin.qq.com/cgi-bin/token";
const MESSAGE_ENDPOINT = "https://api.weixin.qq.com/cgi-bin/message/template/send";

export function buildWechatPayload({
  result,
  reportDate,
  dailyUrl,
  openId,
  templateId,
  sentAt = new Date()
}) {
  const { title, summary } = buildDailyNotification({ result, reportDate, dailyUrl });
  return {
    title,
    summary,
    payload: {
      touser: openId,
      template_id: templateId,
      url: dailyUrl,
      data: {
        first: { value: title },
        keyword1: { value: summary },
        remark: { value: `发送时间：${formatSentAt(sentAt)}` }
      }
    }
  };
}

export function formatSentAt(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(new Date(value))
    .replaceAll("/", "-");
}

async function requestJson(url, options, context) {
  let lastError;
  for (const delay of [0, 1000, 3000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) {
        const error = new Error(`${context} HTTP ${response.status}`);
        error.transient = response.status >= 500;
        throw error;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      const retryableNetworkError = ["TimeoutError", "TypeError"].includes(error?.name);
      if (error?.transient === false || (error?.transient !== true && !retryableNetworkError)) {
        break;
      }
    }
  }
  throw new Error(`${context}失败：${lastError?.message || "网络错误"}`);
}

async function getAccessToken(appId, appSecret) {
  const query = new URLSearchParams({
    grant_type: "client_credential",
    appid: appId,
    secret: appSecret
  });
  const body = await requestJson(`${TOKEN_ENDPOINT}?${query}`, {}, "获取微信 access_token");
  if (!body.access_token) {
    throw new Error(`获取微信 access_token 被拒绝，错误码 ${body.errcode ?? "未知"}`);
  }
  return body.access_token;
}

async function sendTemplateMessage({ appId, appSecret, payload }) {
  for (let refresh = 0; refresh < 2; refresh += 1) {
    const accessToken = await getAccessToken(appId, appSecret);
    const query = new URLSearchParams({ access_token: accessToken });
    const body = await requestJson(
      `${MESSAGE_ENDPOINT}?${query}`,
      {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload)
      },
      "发送微信模板消息"
    );
    if (body.errcode === 0 || body.errcode === "0") return body;
    if (![40014, 42001, "40014", "42001"].includes(body.errcode)) {
      throw new Error(`微信拒绝通知，错误码 ${body.errcode ?? "未知"}`);
    }
  }
  throw new Error("微信 access_token 刷新后仍然无效");
}

async function sendNotification() {
  const appId = process.env.WECHAT_DAILY_NEWS_APP_ID;
  const appSecret = process.env.WECHAT_DAILY_NEWS_APP_SECRET;
  const openId = process.env.WECHAT_DAILY_NEWS_OPEN_ID;
  const templateId = process.env.WECHAT_DAILY_NEWS_TEMPLATE_ID;
  if (!appId?.startsWith("wx") || !appSecret || !openId || !templateId) {
    throw new Error("微信公众号测试号配置缺失或格式无效。");
  }

  const dailyUrl = process.env.DAILY_URL || "https://daily.2077.fun";
  const { title, payload } = buildWechatPayload({
    result: process.env.RUN_RESULT,
    reportDate: process.env.REPORT_DATE,
    dailyUrl,
    openId,
    templateId
  });
  await sendTemplateMessage({ appId, appSecret, payload });
  console.log(JSON.stringify({ ok: true, platform: "wechat_test_account", title }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sendNotification().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
