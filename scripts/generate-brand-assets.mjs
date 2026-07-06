import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const logoPath = path.join(ROOT, "logo.png");
const faviconPath = path.join(ROOT, "logo-fav-fix.png");

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 3,
    background: "#000000",
  },
})
  .composite([
    {
      input: await sharp(logoPath)
        .resize({ width: 500, height: 430, fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer(),
      gravity: "center",
    },
  ])
  .png({ compressionLevel: 9, palette: true, quality: 100 })
  .toFile(path.join(ROOT, "social-card.png"));

for (const size of [180, 192, 512]) {
  const outputName = size === 180 ? "apple-touch-icon.png" : `brand-icon-${size}.png`;
  await sharp(faviconPath)
    .resize(size, size, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9, palette: true, quality: 100 })
    .toFile(path.join(ROOT, outputName));
}

console.log("Generated social-card.png and square brand icons.");
