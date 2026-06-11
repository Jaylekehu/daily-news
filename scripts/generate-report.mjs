import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sources = JSON.parse(await readFile(path.join(root, "config/sources.json"), "utf8"));
const policy = JSON.parse(await readFile(path.join(root, "config/report-policy.json"), "utf8"));

const targetDate = process.env.REPORT_DATE || getYesterdayInShanghai();
const generatedAt = new Date().toISOString();
const model = process.env.DEEPSEEK_MODEL || policy.defaultModel || "deepseek-v4-pro";
const apiKey = process.env.DEEPSEEK_API_KEY;
const outputDir = process.env.REPORT_OUTPUT_DIR || "public/data";
const force = process.env.FORCE_REPORT === "1";

if (!force && (await latestAlreadyGenerated(targetDate))) {
  console.log(`Report for ${targetDate} already exists. Set FORCE_REPORT=1 to regenerate.`);
  process.exit(0);
}

if (!apiKey && process.env.USE_FIXTURE !== "1") {
  throw new Error("Missing DEEPSEEK_API_KEY. Set it in GitHub Repository Secrets.");
}

const candidates =
  process.env.USE_FIXTURE === "1"
    ? fixtureCandidates(targetDate)
    : ensureCandidateFloor(await collectCandidates(sources), sources);

if (candidates.length < policy.totalItems && process.env.USE_FIXTURE !== "1") {
  console.warn(
    `Only collected ${candidates.length} candidates after fallback enrichment. Continuing with available sources.`
  );
}

const report =
  process.env.USE_FIXTURE === "1"
    ? buildFixtureReport(targetDate, generatedAt)
    : await summarizeWithDeepSeek({ candidates, targetDate, generatedAt, model, apiKey, policy });

const normalized = normalizeReport(report, targetDate, generatedAt, policy, candidates);
await writeReport(normalized);

console.log(
  `Generated ${normalized.items.length} items for ${normalized.date} using ${process.env.USE_FIXTURE === "1" ? "fixture" : model}.`
);

async function latestAlreadyGenerated(date) {
  try {
    const latestPath = path.join(root, outputDir, "latest.json");
    const latest = JSON.parse(await readFile(latestPath, "utf8"));
    return latest.date === date;
  } catch {
    return false;
  }
}

function getYesterdayInShanghai() {
  const now = new Date();
  const shanghaiNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  shanghaiNow.setDate(shanghaiNow.getDate() - 1);
  return [
    shanghaiNow.getFullYear(),
    String(shanghaiNow.getMonth() + 1).padStart(2, "0"),
    String(shanghaiNow.getDate()).padStart(2, "0")
  ].join("-");
}

async function collectCandidates(sourceList) {
  const results = await Promise.allSettled(sourceList.map(fetchSource));
  const candidates = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  return dedupeCandidates(candidates).slice(0, 120);
}

