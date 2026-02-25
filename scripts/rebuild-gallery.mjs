import fs from "node:fs/promises";
import path from "node:path";

const GALLERY_FILES = ["gallery.html", "gallery-en.html"];
const GALERIA_DIR = "galeria";
const OUTPUT_PREFIX = "galeria/_responsive";

function baseName(file) {
  return path.parse(file).name.replace(/\s+/g, "_");
}

function isImage(file) {
  const ext = path.extname(file).toLowerCase();
  return [".webp", ".jpg", ".jpeg", ".png"].includes(ext);
}

function pickBest(images) {
  const map = new Map();
  for (const file of images) {
    const name = path.parse(file).name;
    const ext = path.extname(file).toLowerCase();
    if (!map.has(name)) {
      map.set(name, { file, ext });
      continue;
    }
    const current = map.get(name);
    if (current.ext !== ".webp" && ext === ".webp") {
      map.set(name, { file, ext });
    }
  }
  return Array.from(map.values()).map((v) => v.file);
}

function sortNatural(a, b) {
  return a.localeCompare(b, "pl", { numeric: true, sensitivity: "base" });
}

const files = await fs.readdir(GALERIA_DIR, { withFileTypes: true });
const images = files
  .filter((f) => f.isFile())
  .map((f) => f.name)
  .filter(isImage);

const unique = pickBest(images).sort(sortNatural);

const gridHtml = unique
  .map((file) => {
    const base = baseName(file);
    const src640 = `${OUTPUT_PREFIX}/${base}-w640.webp`;
    const src1280 = `${OUTPUT_PREFIX}/${base}-w1280.webp`;
    return `<img src="${src640}" alt="Zdjęcie Tabula Rasa" loading="lazy" decoding="async" fetchpriority="low" data-full="${src1280}">`;
  })
  .join("\n");

for (const file of GALLERY_FILES) {
  let html = await fs.readFile(file, "utf8");
  const startTag = '<div class="gallery-grid">';
  const startIndex = html.indexOf(startTag);
  if (startIndex === -1) {
    continue;
  }
  const endIndex = html.indexOf("</div>", startIndex);
  if (endIndex === -1) {
    continue;
  }
  const before = html.slice(0, startIndex + startTag.length);
  const after = html.slice(endIndex);
  html = `${before}\n${gridHtml}\n${after}`;
  await fs.writeFile(file, html, "utf8");
}
