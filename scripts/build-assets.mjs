import fs from "node:fs/promises";
import path from "node:path";
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
    minify: false,
  });
  await fs.writeFile(path.join(ROOT, outputName), result.code);
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
}

const sharedContent = [
  ...((await fs.readdir(ROOT))
    .filter((file) => file.endsWith(".html"))
    .map((file) => path.join(ROOT, file))),
  path.join(ROOT, "script.js"),
  path.join(ROOT, "script-gallery.js"),
];

await buildCss("styles.css", "styles.min.css", sharedContent);
await buildCss("styles-gallery.css", "styles-gallery.min.css", sharedContent);
await buildJs("script.js", "script.min.js");
await buildJs("script-gallery.js", "script-gallery.min.js");

console.log("Built optimized CSS and minified JavaScript assets.");
