const defaultUserAgent = "DailyNewsBot/1.0 (+https://daily.2077.fun)";

export async function collectHotTrendCandidates(
  config,
  { fetchImpl = fetch, logger = console } = {}
) {
  if (!config?.enabled || !Array.isArray(config.platforms) || !config.platforms.length) {
    return [];
  }

  const results = await Promise.allSettled(
    config.platforms.map((platform) => fetchHotTrendPlatform(platform, config, fetchImpl))
  );

  const rawCandidates = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      rawCandidates.push(...result.value);
      return;
    }

    logger.warn?.(
      `Hot trend source ${config.platforms[index].name} unavailable: ${result.reason?.message || "unknown error"}`
    );
  });

  return selectRelevantHotTrends(rawCandidates, config);
}

async function fetchHotTrendPlatform(platform, config, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(config.requestTimeoutMs || 10000)
  );

  try {
    const response = await fetchImpl(platform.url, {
      signal: controller.signal,
      headers: { "user-agent": defaultUserAgent }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.code && Number(payload.code) !== 200) {
      throw new Error(`API code ${payload.code}`);
    }

    const items = Array.isArray(payload?.data) ? payload.data : [];
    return items
      .slice(0, Number(config.itemsPerPlatform || 30))
      .map((item, index) => normalizeHotTrendItem(item, platform, index))
      .filter(Boolean);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeHotTrendItem(item, platform, index) {
  const title = cleanValue(item?.title || item?.name || item?.keyword);
  const url = cleanValue(item?.link || item?.url);
  if (!title || !/^https?:\/\//.test(url)) return null;

  return {
    title,
    summary: cleanValue(item?.detail || item?.desc || item?.abstract),
    url,
    sourceName: platform.name,
    region: "domestic",
    domainHints: [],
    hotTrend: true,
    hotRank: positiveNumber(item?.rank) || index + 1,
    hotValue: cleanValue(
      item?.hot_value_desc || item?.score_desc || item?.hot_value || item?.score
    ),
    trendPlatforms: [platform.name],
    sourceQuality: Number(platform.sourceQuality || 1)
  };
}

export function selectRelevantHotTrends(candidates, config) {
  const minimumScore = Number(config.minimumRelevanceScore || 2);
  const relevant = candidates
    .map((candidate) => {
      const relevance = scoreHotTrend(candidate, config);
      if (relevance.score < minimumScore) return null;
      return {
        ...candidate,
        domainHints: [relevance.domain],
        relevanceScore: relevance.score,
        matchedKeywords: relevance.matchedKeywords,
        candidateType: "hotTrend"
      };
    })
    .filter(Boolean)
    .sort(compareHotTrendCandidates);

  const deduped = [];
  for (const candidate of relevant) {
    const duplicateIndex = deduped.findIndex((item) =>
      areNearDuplicateCandidates(item, candidate, config)
    );

    if (duplicateIndex < 0) {
      deduped.push(candidate);
      continue;
    }

    const existing = deduped[duplicateIndex];
    const mergedPlatforms = [
      ...new Set([...(existing.trendPlatforms || []), ...(candidate.trendPlatforms || [])])
    ];
    const preferred =
      compareCandidateQuality(candidate, existing) < 0 ? candidate : existing;

    deduped[duplicateIndex] = {
      ...preferred,
      relevanceScore: Math.max(existing.relevanceScore, candidate.relevanceScore),
      matchedKeywords: [
        ...new Set([...(existing.matchedKeywords || []), ...(candidate.matchedKeywords || [])])
      ],
      trendPlatforms: mergedPlatforms
    };
  }

  return deduped
    .sort(compareHotTrendCandidates)
    .slice(0, Number(config.maxCandidates || 12));
}

function scoreHotTrend(candidate, config) {
  const rawTitle = String(candidate.title || "");
  const rawSummary = String(candidate.summary || "");
  const title = normalizeForMatch(rawTitle);
  const strongKeywords = new Set(
    (config.strongKeywords || []).map((keyword) => normalizeForMatch(keyword))
  );
  const excluded = (config.excludedKeywords || []).some((keyword) =>
    title.includes(normalizeForMatch(keyword))
  );
  if (excluded) return { score: 0, domain: "其他", matchedKeywords: [] };

  let best = { score: 0, domain: "其他", matchedKeywords: [] };
  for (const group of config.topicGroups || []) {
    let score = 0;
    let titleScore = 0;
    const matchedKeywords = [];
    const matchedNormalizedKeywords = [];

    const keywords = [...(group.keywords || [])].sort(
      (left, right) => normalizeForMatch(right).length - normalizeForMatch(left).length
    );
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeForMatch(keyword);
      if (!normalizedKeyword) continue;
      if (matchedNormalizedKeywords.some((matched) => matched.includes(normalizedKeyword))) {
        continue;
      }

      const titleMatch = containsKeyword(rawTitle, keyword);
      const summaryMatch = containsKeyword(rawSummary, keyword);
      if (!titleMatch && !summaryMatch) continue;

      const keywordScore = titleMatch ? (strongKeywords.has(normalizedKeyword) ? 3 : 2) : 1;
      score += keywordScore;
      titleScore += titleMatch ? keywordScore : 0;
      matchedKeywords.push(keyword);
      matchedNormalizedKeywords.push(normalizedKeyword);
    }

    if (titleScore >= Number(config.minimumRelevanceScore || 3) && score > best.score) {
      best = { score, domain: group.domain, matchedKeywords };
    }
  }

  return best;
}

function containsKeyword(value, keyword) {
  const text = String(value || "");
  const normalizedKeyword = normalizeForMatch(keyword);
  if (!normalizedKeyword) return false;

  if (/^[a-z0-9]+$/i.test(String(keyword))) {
    const escaped = String(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  }

  return normalizeForMatch(text).includes(normalizedKeyword);
}

function compareHotTrendCandidates(left, right) {
  return (
    right.relevanceScore - left.relevanceScore ||
    compareCandidateQuality(left, right) ||
    left.hotRank - right.hotRank
  );
}

function compareCandidateQuality(left, right) {
  return (
    Number(right.sourceQuality || 0) - Number(left.sourceQuality || 0) ||
    Number(Boolean(right.summary)) - Number(Boolean(left.summary)) ||
    right.title.length - left.title.length
  );
}

function areNearDuplicateCandidates(left, right, config) {
  const normalizedLeft = normalizeForMatch(left.title);
  const normalizedRight = normalizeForMatch(right.title);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  if (
    Math.min(normalizedLeft.length, normalizedRight.length) >= 6 &&
    (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft))
  ) {
    return true;
  }

  const leftChars = new Set(normalizedLeft);
  const rightChars = new Set(normalizedRight);
  const commonChars = [...leftChars].filter((character) => rightChars.has(character)).length;
  const overlap = commonChars / Math.min(leftChars.size, rightChars.size);
  if (commonChars >= 4 && overlap >= 0.8) return true;

  const strongKeywords = new Set(
    (config.strongKeywords || []).map((keyword) => normalizeForMatch(keyword))
  );
  const sharedStrongKeywords = (left.matchedKeywords || [])
    .map((keyword) => normalizeForMatch(keyword))
    .filter(
      (keyword) =>
        strongKeywords.has(keyword) &&
        (right.matchedKeywords || []).some(
          (rightKeyword) => normalizeForMatch(rightKeyword) === keyword
        )
    );

  return sharedStrongKeywords.some((keyword) => {
    const leftRemainder = normalizedLeft.replaceAll(keyword, "");
    const rightRemainder = normalizedRight.replaceAll(keyword, "");
    const ignoredCharacters = new Set("的一了是在和与及后再多为有");
    const leftRemainderChars = new Set(
      [...leftRemainder].filter((character) => !ignoredCharacters.has(character))
    );
    const rightRemainderChars = new Set(
      [...rightRemainder].filter((character) => !ignoredCharacters.has(character))
    );
    const sharedContext = [...leftRemainderChars].filter((character) =>
      rightRemainderChars.has(character)
    ).length;
    return sharedContext >= 2;
  });
}

function normalizeForMatch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function cleanValue(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}
