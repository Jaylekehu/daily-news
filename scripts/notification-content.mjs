const TITLE_LIMIT = 15;
const SUMMARY_LIMIT = 30;

export function buildDailyNotification({ result, reportDate, dailyUrl }) {
  const date = resolveNotificationDate(reportDate);
  const shortDate = formatShortDate(date);
  const normalizedResult = String(result || "failure").toLowerCase();
  const successful = normalizedResult === "success";
  const cancelled = normalizedResult === "cancelled";
  const testing = normalizedResult === "test";
  const title = shorten(
    testing
      ? `${shortDate}日报通知测试`
      : successful
      ? `${shortDate}日报发布成功`
      : cancelled
        ? `${shortDate}日报运行取消`
        : `${shortDate}日报发布失败`,
    TITLE_LIMIT
  );
  const summary = shorten(
    testing
      ? `微信提醒已连通：${dailyUrl}`
      : successful
      ? `含15条新闻：${dailyUrl}`
      : cancelled
        ? `运行已取消：${dailyUrl}`
        : `请检查运行：${dailyUrl}`,
    SUMMARY_LIMIT
  );

  return { title, summary };
}

export function formatShortDate(date) {
  const [, , month, day] = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
  return month && day ? `${Number(month)}月${Number(day)}日` : "";
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
