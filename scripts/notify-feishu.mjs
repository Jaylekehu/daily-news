import { pathToFileURL } from "node:url";
import {
  buildDailyNotification,
  formatShortDate,
  resolveNotificationDate,
  shorten
} from "./notification-content.mjs";

export { formatShortDate, resolveNotificationDate, shorten };

export function buildNotification({ result, reportDate, dailyUrl }) {
  const { title, summary } = buildDailyNotification({ result, reportDate, dailyUrl });

  return {
    title,
    summary,
    payload: {
      msg_type: "text",
      content: {
        text: [title, summary].join("\n")
      }
    }
  };
}

async function sendNotification() {
  const webhook = process.env.FEISHU_DAILY_NEWS_WEBHOOK;
  if (!webhook?.startsWith("https://open.feishu.cn/")) {
    throw new Error("FEISHU_DAILY_NEWS_WEBHOOK is missing or invalid.");
  }

  const { title, payload } = buildNotification({
    result: process.env.RUN_RESULT,
    reportDate: process.env.REPORT_DATE,
    dailyUrl: process.env.DAILY_URL || "https://daily.2077.fun"
  });

  let lastError;
  for (const delay of [0, 1000, 3000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`Feishu HTTP ${response.status}`);

      const body = await response.json();
      const code = body.code ?? body.StatusCode;
      if (code !== 0) {
        throw new Error(`Feishu rejected notification with code ${code}.`);
      }
      console.log(JSON.stringify({ ok: true, platform: "feishu", title }));
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Feishu notification failed after retries: ${lastError?.message || "unknown error"}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sendNotification().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
