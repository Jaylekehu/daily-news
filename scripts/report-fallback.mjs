export function fillMissingReportItems({
  items,
  candidates,
  date,
  generatedAt,
  totalItems
}) {
  const output = Array.isArray(items) ? items.slice(0, totalItems) : [];
  if (output.length >= totalItems) return output;

  const usedUrls = new Set(
    output.map((item) => canonicalSourceUrl(item.sourceUrl)).filter(Boolean)
  );
  const eligibleCandidates = (Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => !candidate.hotTrend)
    .filter((candidate) => /^https?:\/\//.test(candidate.url || ""))
    .sort(
      (left, right) =>
        Number(Boolean(left.fallbackSource)) - Number(Boolean(right.fallbackSource))
    );

  for (const candidate of eligibleCandidates) {
    if (output.length >= totalItems) break;

    const sourceUrl = candidate.url;
    const canonicalUrl = canonicalSourceUrl(sourceUrl);
    if (!canonicalUrl || usedUrls.has(canonicalUrl)) continue;

    const sourceName = cleanText(candidate.sourceName || "来源", 24);
    const title = cleanText(
      candidate.fallbackSource
        ? `${sourceName}：今日值得关注的新闻线索`
        : candidate.title,
      42
    );
    if (!title) continue;

    output.push({
      date,
      domain: inferDomain(candidate),
      title,
      subtitle: cleanText(
        candidate.fallbackSource
          ? `来自${sourceName}的公开来源，作为当日补充线索，详情以原始页面为准。`
          : `来自${sourceName}的当日候选新闻，详情以原始报道为准。`,
        88
      ),
      sourceName,
      sourceUrl,
      region: candidate.region === "international" ? "international" : "domestic",
      priority: output.length + 1,
      generatedAt
    });
    usedUrls.add(canonicalUrl);
  }

  return output;
}

export function replaceExcessHotTrendItems({
  items,
  candidates,
  date,
  generatedAt,
  totalItems,
  maxHotTrendItems
}) {
  const maximum = Math.max(0, Number(maxHotTrendItems) || 0);
  let selectedHotTrendItems = 0;
  const cappedItems = [];

  for (const item of (Array.isArray(items) ? items : []).slice(0, totalItems)) {
    if (item.sourceType === "hotTrend") {
      if (selectedHotTrendItems >= maximum) continue;
      selectedHotTrendItems += 1;
    }
    cappedItems.push(item);
  }

  return fillMissingReportItems({
    items: cappedItems,
    candidates,
    date,
    generatedAt,
    totalItems
  });
}

function inferDomain(candidate) {
  const text = `${candidate.title || ""} ${candidate.sourceName || ""} ${(
    candidate.domainHints || []
  ).join(" ")}`;

  if (/(AI|人工智能|大模型|模型|算力|芯片|OpenAI|Anthropic|Gemini|NVIDIA|英伟达)/i.test(text)) {
    return "大模型";
  }
  if (/(汽车|新能源车|智能驾驶|车企)/i.test(text)) return "汽车";
  if (/(交通|物流|航空|铁路|航运)/i.test(text)) return "交通";
  if (/(财经|金融|经济|股票|基金|市场)/i.test(text)) return "财经";
  if (/(手机|电脑|硬件|数码|消费电子)/i.test(text)) return "数码";
  if (/(互联网|平台|软件|应用|网络)/i.test(text)) return "互联网";
  if (/(民生|教育|医疗|就业|住房|消费)/i.test(text)) return "民生";
  if (candidate.region === "international") return "国际";
  return "其他";
}

function canonicalSourceUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function cleanText(value, maxLength) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
