import fs from "node:fs/promises";
import path from "node:path";
import iconv from "iconv-lite";

const exts = new Set([".html", ".css", ".js", ".xml", ".txt"]);
const mojibakePattern = /Ã|Ä|Å|Ĺ|â€™|â€“|â€”|â€|Â/;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "archive") {
        continue;
      }
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

const root = process.cwd();
const files = await walk(root);

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!exts.has(ext)) continue;

  const text = await fs.readFile(file, "utf8");
  if (!mojibakePattern.test(text)) continue;

  const buf = iconv.encode(text, "windows-1250");
  const repaired = buf.toString("utf8");

  const beforeHits = (text.match(mojibakePattern) || []).length;
  const afterHits = (repaired.match(mojibakePattern) || []).length;

  if (afterHits <= beforeHits) {
    await fs.writeFile(file, repaired, "utf8");
    process.stdout.write(`fixed: ${path.relative(root, file)}\n`);
  }
}