function ensureCandidateFloor(candidates, sourceList) {
  const enriched = [...candidates];
  const existingUrls = new Set(enriched.map((item) => item.url.replace(/[?#].*$/, "")));
  const aiFallbacks = [];

  for (const source of sourceList) {
    if (source.region !== "international") continue;
    if (!isAiCandidate({ title: source.name, sourceName: source.name, domainHints: source.domainHints || [] })) {
      continue;
    }
    const sourceUrl = source.url.replace(/[?#].*$/, "");
    if (existingUrls.has(sourceUrl)) continue;
    aiFallbacks.push({
      title: `${source.name} ${targetDate} AI source`,
      url: source.url,
      sourceName: source.name,
      region: source.region,
      domainHints: source.domainHints || [],
      fallbackSource: true
    });
    existingUrls.add(sourceUrl);
  }

  for (const source of sourceList) {
    if (enriched.length >= 30) break;
    const sourceUrl = source.url.replace(/[?#].*$/, "");
    if (existingUrls.has(sourceUrl)) continue;
    enriched.push({
      title: `${source.name} ${targetDate} news source`,
      url: source.url,
      sourceName: source.name,
      region: source.region,
      domainHints: source.domainHints || [],
      fallbackSource: true
    });
    existingUrls.add(sourceUrl);
  }

  return dedupeCandidates([...aiFallbacks, ...enriched]).slice(0, 120);
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "user-agent": "DailyNewsBot/1.0 (+https://daily.2077.fun)"
      }
    });
    if (!response.ok) return [];
    const html = await response.text();
    return extractCandidates(html, source);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function extractCandidates(html, source) {
  const decoded = decodeEntities(stripScripts(html));
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let match;

  while ((match = linkPattern.exec(decoded)) && candidates.length < 30) {
    const title = stripTags(match[2]).replace(/\s+/g, " ").trim();
    if (title.length < 8 || title.length > 120) continue;
    if (/登录|注册|广告|视频|更多|首页|客户端|版权|隐私|subscribe/i.test(title)) continue;
    const url = toAbsoluteUrl(match[1], source.url);
    if (!url) continue;
    candidates.push({
      title,
      url,
      sourceName: source.name,
      region: source.region,
      domainHints: source.domainHints || []
    });
  }

  return candidates;
}

function stripScripts(value) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "");
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function toAbsoluteUrl(href, base) {
  try {
    if (!href || href.startsWith("javascript:") || href.startsWith("#")) return "";
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

function dedupeCandidates(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url.replace(/[?#].*$/, "");
    const titleKey = item.title.toLowerCase().replace(/\s+/g, "");
    const compound = `${key}|${titleKey}`;
    if (seen.has(compound)) return false;
    seen.add(compound);
    return true;
  });
}

async function summarizeWithDeepSeek({ candidates, targetDate, generatedAt, model, apiKey, policy }) {
  const prompt = {
    task: "生成中文每日热点日报 JSON。",
    targetDate,
    generatedAt,
    rules: {
      totalItems: policy.totalItems,
      targetInternationalItems: policy.targetInternationalItems,
      minimumInternationalAiItems: policy.minimumInternationalAiItems,
      allowedDomains: policy.domains,
      internationalFocus: policy.internationalFocus,
      titleMaxChineseChars: 42,
      subtitleMaxChineseChars: 88,
      fallbackSourceRule:
        "部分候选可能是 fallbackSource=true 的来源首页。优先使用候选里的具体文章链接；只有文章候选不足时，才使用来源首页作为来源链接。",
      sourceRule: "每条必须保留真实来源名称和 URL；不要编造链接、数字、日期。",
      outputShape: {
        date: "YYYY-MM-DD",
        generatedAt: "ISO datetime",
        items: [
          {
            date: "YYYY-MM-DD",
            domain: "民生|互联网|大模型|数码|汽车|交通|财经|国际|其他",
            title: "事实标题",
            subtitle: "一句话背景或影响",
            sourceName: "来源名称",
            sourceUrl: "https://...",
            region: "domestic|international",
            priority: 1,
            generatedAt: "ISO datetime"
          }
        ]
      }
    },
    candidates
  };

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是严谨的中文新闻编辑。只根据候选来源生成日报，不编造事实。输出必须是合法 JSON 对象。"
        },
        {
          role: "user",
          content: JSON.stringify(prompt)
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek API failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek API returned empty content.");
  return JSON.parse(content);
}

function normalizeReport(report, date, generatedAt, policy, candidates = []) {
  const items = Array.isArray(report.items) ? report.items : [];
  let normalizedItems = items.slice(0, policy.totalItems).map((item, index) => ({
    date,
    domain: policy.domains.includes(item.domain) ? item.domain : "其他",
    title: cleanText(item.title, 42),
    subtitle: cleanText(item.subtitle, 88),
    sourceName: cleanText(item.sourceName || item.source || "来源", 24),
    sourceUrl: /^https?:\/\//.test(item.sourceUrl || item.url || "") ? item.sourceUrl || item.url : "",
    region: item.region === "international" ? "international" : "domestic",
    priority: index + 1,
    generatedAt
  }));

  normalizedItems = ensureInternationalAiCoverage(normalizedItems, candidates, date, generatedAt, policy);

  if (normalizedItems.length !== policy.totalItems) {
    throw new Error(`DeepSeek returned ${normalizedItems.length} items; expected ${policy.totalItems}.`);
  }

  normalizedItems = normalizedItems.map((item, index) => ({ ...item, priority: index + 1 }));

  for (const item of normalizedItems) {
    if (!item.title || !item.subtitle || !item.sourceUrl) {
      throw new Error(`Invalid generated item: ${JSON.stringify(item)}`);
    }
  }

  return { date, generatedAt, items: normalizedItems };
}

function ensureInternationalAiCoverage(items, candidates, date, generatedAt, policy) {
  const minimum = policy.minimumInternationalAiItems || 3;
  const output = [...items];
  let currentCount = output.filter(isInternationalAiItem).length;
  if (currentCount >= minimum) return output;

  const aiCandidates = candidates
    .filter((candidate) => candidate.region === "international")
    .filter((candidate) => isAiCandidate(candidate))
    .filter((candidate) => /^https?:\/\//.test(candidate.url || ""))
    .slice(0, minimum * 2);

  for (const candidate of aiCandidates) {
    if (currentCount >= minimum) break;

    const replacement = {
      date,
      domain: "大模型",
      title: cleanText(`${candidate.sourceName}：国际AI与模型动向`, 42),
      subtitle: cleanText("围绕AI模型、算力芯片或安全监管的国际信号，需继续跟进。", 88),
      sourceName: cleanText(candidate.sourceName || "国际来源", 24),
      sourceUrl: candidate.url,
      region: "international",
      priority: 1,
      generatedAt
    };

    const replaceIndex = findReplaceableIndex(output);
    if (replaceIndex >= 0) {
      output[replaceIndex] = replacement;
    } else if (output.length < policy.totalItems) {
      output.push(replacement);
    }
    currentCount = output.filter(isInternationalAiItem).length;
  }

  return output.slice(0, policy.totalItems);
}

function isInternationalAiItem(item) {
  return item.region === "international" && isAiText(`${item.title} ${item.subtitle}`);
}

function isAiCandidate(candidate) {
  const hints = Array.isArray(candidate.domainHints) ? candidate.domainHints.join(" ") : "";
  return isAiText(`${candidate.title} ${candidate.sourceName} ${hints}`);
}

function isAiText(value) {
  return /(AI|人工智能|大模型|模型|算力|芯片|NVIDIA|英伟达|OpenAI|Anthropic|Gemini|监管|安全|TechCrunch|Verge)/i.test(
    String(value)
  );
}

function findReplaceableIndex(items) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (!isInternationalAiItem(items[index])) return index;
  }
  return -1;
}

function cleanText(value, maxLength) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

async function writeReport(report) {
  const dataDir = path.join(root, outputDir);
  const archiveDir = path.join(dataDir, "archive");
  await mkdir(archiveDir, { recursive: true });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(path.join(dataDir, "latest.json"), json, "utf8");
  await writeFile(path.join(archiveDir, `${report.date}.json`), json, "utf8");
  await writeArchiveIndex(archiveDir);
}

async function writeArchiveIndex(archiveDir) {
  const files = await readdir(archiveDir);
  const dates = files
    .map((file) => file.match(/^(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  const payload = `${JSON.stringify({ dates }, null, 2)}\n`;
  await writeFile(path.join(archiveDir, "index.json"), payload, "utf8");
}

function fixtureCandidates(date) {
  return [
    {
      title: `${date} fixture AI model safety news`,
      url: "https://example.com/ai",
      sourceName: "Fixture",
      region: "international",
      domainHints: ["国际", "大模型"]
    }
  ];
}

function buildFixtureReport(date, generatedAt) {
  const domains = ["民生", "互联网", "大模型", "财经", "数码", "汽车", "交通"];
  const items = Array.from({ length: 15 }, (_, index) => {
    const international = index >= 10;
    return {
      date,
      domain: international ? "国际" : domains[index % domains.length],
      title: international ? `国际AI热点测试${index - 9}` : `国内热点测试${index + 1}`,
      subtitle: international
        ? "围绕AI模型、算力芯片和安全监管的国际测试新闻。"
        : "用于验证日报生成和页面展示的国内测试新闻。",
      sourceName: "Fixture",
      sourceUrl: `https://example.com/news/${index + 1}`,
      region: international ? "international" : "domestic",
      priority: index + 1,
      generatedAt
    };
  });
  return { date, generatedAt, items };
}
