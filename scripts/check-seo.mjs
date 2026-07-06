import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ORIGIN = "https://tabularasaband.pl";
const failures = [];

const read = (file) => fs.readFile(path.join(ROOT, file), "utf8");
const count = (value, pattern) => [...value.matchAll(pattern)].length;
const capture = (value, pattern) => value.match(pattern)?.[1] || "";
const fail = (file, message) => failures.push(`${file}: ${message}`);

const sitemap = await read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("sitemap.xml", "contains duplicate URLs");

const pageByUrl = new Map();
for (const url of sitemapUrls) {
  const parsed = new URL(url);
  const file = parsed.pathname === "/" ? "index.html" : parsed.pathname.slice(1);
  try {
    const html = await read(file);
    pageByUrl.set(url, { file, html });
  } catch {
    fail("sitemap.xml", `missing local page for ${url}`);
  }
}

for (const [url, { file, html }] of pageByUrl) {
  const canonical = capture(html, /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const robots = capture(html, /<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const title = capture(html, /<title>([\s\S]*?)<\/title>/i).trim();
  const description = capture(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

  if (canonical !== url) fail(file, `canonical is ${canonical || "missing"}, expected ${url}`);
  if (!robots.includes("index") || robots.includes("noindex")) fail(file, "sitemap page is not indexable");
  if (count(html, /<title>/gi) !== 1 || !title) fail(file, "must contain one non-empty title");
  if (count(html, /<meta\s+[^>]*name=["']description["']/gi) !== 1 || !description) {
    fail(file, "must contain one non-empty meta description");
  }
  if (count(html, /<h1\b/gi) !== 1) fail(file, "must contain exactly one h1");

  const requiredMeta = [
    ["property", "og:type"],
    ["property", "og:site_name"],
    ["property", "og:locale"],
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["property", "og:image:width"],
    ["property", "og:image:height"],
    ["property", "og:image:alt"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
    ["name", "twitter:image:alt"],
  ];
  for (const [attribute, value] of requiredMeta) {
    const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${value}["']`, "i");
    if (!pattern.test(html)) fail(file, `missing ${value}`);
  }

  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      fail(file, `invalid JSON-LD: ${error.message}`);
    }
  }

  const alternates = [...html.matchAll(/<link\s+[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*hreflang=["']([^"']+)["'][^>]*>/gi)];
  if (alternates.length > 0 && !alternates.some((match) => match[2] === "x-default")) {
    fail(file, "localized page is missing x-default hreflang");
  }
  for (const [, alternateUrl] of alternates) {
    if (!alternateUrl.startsWith(ORIGIN)) fail(file, `hreflang URL uses another origin: ${alternateUrl}`);
  }
}

const allHtmlFiles = (await fs.readdir(ROOT)).filter((file) => file.endsWith(".html"));
for (const file of allHtmlFiles) {
  const html = await read(file);
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    const canonical = capture(html, /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    if (sitemapUrls.includes(canonical)) fail(file, "noindex page must not be listed in sitemap");
  }
}

const socialCard = await sharp(path.join(ROOT, "social-card.png")).metadata();
if (socialCard.width !== 1200 || socialCard.height !== 630 || socialCard.format !== "png") {
  fail("social-card.png", "must be a 1200x630 PNG");
}

const manifest = JSON.parse(await read("manifest.json"));
for (const expectedSize of [192, 512]) {
  const icon = manifest.icons?.find((entry) => entry.sizes === `${expectedSize}x${expectedSize}`);
  if (!icon) {
    fail("manifest.json", `missing ${expectedSize}x${expectedSize} icon`);
    continue;
  }
  const metadata = await sharp(path.join(ROOT, icon.src)).metadata();
  if (metadata.width !== expectedSize || metadata.height !== expectedSize) {
    fail("manifest.json", `${icon.src} dimensions do not match its declared size`);
  }
}

const robots = await read("robots.txt");
if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) fail("robots.txt", "missing absolute sitemap URL");

if (failures.length > 0) {
  console.error(`SEO check failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SEO check passed for ${sitemapUrls.length} indexable pages.`);
