import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INPUT_DIRS = [
  "galeria",
  path.join("galeria", "zdjecia_desktop"),
  path.join("galeria", "zdjecia_mobile"),
];

const OUTPUT_ROOT = path.join("galeria", "_responsive");

const SIZES = {
  gallery: [320, 640, 1280],
  desktopHero: [768, 1280, 1920, 2560],
  mobileHero: [360, 640, 960],
};

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function pickSizes(relPath) {
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

async function processImage(filePath) {
  const relPath = path.relative(ROOT, filePath);
  const sizes = pickSizes(relPath);
  const baseName = outputBaseName(filePath);
  const outDir = path.join(
    ROOT,
    OUTPUT_ROOT,
    path.dirname(relPath).replace("galeria", "").replace(/^[\\/]/, "")
  );

  await ensureDir(outDir);

  const image = sharp(filePath, { failOn: "none" });
  const metadata = await image.metadata();

  const jobs = sizes.map(async (width) => {
    if (metadata.width && metadata.width < width) {
      return;
    }
    const outFile = path.join(outDir, `${baseName}-w${width}.webp`);
    try {
      await fs.access(outFile);
      return;
    } catch {
      // continue
    }
    await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(outFile);
  });

  await Promise.all(jobs);
}

async function main() {
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

  const files = Array.from(allFiles).filter((f) => !f.includes(OUTPUT_ROOT));
  console.log(`Found ${files.length} images`);

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    process.stdout.write(`[${i + 1}/${files.length}] ${path.relative(ROOT, file)}\n`);
    // eslint-disable-next-line no-await-in-loop
    await processImage(file);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
