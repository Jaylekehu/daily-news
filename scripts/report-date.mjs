const REPORT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayInShanghai(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function resolveReportDate(explicitDate, now = new Date()) {
  const value = String(explicitDate || "").trim();
  if (!value) return getTodayInShanghai(now);
  if (!REPORT_DATE_PATTERN.test(value)) {
    throw new Error(`REPORT_DATE must be YYYY-MM-DD, received: ${value}`);
  }
  return value;
}
