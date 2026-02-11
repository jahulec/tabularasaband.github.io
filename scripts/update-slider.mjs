import fs from "node:fs/promises";

const files = [
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
  "press.html",
  "press-en.html",
  "shop.html",
  "shop-en.html",
  "shows.html",
  "shows-en.html",
];

const mobileMap = {
  "80m": "80m",
  "81m": "81m",
  "82m": "82m",
  "83m": "83m",
  "84m": "84m",
};

const desktopMap = {
  "75d": "75d",
  "73d": "73d",
  "71d": "71d",
  "70d": "70d",
  "72d": "72d",
};

function mobileSrcSet(name) {
  return `galeria/_responsive/zdjecia_mobile/${name}-w360.webp 360w, galeria/_responsive/zdjecia_mobile/${name}-w640.webp 640w, galeria/_responsive/zdjecia_mobile/${name}-w960.webp 960w`;
}

function desktopSrcSet(name) {
  return `galeria/_responsive/zdjecia_desktop/${name}-w768.webp 768w, galeria/_responsive/zdjecia_desktop/${name}-w1280.webp 1280w, galeria/_responsive/zdjecia_desktop/${name}-w1920.webp 1920w, galeria/_responsive/zdjecia_desktop/${name}-w2560.webp 2560w`;
}

for (const file of files) {
  let html = await fs.readFile(file, "utf8");

  html = html.replace(
    /galeria\/zdjecia_desktop\/75d\.webp/g,
    "galeria/_responsive/zdjecia_desktop/75d-w1280.webp"
  );
  html = html.replace(
    /galeria\/zdjecia_mobile\/80m\.webp/g,
    "galeria/_responsive/zdjecia_mobile/80m-w640.webp"
  );

  for (const name of Object.keys(mobileMap)) {
    const re = new RegExp(`data-mobile-src=\"galeria/zdjecia_mobile/${name}\\.webp\"`, "g");
    html = html.replace(
      re,
      `data-mobile-src=\"galeria/_responsive/zdjecia_mobile/${name}-w640.webp\" data-mobile-srcset=\"${mobileSrcSet(name)}\"`
    );
  }

  for (const name of Object.keys(desktopMap)) {
    const re = new RegExp(`data-desktop-src=\"galeria/zdjecia_desktop/${name}\\.webp\"`, "g");
    html = html.replace(
      re,
      `data-desktop-src=\"galeria/_responsive/zdjecia_desktop/${name}-w1280.webp\" data-desktop-srcset=\"${desktopSrcSet(name)}\"`
    );
  }

  // Ensure first slide has srcset after direct path replacements
  html = html.replace(
    /data-mobile-src=\"galeria\/_responsive\/zdjecia_mobile\/80m-w640\.webp\"(?!\s+data-mobile-srcset)/g,
    `data-mobile-src=\"galeria/_responsive/zdjecia_mobile/80m-w640.webp\" data-mobile-srcset=\"${mobileSrcSet("80m")}\"`
  );
  html = html.replace(
    /data-desktop-src=\"galeria\/_responsive\/zdjecia_desktop\/75d-w1280\.webp\"(?!\s+data-desktop-srcset)/g,
    `data-desktop-src=\"galeria/_responsive/zdjecia_desktop/75d-w1280.webp\" data-desktop-srcset=\"${desktopSrcSet("75d")}\"`
  );

  await fs.writeFile(file, html, "utf8");
}
