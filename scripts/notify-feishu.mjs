import { pathToFileURL } from "node:url";

const TITLE_LIMIT = 15;
const SUMMARY_LIMIT = 30;

export function buildNotification({ result, reportDate, dailyUrl }) {
  const date = resolveNotificationDate(reportDate);
  const normalizedResult = String(result || "failure").toLowerCase();
  const successful = normalizedResult === "success";
  const cancelled = normalizedResult === "cancelled";
  const title = shorten(
    successful ? "日报任务完成" : cancelled ? "日报任务已取消" : "日报任务失败",
    TITLE_LIMIT
  );
  const summary = shorten(
    successful
      ? `${date} 日报已生成并部署`
      : cancelled
        ? `${date} 日报运行已取消`
        : `${date} 日报未完成，请检查日志`,
    SUMMARY_LIMIT
  );

  return {
    title,
    summary,
    payload: {
      msg_type: "text",
      content: {
        text: [title, summary, dailyUrl].filter(Boolean).join("\n")
      }
    }
  };
}

export function resolveNotificationDate(value) {
  const input = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function shorten(value, limit) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
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
