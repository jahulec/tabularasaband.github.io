import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".mjs", ".xml", ".txt", ".json", ".yml", ".yaml"]);
const SKIP_DIRS = new Set([".git", "node_modules", "archive", "test-results"]);

const MOJIBAKE_PATTERNS = [
  /\u00C3[\u0080-\u00BF]/u,
  /\u00C2[\u0080-\u00BF]/u,
  /\u00E2[\u0080-\u00BF]{2}/u,
  /\u0139\u201A/u,
  /\uFFFD/u,
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...(await walk(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function findMojibake(text) {
  for (const pattern of MOJIBAKE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return { match: match[0], index: match.index ?? 0 };
  }
  return null;
}

function getLineNumber(text, index) {
  if (index <= 0) return 1;
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}

const files = await walk(ROOT);
const issues = [];

for (const filePath of files) {
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) continue;

  const raw = await fs.readFile(filePath);
  const hasBom = raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf;
  const text = raw.toString("utf8");

  if (hasBom) {
    issues.push({
      file: path.relative(ROOT, filePath),
      reason: "UTF-8 BOM detected",
    });
  }

  const mojibake = findMojibake(text);
  if (mojibake) {
    const line = getLineNumber(text, mojibake.index);
    issues.push({
      file: path.relative(ROOT, filePath),
      reason: `Possible mojibake at line ${line}`,
    });
  }
}

if (issues.length > 0) {
  console.error("Encoding check failed:");
  for (const issue of issues) {
    console.error(`- ${issue.file}: ${issue.reason}`);
  }
  process.exit(1);
}

console.log("Encoding check passed.");
