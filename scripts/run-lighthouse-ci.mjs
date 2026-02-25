import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173";
const OUTPUT_DIR = path.join(ROOT, "archive", "audits", "ci", "latest");

const AUDITS = [
  { id: "index-mobile", url: `${BASE_URL}/index.html`, preset: "mobile" },
  { id: "shows-mobile", url: `${BASE_URL}/shows.html`, preset: "mobile" },
  { id: "index-desktop", url: `${BASE_URL}/index.html`, preset: "desktop" },
  { id: "shows-desktop", url: `${BASE_URL}/shows.html`, preset: "desktop" },
];

const THRESHOLDS = {
  "index-mobile": { performanceMin: 75, lcpMax: 5000, clsMax: 0.1, tbtMax: 300, inpMax: 350 },
  "shows-mobile": { performanceMin: 75, lcpMax: 5000, clsMax: 0.1, tbtMax: 300, inpMax: 350 },
  "index-desktop": { performanceMin: 90, lcpMax: 3500, clsMax: 0.1, tbtMax: 200, inpMax: 300 },
  "shows-desktop": { performanceMin: 90, lcpMax: 3500, clsMax: 0.1, tbtMax: 200, inpMax: 300 },
};
const IS_WINDOWS = process.platform === "win32";

function formatMetric(value, digits = 2) {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return "n/a";
  return Number(value).toFixed(digits);
}

function formatMetricWithUnit(value, unit, digits = 2) {
  const formatted = formatMetric(value, digits);
  return formatted === "n/a" ? formatted : `${formatted}${unit}`;
}

function readAudit(report, id) {
  const performance = (report.categories?.performance?.score ?? 0) * 100;
  const lcp = report.audits?.["largest-contentful-paint"]?.numericValue ?? null;
  const cls = report.audits?.["cumulative-layout-shift"]?.numericValue ?? null;
  const tbt = report.audits?.["total-blocking-time"]?.numericValue ?? null;
  const inp = report.audits?.["interaction-to-next-paint"]?.numericValue ?? null;

  return {
    id,
    performance,
    lcp,
    cls,
    tbt,
    inp,
  };
}

function evaluateThresholds(metric) {
  const threshold = THRESHOLDS[metric.id];
  if (!threshold) return [];

  const failures = [];
  if (metric.performance < threshold.performanceMin) {
    failures.push(`performance ${formatMetric(metric.performance, 1)} < ${threshold.performanceMin}`);
  }
  if (metric.lcp !== null && metric.lcp > threshold.lcpMax) {
    failures.push(`LCP ${formatMetric(metric.lcp, 0)}ms > ${threshold.lcpMax}ms`);
  }
  if (metric.cls !== null && metric.cls > threshold.clsMax) {
    failures.push(`CLS ${formatMetric(metric.cls, 3)} > ${threshold.clsMax}`);
  }
  if (metric.tbt !== null && metric.tbt > threshold.tbtMax) {
    failures.push(`TBT ${formatMetric(metric.tbt, 0)}ms > ${threshold.tbtMax}ms`);
  }
  if (metric.inp !== null && metric.inp > threshold.inpMax) {
    failures.push(`INP ${formatMetric(metric.inp, 0)}ms > ${threshold.inpMax}ms`);
  }

  return failures;
}

async function waitForServer(url, retries = 30, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) return;
    } catch (_) {
      // Wait and retry.
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Server did not become ready: ${url}`);
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
await waitForServer(`${BASE_URL}/index.html`);

const results = [];
const failures = [];

for (const audit of AUDITS) {
  const outputPath = path.join(OUTPUT_DIR, `${audit.id}.json`);
  const args = [
    "--yes",
    "lighthouse",
    audit.url,
    "--quiet",
    "--output=json",
    `--output-path=${outputPath}`,
    "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu",
    "--only-categories=performance",
  ];

  if (audit.preset === "desktop") {
    args.push("--preset=desktop");
  }

  const run = spawnSync("npx", args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: IS_WINDOWS,
  });

  if (run.error) {
    failures.push(`${audit.id}: ${run.error.message}`);
    continue;
  }

  if (run.status !== 0) {
    failures.push(`${audit.id}: lighthouse command failed (exit ${run.status})`);
    continue;
  }

  const reportRaw = await fs.readFile(outputPath, "utf8");
  const report = JSON.parse(reportRaw);
  const metric = readAudit(report, audit.id);
  const thresholdFailures = evaluateThresholds(metric);
  results.push(metric);

  if (thresholdFailures.length > 0) {
    failures.push(`${audit.id}: ${thresholdFailures.join("; ")}`);
  }
}

const summaryPath = path.join(OUTPUT_DIR, "summary.json");
await fs.writeFile(
  summaryPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      results,
      failures,
    },
    null,
    2
  ),
  "utf8"
);

for (const metric of results) {
  console.log(
    [
      metric.id.padEnd(14),
      `perf=${formatMetric(metric.performance, 1)}`,
      `lcp=${formatMetricWithUnit(metric.lcp, "ms", 0)}`,
      `cls=${formatMetric(metric.cls, 3)}`,
      `tbt=${formatMetricWithUnit(metric.tbt, "ms", 0)}`,
      `inp=${formatMetricWithUnit(metric.inp, "ms", 0)}`,
    ].join(" | ")
  );
}

if (failures.length > 0) {
  console.error("Lighthouse quality gate failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Lighthouse quality gate passed.");
