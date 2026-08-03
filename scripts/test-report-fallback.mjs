import assert from "node:assert/strict";
import {
  fillMissingReportItems,
  replaceExcessHotTrendItems
} from "./report-fallback.mjs";

const date = "2026-07-29";
const generatedAt = "2026-07-29T00:00:00.000Z";
const existingItems = Array.from({ length: 14 }, (_, index) => ({
  date,
  domain: "其他",
  title: `已有新闻 ${index + 1}`,
  subtitle: "已有新闻摘要",
  sourceName: "已有来源",
  sourceUrl: `https://example.com/existing/${index + 1}`,
  region: "domestic",
  priority: index + 1,
  generatedAt
}));

const filled = fillMissingReportItems({
  items: existingItems,
  candidates: [
    {
      title: "与日报主题相关的热榜候选",
      url: "https://example.com/trend",
      sourceName: "热榜",
      region: "domestic",
      hotTrend: true
    },
    {
      title: "重复来源不应再次加入",
      url: "https://example.com/existing/1#fragment",
      sourceName: "重复来源",
      region: "domestic"
    },
    {
      title: "国际人工智能模型发布新进展",
      url: "https://example.com/ai-progress",
      sourceName: "Example AI",
      region: "international",
      domainHints: ["AI", "大模型"]
    }
  ],
  date,
  generatedAt,
  totalItems: 15
});

assert.equal(filled.length, 15);
assert.equal(filled[14].sourceUrl, "https://example.com/ai-progress");
assert.equal(filled[14].domain, "大模型");
assert.equal(filled[14].region, "international");
assert.equal(filled.some((item) => item.sourceUrl === "https://example.com/trend"), false);

const unchanged = fillMissingReportItems({
  items: filled,
  candidates: [],
  date,
  generatedAt,
  totalItems: 15
});
assert.deepEqual(unchanged, filled);

const itemsWithExcessTrends = [
  ...Array.from({ length: 4 }, (_, index) => ({
    date,
    domain: "互联网",
    title: `热榜新闻 ${index + 1}`,
    subtitle: "热榜新闻摘要",
    sourceName: "热榜",
    sourceUrl: `https://example.com/hot/${index + 1}`,
    sourceType: "hotTrend",
    region: "domestic",
    priority: index + 1,
    generatedAt
  })),
  ...Array.from({ length: 11 }, (_, index) => ({
    date,
    domain: "其他",
    title: `普通新闻 ${index + 1}`,
    subtitle: "普通新闻摘要",
    sourceName: "普通来源",
    sourceUrl: `https://example.com/regular/${index + 1}`,
    region: "domestic",
    priority: index + 5,
    generatedAt
  }))
];

const capped = replaceExcessHotTrendItems({
  items: itemsWithExcessTrends,
  candidates: [
    {
      title: "用于替换多余热榜的普通新闻",
      url: "https://example.com/regular/replacement",
      sourceName: "替补来源",
      region: "domestic"
    }
  ],
  date,
  generatedAt,
  totalItems: 15,
  maxHotTrendItems: 3
});

assert.equal(capped.length, 15);
assert.equal(capped.filter((item) => item.sourceType === "hotTrend").length, 3);
assert.equal(capped.some((item) => item.sourceUrl === "https://example.com/hot/4"), false);
assert.equal(
  capped.some((item) => item.sourceUrl === "https://example.com/regular/replacement"),
  true
);

console.log("Report fallback tests passed.");
