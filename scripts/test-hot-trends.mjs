import assert from "node:assert/strict";
import { collectHotTrendCandidates } from "./hot-trends.mjs";

const config = {
  enabled: true,
  maxCandidates: 3,
  itemsPerPlatform: 20,
  minimumRelevanceScore: 3,
  requestTimeoutMs: 1000,
  platforms: [
    { name: "平台甲", url: "https://example.com/a", sourceQuality: 1 },
    { name: "平台乙", url: "https://example.com/b", sourceQuality: 3 }
  ],
  topicGroups: [
    { domain: "大模型", keywords: ["AI", "大模型", "芯片"] },
    { domain: "民生", keywords: ["地震", "就业"] }
  ],
  strongKeywords: ["大模型", "芯片", "地震", "就业"],
  excludedKeywords: ["明星", "新剧"]
};

const payloads = {
  "https://example.com/a": {
    code: 200,
    data: [
      { title: "某公司发布新一代AI芯片", link: "https://news.example.com/ai-a" },
      { title: "青海地震", link: "https://news.example.com/quake-a" },
      { title: "Rail services resume", link: "https://news.example.com/not-ai" },
      { title: "明星新剧官宣", link: "https://news.example.com/show" }
    ]
  },
  "https://example.com/b": {
    code: 200,
    data: [
      {
        title: "新一代AI芯片正式发布",
        desc: "面向大模型推理与训练。",
        link: "https://news.example.com/ai-b"
      },
      {
        title: "青海发生地震，多地有震感",
        desc: "应急响应已经启动。",
        link: "https://news.example.com/quake-b"
      },
      {
        title: "青海再发5.8级地震",
        link: "https://news.example.com/quake-b-duplicate"
      }
    ]
  }
};

const fetchImpl = async (url) => ({
  ok: true,
  status: 200,
  json: async () => payloads[url]
});

const candidates = await collectHotTrendCandidates(config, {
  fetchImpl,
  logger: { warn() {} }
});

assert.equal(candidates.length, 2);
assert.equal(candidates.some((item) => item.title.includes("明星")), false);
assert.equal(candidates[0].sourceName, "平台乙");
assert.equal(candidates[0].domainHints[0], "大模型");
assert.deepEqual(candidates[0].trendPlatforms.sort(), ["平台乙", "平台甲"]);
assert.equal(candidates[1].domainHints[0], "民生");

const noMatchFetch = async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    code: 200,
    data: [{ title: "明星新剧官宣", link: "https://news.example.com/show-only" }]
  })
});
const noMatches = await collectHotTrendCandidates(config, {
  fetchImpl: noMatchFetch,
  logger: { warn() {} }
});
assert.deepEqual(noMatches, []);

console.log("Hot trend selection tests passed.");
