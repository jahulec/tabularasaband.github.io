import fs from "node:fs/promises";

const files = ["about.html", "about-en.html"];
const map = {
  "127Plik%20.webp": "127Plik_",
  "106Plik%20.webp": "106Plik_",
  "105Plik%20.webp": "105Plik_",
  "107Plik%20.webp": "107Plik_",
  "100Plik.webp": "100Plik",
};

for (const file of files) {
  let html = await fs.readFile(file, "utf8");
  for (const [key, base] of Object.entries(map)) {
    const src320 = `galeria/_responsive/${base}-w320.webp`;
    const src640 = `galeria/_responsive/${base}-w640.webp`;
    const src1280 = `galeria/_responsive/${base}-w1280.webp`;
    const replacement = `src=\"${src320}\" srcset=\"${src320} 320w, ${src640} 640w, ${src1280} 1280w\" sizes=\"(max-width: 768px) 50vw, 300px\"`;
    html = html.replace(new RegExp(`src=\"galeria/${key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\"`, "g"), replacement);
  }
  await fs.writeFile(file, html, "utf8");
}
