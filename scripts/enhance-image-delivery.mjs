import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
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

const HERO_DESKTOP_SRCSET = "galeria/_responsive/zdjecia_desktop/75d-w768.webp?v=20260331c 768w, galeria/_responsive/zdjecia_desktop/75d-w1280.webp?v=20260331c 1280w, galeria/_responsive/zdjecia_desktop/75d-w1920.webp?v=20260331c 1920w, galeria/_responsive/zdjecia_desktop/75d-w2560.webp?v=20260331c 2560w";
const HERO_MOBILE_SRCSET = "galeria/_responsive/zdjecia_mobile/80m-w360.webp?v=20260331c 360w, galeria/_responsive/zdjecia_mobile/80m-w640.webp?v=20260331c 640w, galeria/_responsive/zdjecia_mobile/80m-w960.webp?v=20260331c 960w";

function stripQuery(url) {
  return url.split("?")[0];
}

async function assetExists(url) {
  const rel = stripQuery(url);
  try {
    await fs.access(path.join(ROOT, rel));
    return true;
  } catch {
    return false;
  }
}

async function canUseAvifSrcset(srcset) {
  const urls = srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);

  if (urls.length === 0) return false;

  for (const url of urls) {
    const avifUrl = url.replace(/\.webp(\?[^,\s]*)?$/i, ".avif$1");
    // eslint-disable-next-line no-await-in-loop
    if (!(await assetExists(avifUrl))) return false;
  }

  return true;
}

async function addAvifSources(html) {
  const sourceRe = /<source\b([^>]*?)\bsrcset="([^"]+\.webp[^"]*)"([^>]*?)\btype="image\/webp"([^>]*)>/g;
  let output = "";
  let lastIndex = 0;

  for (const match of html.matchAll(sourceRe)) {
    const [sourceTag, beforeSrcset, srcset, afterSrcset, afterType] = match;
    const previousChunk = html.slice(lastIndex, match.index);
    output += previousChunk;

    const alreadyHasAvif = /type="image\/avif"/.test(previousChunk.slice(-500));
    if (!alreadyHasAvif && await canUseAvifSrcset(srcset)) {
      const avifSrcset = srcset.replace(/\.webp(\?[^,\s]*)?/gi, ".avif$1");
      output += `<source${beforeSrcset}srcset="${avifSrcset}"${afterSrcset}type="image/avif"${afterType}>`;
    }

    output += sourceTag;
    lastIndex = match.index + sourceTag.length;
  }

  return output + html.slice(lastIndex);
}

function enhanceHeroPreloads(html) {
  return html
    .replace(
      /<link id="preloadFirstImage" rel="preload" as="image" href="([^"]+)" media="\((min-width: 769px)\)"(?: imagesrcset="[^"]*")?(?: imagesizes="[^"]*")?(?: fetchpriority="[^"]*")?>/g,
      `<link id="preloadFirstImage" rel="preload" as="image" href="$1" media="($2)" imagesrcset="${HERO_DESKTOP_SRCSET}" imagesizes="100vw" fetchpriority="high">`
    )
    .replace(
      /<link id="preloadFirstImageMobile" rel="preload" as="image" href="([^"]+)" media="\((max-width: 768px)\)"(?: imagesrcset="[^"]*")?(?: imagesizes="[^"]*")?(?: fetchpriority="[^"]*")?>/g,
      `<link id="preloadFirstImageMobile" rel="preload" as="image" href="$1" media="($2)" imagesrcset="${HERO_MOBILE_SRCSET}" imagesizes="100vw" fetchpriority="high">`
    );
}

function enhanceGalleryImages(html) {
  return html.replace(
    /<img src="galeria\/_responsive\/([^"]+)-w640\.webp" alt="([^"]*)" loading="lazy" decoding="async" fetchpriority="low" data-full="galeria\/_responsive\/([^"]+)-w1280\.webp">/g,
    (_match, thumbBase, alt, fullBase) => {
      const src320 = `galeria/_responsive/${thumbBase}-w320.webp`;
      const src640 = `galeria/_responsive/${thumbBase}-w640.webp`;
      const full640 = `galeria/_responsive/${fullBase}-w640.webp`;
      const full1280 = `galeria/_responsive/${fullBase}-w1280.webp`;
      return `<img src="${src640}" srcset="${src320} 320w, ${src640} 640w" sizes="(max-width: 760px) 50vw, (max-width: 1200px) 25vw, 320px" alt="${alt}" loading="lazy" decoding="async" fetchpriority="low" data-full="${full1280}" data-full-srcset="${full640} 640w, ${full1280} 1280w" data-full-sizes="100vw">`;
    }
  );
}

function normalizeGeneratedWhitespace(html) {
  return html.replace(/^ +\t+/gm, "    ");
}

async function main() {
  for (const file of HTML_FILES) {
    const abs = path.join(ROOT, file);
    let html = await fs.readFile(abs, "utf8");
    html = enhanceHeroPreloads(html);
    html = enhanceGalleryImages(html);
    html = await addAvifSources(html);
    html = normalizeGeneratedWhitespace(html);
    await fs.writeFile(abs, html, "utf8");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
