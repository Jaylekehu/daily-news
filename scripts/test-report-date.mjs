import assert from "node:assert/strict";
import { getTodayInShanghai, resolveReportDate } from "./report-date.mjs";

assert.equal(
  getTodayInShanghai(new Date("2026-07-27T16:05:00.000Z")),
  "2026-07-28",
  "Shanghai date should advance at 00:00 China Standard Time"
);
assert.equal(
  getTodayInShanghai(new Date("2026-07-28T15:59:59.999Z")),
  "2026-07-28",
  "Shanghai date should remain unchanged before local midnight"
);
assert.equal(
  getTodayInShanghai(new Date("2026-07-28T16:00:00.000Z")),
  "2026-07-29",
  "Shanghai date should advance exactly at local midnight"
);
assert.equal(resolveReportDate("", new Date("2026-07-27T16:05:00.000Z")), "2026-07-28");
assert.equal(resolveReportDate("2026-07-01"), "2026-07-01");
assert.throws(() => resolveReportDate("2026/07/28"), /YYYY-MM-DD/);

console.log("Report date tests passed.");
