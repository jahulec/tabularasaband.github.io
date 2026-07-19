import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { transform } from "lightningcss";
import { PurgeCSS } from "purgecss";
import { minify } from "terser";

const ROOT = process.cwd();

async function buildCss(sourceName, outputName, content) {
  const sourcePath = path.join(ROOT, sourceName);
  const source = await fs.readFile(sourcePath, "utf8");
  const purged = await new PurgeCSS().purge({
    content,
    css: [{ raw: source }],
    safelist: {
      standard: [
        /^is-/,
        /^has-/,
        /^reveal/,
        /^scroll-/,
        /^cookie-/,
        /^modal-/,
        /^gallery-modal-/,
      ],
    },
  });
  const result = transform({
    filename: sourceName,
    code: Buffer.from(purged[0].css),
    minify: true,
  });
  await fs.writeFile(path.join(ROOT, outputName), result.code);
  return result.code;
}

async function buildJs(sourceName, outputName) {
  const source = await fs.readFile(path.join(ROOT, sourceName), "utf8");
  const result = await minify(source, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (!result.code) throw new Error(`Terser returned no output for ${sourceName}`);
  await fs.writeFile(path.join(ROOT, outputName), result.code, "utf8");
  return Buffer.from(result.code);
}

function contentVersion(content) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function normalizeDecorativeSliderImages(html) {
  return html.replace(
    /(<div class="background-slider[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/g,
    (_match, opening, content, closing) => {
      const images = content.replace(/<img\b[^>]*>/g, (tag) => {
        const cleanTag = tag
          .replace(/\s+alt=(?:"[^"]*"|'[^']*')/gi, "")
          .replace(/\s+aria-hidden=(?:"[^"]*"|'[^']*')/gi, "")
          .replace(/\s+draggable=(?:"[^"]*"|'[^']*')/gi, "");
        return cleanTag.replace("<img", '<img alt="" aria-hidden="true" draggable="false"');
      });
      return `${opening}${images}${closing}`;
    },
  );
}

async function updateHtmlAssetVersions(versions) {
  const htmlFiles = (await fs.readdir(ROOT)).filter((file) => file.endsWith(".html"));
  const pageStyles = new Map([
    ["index.html", "styles-home.min.css"],
    ["index-en.html", "styles-home.min.css"],
    ["shows.html", "styles-shows.min.css"],
    ["shows-en.html", "styles-shows.min.css"],
  ]);

  for (const file of htmlFiles) {
    const filePath = path.join(ROOT, file);
    const source = await fs.readFile(filePath, "utf8");
    let output = normalizeDecorativeSliderImages(source);
    const pageStyle = pageStyles.get(file);
    if (pageStyle) {
      output = output.replace(
        /styles(?:-home|-shows)?\.min\.css(?:\?v=[^\"'&<>\s]+)?/g,
        pageStyle,
      );
    }

    for (const [asset, version] of versions) {
      const escapedAsset = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      output = output.replace(
        new RegExp(`(${escapedAsset})(?:\\?v=[^\\"'&<>\\s]+)?`, "g"),
        `$1?v=${version}`,
      );
    }

    if (output !== source) await fs.writeFile(filePath, output, "utf8");
  }
}

const sharedContent = [
  ...((await fs.readdir(ROOT))
    .filter((file) => file.endsWith(".html"))
    .map((file) => path.join(ROOT, file))),
  path.join(ROOT, "script.js"),
  path.join(ROOT, "script-gallery.js"),
];
const homeContent = [path.join(ROOT, "index.html"), path.join(ROOT, "index-en.html"), path.join(ROOT, "script.js")];
const showsContent = [path.join(ROOT, "shows.html"), path.join(ROOT, "shows-en.html"), path.join(ROOT, "script.js")];

const builtAssets = new Map();
builtAssets.set("styles.min.css", await buildCss("styles.css", "styles.min.css", sharedContent));
builtAssets.set("styles-home.min.css", await buildCss("styles.css", "styles-home.min.css", homeContent));
builtAssets.set("styles-shows.min.css", await buildCss("styles.css", "styles-shows.min.css", showsContent));
builtAssets.set("styles-gallery.min.css", await buildCss("styles-gallery.css", "styles-gallery.min.css", sharedContent));
builtAssets.set("script.min.js", await buildJs("script.js", "script.min.js"));
builtAssets.set("script-gallery.min.js", await buildJs("script-gallery.js", "script-gallery.min.js"));

const versions = new Map(
  Array.from(builtAssets, ([asset, content]) => [asset, contentVersion(content)]),
);
await updateHtmlAssetVersions(versions);

console.log("Built optimized assets and updated content-hash cache keys:");
for (const [asset, version] of versions) console.log(`- ${asset}?v=${version}`);
