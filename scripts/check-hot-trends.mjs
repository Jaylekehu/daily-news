import { readFile } from "node:fs/promises";
import path from "node:path";
import { collectHotTrendCandidates } from "./hot-trends.mjs";

const root = process.cwd();
const config = JSON.parse(
  await readFile(path.join(root, "config/hot-trends.json"), "utf8")
);
const candidates = await collectHotTrendCandidates(config);

if (!candidates.length) {
  console.log("No core-topic hot trends found. The daily report will use zero hot-trend items.");
  process.exit(0);
}

console.log(`Found ${candidates.length} relevant hot-trend candidates:`);
candidates.forEach((candidate, index) => {
  console.log(
    `${index + 1}. [${candidate.domainHints[0]}] ${candidate.title} — ${
      candidate.trendPlatforms.join(" / ")
    }（命中：${candidate.matchedKeywords.join("、")}）`
  );
});
