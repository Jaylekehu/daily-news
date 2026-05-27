import { readFile } from "node:fs/promises";

const file = process.argv[2] || "public/data/latest.json";
const report = JSON.parse(await readFile(file, "utf8"));

const allowedDomains = new Set(["民生", "互联网", "大模型", "数码", "汽车", "交通", "财经", "国际", "其他"]);
const requiredFields = [
  "date",
  "domain",
  "title",
  "subtitle",
  "sourceName",
  "sourceUrl",
  "region",
  "priority",
  "generatedAt"
];

const mojibakePattern = /[�]|鐨|鍥|姘戠|澶ф|涓|鏃ユ|鏉ユ|鍥介|浜掕|璐㈢|姹借|绠楀|鈥|銆/;

function fail(message) {
  console.error(`Report validation failed: ${message}`);
  process.exit(1);
}

function assertReadable(value, label) {
  if (mojibakePattern.test(String(value))) fail(`${label} looks garbled`);
}

if (!report || typeof report !== "object") fail("root must be an object");
if (!/^\d{4}-\d{2}-\d{2}$/.test(report.date || "")) fail("date must be YYYY-MM-DD");
if (!Date.parse(report.generatedAt)) fail("generatedAt must be an ISO-like datetime");
if (!Array.isArray(report.items)) fail("items must be an array");
if (report.items.length !== 15) fail(`items must contain exactly 15 entries, got ${report.items.length}`);

const internationalItems = report.items.filter((item) => item.region === "international");
if (internationalItems.length < 3) fail("at least 3 international items are required");

const internationalAiKeywords = /(AI|人工智能|大模型|模型|算力|芯片|NVIDIA|英伟达|OpenAI|Anthropic|Gemini|监管|安全)/i;
const internationalAiItems = internationalItems.filter((item) =>
  internationalAiKeywords.test(`${item.title} ${item.subtitle}`)
);
if (internationalAiItems.length < 3) fail("at least 3 international AI/model items are required");

report.items.forEach((item, index) => {
  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      fail(`item ${index + 1} missing ${field}`);
    }
  }

  if (!allowedDomains.has(item.domain)) fail(`item ${index + 1} has unsupported domain ${item.domain}`);
  if (!["domestic", "international"].includes(item.region)) {
    fail(`item ${index + 1} has invalid region ${item.region}`);
  }
  if (!/^https?:\/\//.test(item.sourceUrl)) fail(`item ${index + 1} sourceUrl must be http(s)`);
  if (String(item.title).length > 42) fail(`item ${index + 1} title is too long`);
  if (String(item.subtitle).length > 88) fail(`item ${index + 1} subtitle is too long`);
  if (Number(item.priority) !== index + 1) fail(`item ${index + 1} priority must equal display order`);

  assertReadable(item.domain, `item ${index + 1} domain`);
  assertReadable(item.title, `item ${index + 1} title`);
  assertReadable(item.subtitle, `item ${index + 1} subtitle`);
  assertReadable(item.sourceName, `item ${index + 1} sourceName`);
});

console.log(
  `Report OK: ${report.items.length} items, ${internationalItems.length} international, ${internationalAiItems.length} international AI/model.`
);
