import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INPUT_DIRS = [
  "artykul",
  "galeria",
  path.join("galeria", "zdjecia_desktop"),
  path.join("galeria", "zdjecia_mobile"),
];

const OUTPUT_ROOT = path.join("galeria", "_responsive");
const AVIF_BACKFILL_DIRS = [
  OUTPUT_ROOT,
  "artykul",
];
const HTML_FILES = [
  "index.html",
  "index-en.html",
  "about.html",
  "about-en.html",
  "contact.html",
  "contact-en.html",
  "gallery.html",
  "gallery-en.html",
  "music.html",
  "music-en.html",
  "news.html",
  "news-en.html",
  "press.html",
  "press-en.html",
  "shop.html",
  "shop-en.html",
  "shows.html",
  "shows-en.html",
  "polityka-prywatnosci.html",
  "privacy-policy.html",
  "regulamin.html",
  "terms.html",
];

const SIZES = {
  article: [420, 640, 760, 1200],
  gallery: [320, 640, 1280],
  desktopHero: [768, 1280, 1920, 2560],
  mobileHero: [360, 640, 960],
};

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const GENERATED_SIZE_RE = /-w\d+\.(?:jpe?g|png|webp|avif)$/i;

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function pickSizes(relPath) {
  if (relPath.startsWith(`artykul${path.sep}`)) {
    return SIZES.article;
  }
  if (relPath.includes(path.join("galeria", "zdjecia_desktop"))) {
    return SIZES.desktopHero;
  }
  if (relPath.includes(path.join("galeria", "zdjecia_mobile"))) {
    return SIZES.mobileHero;
  }
  return SIZES.gallery;
}

function outputBaseName(filePath) {
  const parsed = path.parse(filePath);
  return parsed.name.replace(/\s+/g, "_");
}

function outputDirFor(relPath) {
  if (relPath.startsWith(`artykul${path.sep}`)) {
    return path.join(ROOT, path.dirname(relPath));
  }

  return path.join(
    ROOT,
    OUTPUT_ROOT,
    path.dirname(relPath).replace("galeria", "").replace(/^[\\/]/, "")
  );
}

function isReferencedArticleSource(filePath, referencedWebp) {
  const relPath = path.relative(ROOT, filePath);
  if (!relPath.startsWith(`artykul${path.sep}`)) return true;

  const baseName = outputBaseName(filePath);
  return Array.from(referencedWebp).some((ref) => (
    ref.startsWith(path.normalize(`artykul/${baseName}-w`))
  ));
}

async function listImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_responsive") {
        continue;
      }
      files.push(...(await listImages(fullPath)));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

async function processImage(filePath, referencedWebp, avifBackfillWebp) {
  const relPath = path.relative(ROOT, filePath);
  const baseName = outputBaseName(filePath);
  const articleSource = relPath.startsWith(`artykul${path.sep}`);
  const sizes = pickSizes(relPath).filter((width) => (
    !articleSource
    || referencedWebp.has(path.normalize(`artykul/${baseName}-w${width}.webp`))
  ));
  const outDir = outputDirFor(relPath);

  await ensureDir(outDir);

  const image = sharp(filePath, { failOn: "none" });
  const metadata = await image.metadata();

  const jobs = sizes.flatMap((width) => {
    if (metadata.width && metadata.width < width) {
      return [];
    }

    const webpOutFile = path.join(outDir, `${baseName}-w${width}.webp`);
    const webpRel = path.normalize(path.relative(ROOT, webpOutFile));
    const variants = [{ format: "webp", quality: 78 }];

    if (avifBackfillWebp.has(webpRel)) {
      variants.push({ format: "avif", quality: 54 });
    }

    return variants.map(async ({ format, quality }) => {
      const outFile = path.join(outDir, `${baseName}-w${width}.${format}`);
      try {
        await fs.access(outFile);
        return;
      } catch {
        // continue
      }

      const pipeline = image.clone().resize({ width, withoutEnlargement: true });
      if (format === "avif") {
        await pipeline.avif({ quality, effort: 5 }).toFile(outFile);
      } else {
        await pipeline.webp({ quality }).toFile(outFile);
      }
    });
  });

  await Promise.all(jobs);
}

async function backfillAvifFromWebp(filePath) {
  const parsed = path.parse(filePath);
  const outFile = path.join(parsed.dir, `${parsed.name}.avif`);
  try {
    await fs.access(outFile);
    return false;
  } catch {
    // continue
  }

  await sharp(filePath, { failOn: "none" })
    .avif({ quality: 54, effort: 5 })
    .toFile(outFile);
  return true;
}

async function collectReferencedWebpFiles() {
  const referenced = new Set();
  const webpRefRe = /(?:src|srcset|href|data-[\w-]+)="([^"]+\.webp[^"]*)"/g;

  for (const file of HTML_FILES) {
    const abs = path.join(ROOT, file);
    let html = "";
    try {
      // eslint-disable-next-line no-await-in-loop
      html = await fs.readFile(abs, "utf8");
    } catch {
      continue;
    }

    for (const match of html.matchAll(webpRefRe)) {
      const refs = match[1]
        .split(",")
        .map((part) => part.trim().split(/\s+/)[0])
        .filter((url) => url.endsWith(".webp") || url.includes(".webp?"));

      for (const url of refs) {
        referenced.add(path.normalize(stripQuery(url)));
      }
    }
  }

  return referenced;
}

async function collectAvifBackfillWebpFiles() {
  const requiredWebp = new Set();
  const quotedImageRefRe = /[A-Za-z0-9_./()%-]+\.(?:avif|webp)(?:\?[^"',\s)]*)?/g;
  const webpSourceRe = /<source\b[^>]*\bsrcset="([^"]+\.webp[^"]*)"[^>]*\btype="image\/webp"[^>]*>/g;

  for (const file of HTML_FILES) {
    const abs = path.join(ROOT, file);
    let html = "";
    try {
      // eslint-disable-next-line no-await-in-loop
      html = await fs.readFile(abs, "utf8");
    } catch {
      continue;
    }

    for (const match of html.matchAll(quotedImageRefRe)) {
      const url = stripQuery(match[0]);
      if (url.endsWith(".avif")) {
        requiredWebp.add(path.normalize(url.replace(/\.avif$/i, ".webp")));
      }
    }

    for (const match of html.matchAll(webpSourceRe)) {
      for (const part of match[1].split(",")) {
        const url = stripQuery(part.trim().split(/\s+/)[0]);
        if (url.endsWith(".webp")) {
          requiredWebp.add(path.normalize(url));
        }
      }
    }
  }

  return requiredWebp;
}

function stripQuery(url) {
  return url.split("?")[0];
}

async function main() {
  const referencedWebp = await collectReferencedWebpFiles();
  const avifBackfillWebp = await collectAvifBackfillWebpFiles();
  const allFiles = new Set();
  for (const dir of INPUT_DIRS) {
    const abs = path.join(ROOT, dir);
    try {
      const files = await listImages(abs);
      files.forEach((f) => allFiles.add(f));
    } catch {
      // ignore missing folders
    }
  }

  const files = Array.from(allFiles).filter((f) => (
    !f.includes(OUTPUT_ROOT)
    && !GENERATED_SIZE_RE.test(path.basename(f))
    && isReferencedArticleSource(f, referencedWebp)
  ));
  console.log(`Found ${files.length} images`);

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    process.stdout.write(`[${i + 1}/${files.length}] ${path.relative(ROOT, file)}\n`);
    // eslint-disable-next-line no-await-in-loop
    await processImage(file, referencedWebp, avifBackfillWebp);
  }

  const backfillFiles = [];
  for (const dir of AVIF_BACKFILL_DIRS) {
    const abs = path.join(ROOT, dir);
    try {
      const filesInDir = await listImages(abs);
      backfillFiles.push(...filesInDir.filter((file) => (
        path.extname(file).toLowerCase() === ".webp"
        && GENERATED_SIZE_RE.test(path.basename(file))
        && avifBackfillWebp.has(path.normalize(path.relative(ROOT, file)))
      )));
    } catch {
      // ignore missing folders
    }
  }

  let created = 0;
  for (let i = 0; i < backfillFiles.length; i += 1) {
    const file = backfillFiles[i];
    process.stdout.write(`[avif ${i + 1}/${backfillFiles.length}] ${path.relative(ROOT, file)}\n`);
    // eslint-disable-next-line no-await-in-loop
    if (await backfillAvifFromWebp(file)) created += 1;
  }

  console.log(`Created ${created} AVIF backfill files.`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
