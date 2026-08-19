import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const START = (name) => `<!-- CMS:${name}:START -->`;
const END = (name) => `<!-- CMS:${name}:END -->`;

const readJson = async (relativePath) => JSON.parse(
  await fs.readFile(path.join(ROOT, relativePath), "utf8"),
);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attr(value) {
  return escapeHtml(value);
}

function publicPath(value) {
  const text = String(value ?? "").trim();
  return text.startsWith("/") ? text.slice(1) : text;
}

function phoneHref(value) {
  return `tel:${String(value ?? "").replace(/[^+\d]/g, "")}`;
}

function managed(name, html) {
  return `${START(name)}\n${html.trim()}\n${END(name)}`;
}

function replaceManaged(source, name, replacement, fallbackPattern) {
  const start = START(name);
  const end = END(name);
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  const block = managed(name, replacement);

  if (startIndex >= 0 && endIndex > startIndex) {
    const suffix = source.slice(endIndex + end.length).replace(/^\r?\n?/, "");
    return `${source.slice(0, startIndex)}${block}\n${suffix}`;
  }

  if (!fallbackPattern.test(source)) {
    throw new Error(`Cannot find fallback block for ${name}`);
  }
  return source.replace(fallbackPattern, `${block}\n`);
}

function localeValue(item, base, lang) {
  return item[`${base}${lang === "en" ? "En" : "Pl"}`] ?? item[base] ?? "";
}

function formatDate(value, lang) {
  if (!value) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function renderHomeHero(home, lang) {
  const hero = home.hero;
  const pl = lang === "pl";
  return `<section class="home-hero home-landing-hero" aria-labelledby="homeHeroTitle" data-home-section data-home-tone="dark">
    <div class="home-hero-copy" data-home-motion data-motion-speed="-0.10">
        <p class="home-hero-eyebrow">${escapeHtml(localeValue(hero, "eyebrow", lang))}</p>
        <h1 id="homeHeroTitle">${escapeHtml(hero.title)}</h1>
        <p>${localeValue(hero, "lead", lang)}</p>
        <div class="home-hero-actions" aria-label="${pl ? "Najważniejsze akcje" : "Primary actions"}">
            <a class="home-hero-link primary" href="${attr(localeValue(hero, "primaryUrl", lang))}">${escapeHtml(localeValue(hero, "primaryLabel", lang))}</a>
            <a class="home-hero-link" href="${attr(localeValue(hero, "secondaryUrl", lang))}">${escapeHtml(localeValue(hero, "secondaryLabel", lang))}</a>
        </div>
    </div>
</section>`;
}

function renderHomeRelease(home, lang) {
  const release = home.release;
  const pl = lang === "pl";
  const sectionId = pl ? "muzyka" : "music";
  return `<section id="${sectionId}" class="home-section home-music-feature" aria-labelledby="homeMusicTitle" data-home-section data-home-tone="light-blur">
    <div class="home-section-lead">
        <p class="home-section-kicker">${escapeHtml(localeValue(release, "kicker", lang))}</p>
        <h2 id="homeMusicTitle">${escapeHtml(release.title)}</h2>
        <p>${escapeHtml(localeValue(release, "description", lang))}</p>
    </div>
    <div class="home-release-layout">
        <div class="home-release-cover home-release-video" data-home-motion data-motion-y="-18" data-motion-x="-8" data-motion-scale="0.018" data-motion-mask>
            <button class="youtube-facade" type="button" data-youtube-id="${attr(release.youtubeId)}" data-youtube-title="Tabula Rasa - ${attr(release.title)}" aria-label="${pl ? "Odtwórz teledysk" : "Play music video"} Tabula Rasa - ${attr(release.title)}">
                <img src="https://i.ytimg.com/vi_webp/${attr(release.youtubeId)}/maxresdefault.webp" alt="" width="1280" height="720" loading="lazy" decoding="async">
                <span class="youtube-facade-play" aria-hidden="true"></span>
            </button>
        </div>
        <div class="home-release-copy" data-home-motion data-motion-y="12" data-motion-x="0" data-motion-stagger="0.10">
            <p class="home-release-label">${pl ? "Premiera" : "Release"}</p>
            <p class="home-release-countdown" aria-live="polite">${escapeHtml(localeValue(release, "status", lang))}</p>
            <p>${localeValue(release, "body", lang)}</p>
            <a class="home-text-link" href="${attr(release.videoUrl)}" target="_blank" rel="noopener noreferrer">${pl ? "Obejrzyj teledysk" : "Watch the video"}</a>
            <a class="home-text-link" href="${attr(release.streamingUrl)}" target="_blank" rel="noopener noreferrer">${pl ? "Posłuchaj singla" : "Listen to the single"}</a>
        </div>
    </div>
</section>`;
}

function renderHomeNews(news, lang) {
  const pl = lang === "pl";
  const page = pl ? "news.html" : "news-en.html";
  const cards = news.slice(0, 3).map((article, index) => {
    const featured = index === 0 ? " home-news-v2-card-featured" : "";
    const configuredLines = localeValue(article, "homeTitleLines", lang);
    const title = index === 0 && Array.isArray(configuredLines) && configuredLines.length > 0
      ? configuredLines.map((line) => `<span class="home-news-v2-title-line">${escapeHtml(line)}</span>`).join("")
      : escapeHtml(localeValue(article, "title", lang));
    return `        <a class="home-news-v2-card${featured}" href="${page}#${attr(article.slug)}" data-home-motion data-motion-y="${index === 0 ? "-16" : "8"}" data-motion-x="${index % 2 ? "10" : "-10"}">
            <picture><img src="${attr(publicPath(article.cover))}" alt="${attr(localeValue(article, "alt", lang))}" loading="lazy" decoding="async"></picture>
            <span class="home-news-v2-copy">
                <span>${escapeHtml(localeValue(article, "category", lang))} / ${escapeHtml(article.date)}</span>
                <strong>${title}</strong>
                <small>${pl ? "Czytaj więcej" : "Read more"}</small>
            </span>
        </a>`;
  }).join("\n");

  return `<section id="news" class="home-section home-news-v2" aria-labelledby="welcome" data-home-section data-home-tone="light-blur">
    <div class="home-section-lead">
        <p class="home-section-kicker">${pl ? "Aktualności / blog" : "News / journal"}</p>
        <h2 id="welcome">${pl ? "Co nowego" : "From the band notebook"}</h2>
        <p>${pl ? "Premiery, trasa i historie, które nie mieszczą się w jednym poście." : "Releases, touring and stories too big for a single post."}</p>
    </div>
    <div class="home-news-v2-grid">
${cards}
    </div>
    <a class="home-section-cta" href="${page}">${pl ? "Wszystkie aktualności" : "All news"}</a>
</section>`;
}

function renderAbout(about, lang) {
  const pl = lang === "pl";
  const members = about.members.map((member) => `  <div class="member" data-member="${attr(member.displayName)} - ${attr(localeValue(member, "role", lang))}">
    <img src="${attr(publicPath(member.image))}" alt="${attr(localeValue(member, "alt", lang))}" loading="lazy" decoding="async">
  </div>`).join("\n");
  const sections = about.sections.map((section) => `<h3>${escapeHtml(localeValue(section, "heading", lang))}</h3>\n${localeValue(section, "body", lang)}`).join("\n\n");
  return `<section id="news" class="about-page">
  <h1 id="welcome">${pl ? "O nas" : "About"}</h1>
  <h2>${pl ? "Członkowie" : "Members"}</h2>
  <div class="members-container">
${members}
  </div>
  <div class="history press-history about-history">
    <h2>${pl ? "Kim jesteśmy" : "Who we are"}</h2>
    ${localeValue(about, "intro", lang)}
    ${sections}
  </div>
</section>`;
}

function renderMusic(music, lang) {
  const pl = lang === "pl";
  const videos = music.videos.map((video) => `        <div class="song">
            <h3>${escapeHtml(video.title)}</h3>
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/${attr(video.youtubeId)}" title="Tabula Rasa - ${attr(video.title)} ${pl ? "teledysk" : "music video"}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>
        </div>`).join("\n");
  return `<section id="news" class="music-section music-page">
    <h1 id="welcome">${pl ? "Muzyka" : "Music"}</h1>
    <div class="music-best-tracks">
        <h2>${pl ? "Utwory" : "Tracks"}</h2>
        <div class="spotify-wrapper spotify-wrapper-featured">
            <iframe src="${attr(music.spotifyEmbedUrl)}" title="Tabula Rasa ${pl ? "utwory na Spotify" : "tracks on Spotify"}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
    </div>
    <h2>${pl ? "Teledyski" : "Music videos"}</h2>
    <div class="videos videos-with-clips music-videos">
${videos}
    </div>
</section>`;
}

function renderContact(site, lang) {
  const pl = lang === "pl";
  const contact = site.contact;
  const phones = contact.bandPhones.map((phone) => `<p><a href="${attr(phoneHref(phone))}">${escapeHtml(phone)}</a></p>`).join("\n            ");
  return `<section id="news" class="contact-page">
    <h1 id="welcome">${pl ? "Kontakt" : "Contact"}</h1>
    <div class="contact-layout">
        <div class="contact-container contact-form-panel">
            <h2>${pl ? "Zadaj nam pytanie" : "Ask us anything"}</h2>
            <form action="${attr(site.integrations.contactFormEndpoint)}" method="POST" class="contact-form">
                <div class="form-group"><label for="name">${pl ? "Imię i nazwisko" : "Your name"}</label><input type="text" id="name" name="name" placeholder="${pl ? "Wpisz swoje imię" : "Enter your name"}" required></div>
                <div class="form-group"><label for="email">${pl ? "Adres e-mail" : "Email address"}</label><input type="email" id="email" name="email" placeholder="${pl ? "Wpisz swój e-mail" : "Enter your email"}" required></div>
                <div class="form-group"><label for="message">${pl ? "Wiadomość" : "Message"}</label><textarea id="message" name="message" rows="5" placeholder="${pl ? "Wpisz swoją wiadomość" : "Enter your message"}" required></textarea></div>
                <button type="submit" class="contact-submit">${pl ? "Wyślij wiadomość" : "Send message"}</button>
            </form>
        </div>
        <div class="contact-info contact-info-panel">
            <h2>${pl ? "Dane kontaktowe" : "Contact details"}</h2>
            <p><a href="mailto:${attr(contact.generalEmail)}">${escapeHtml(contact.generalEmail)}</a></p>
            <h3>Management / Booking</h3>
            <p><a href="mailto:${attr(contact.bookingEmail)}">${escapeHtml(contact.bookingEmail)}</a></p>
            <p><a href="${attr(phoneHref(contact.bookingPhone))}">${escapeHtml(contact.bookingPhone)}</a></p>
            <h3>${pl ? "Zespół" : "Band"}</h3>
            ${phones}
            <h3>${pl ? "Sprawy techniczne / IT" : "Technical / IT"}</h3>
            <p><a href="${attr(phoneHref(contact.technicalPhone))}">${escapeHtml(contact.technicalPhone)}</a></p>
        </div>
    </div>
</section>`;
}

function renderShop(site, lang) {
  const pl = lang === "pl";
  return `<section id="news" class="concerts-section">
    <h1 id="welcome">${pl ? "Sklep" : "Shop"}</h1>
    <p class="shop-status-message">${escapeHtml(localeValue(site.shop, "message", lang))}</p>
</section>`;
}

function renderPress(site, press, about, lang) {
  const pl = lang === "pl";
  const documents = site.documents;
  const pack = publicPath(pl ? documents.pressPackPl : documents.pressPackEn);
  const rider = publicPath(pl ? documents.riderPl : documents.riderEn);
  const lineup = about.members.map((member) => `<li>${escapeHtml(member.name)} — ${escapeHtml(localeValue(member, "role", lang))}</li>`).join("\n            ");
  const achievements = press.achievements.map((group) => {
    const items = localeValue(group, "items", lang).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                    ");
    return `<div class="achievement-group"><h3 class="achievement-year">${group.year}</h3><ul>${items}</ul></div>`;
  }).join("\n            ");
  return `<section id="news">
    <h1 id="welcome">Presspack</h1>
    <h2 class="rider-title">Press Pack Tabula Rasa</h2>
    <div class="rider-section"><a href="${attr(pack)}" class="rider-download-btn" download rel="noopener noreferrer">${pl ? "Pobierz Press Pack PDF" : "Download Press Pack PDF"}</a></div>
    <h2 class="rider-title">Rider Tabula Rasa</h2>
    <div class="rider-section"><a href="${attr(rider)}" class="rider-download-btn" download rel="noopener noreferrer">${pl ? "Pobierz Rider PDF" : "Download Rider PDF"}</a></div>
    <div class="press-history">
        <h2>${pl ? "Opis zespołu" : "Band description"}</h2>
        ${localeValue(press, "description", lang)}
        <h3>${pl ? "W skład zespołu wchodzą:" : "Line-up"}</h3>
        <ul>${lineup}</ul>
        <h2>${pl ? "Osiągnięcia" : "Achievements"}</h2>
        <div class="press-achievements">${achievements}</div>
        <h2>${pl ? "Zobacz więcej" : "See more"}</h2>
        <div class="rider-section"><a href="${attr(documents.pressPhotosUrl)}" target="_blank" class="rider-download-btn" rel="noopener noreferrer">${pl ? "Pobierz zdjęcia zespołu" : "Press photos"}</a></div>
        <div class="rider-section"><a href="${attr(documents.stageAnimationUrl)}" target="_blank" class="rider-download-btn" rel="noopener noreferrer">${pl ? "Animacja na koncerty" : "Stage animation"}</a></div>
        <div class="rider-section"><a href="${attr(documents.showcaseUrl)}" target="_blank" class="rider-download-btn" rel="noopener noreferrer">${pl ? "Link do wizytówki" : "Band showcase"}</a></div>
    </div>
</section>`;
}

function renderNews(news, lang) {
  const pl = lang === "pl";
  const cards = news.map((article, index) => `<a class="home-news-v2-card${index === 0 ? " home-news-v2-card-featured" : ""} news-hub-card" href="#${attr(article.slug)}" data-news-open="${attr(article.slug)}" aria-label="${pl ? "Czytaj" : "Read"}: ${attr(localeValue(article, "title", lang))}">
                <picture><img src="${attr(publicPath(article.cover))}" alt="${attr(localeValue(article, "alt", lang))}" loading="lazy" decoding="async"></picture>
                <span class="home-news-v2-copy"><span>${escapeHtml(localeValue(article, "category", lang))} / ${escapeHtml(article.date)}</span><strong>${escapeHtml(localeValue(article, "title", lang))}</strong><small>${pl ? "Czytaj artykuł" : "Read article"}</small></span>
            </a>`).join("\n            ");

  const stories = news.map((article) => {
    const video = article.youtubeId ? `<div class="news-reader-video"><iframe src="https://www.youtube.com/embed/${attr(article.youtubeId)}" title="${attr(localeValue(article, "title", lang))}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : "";
    const cta = article.ctaUrl ? `<p class="news-reader-action"><a href="${attr(article.ctaUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(localeValue(article, "ctaLabel", lang) || (pl ? "Zobacz więcej" : "Learn more"))} <span aria-hidden="true">↗</span></a></p>` : "";
    return `<article class="news-reader-story" data-news-article="${attr(article.slug)}" aria-labelledby="article-${attr(article.slug)}-title" hidden>
        <picture class="news-reader-media"><img src="${attr(publicPath(article.cover))}" alt="${attr(localeValue(article, "alt", lang))}"></picture>
        <div class="news-reader-copy">
            <div class="news-reader-heading"><p class="news-reader-meta"><time datetime="${attr(article.date)}">${escapeHtml(formatDate(article.date, lang))}</time><span>${escapeHtml(localeValue(article, "category", lang))}</span></p><h2 id="article-${attr(article.slug)}-title">${escapeHtml(localeValue(article, "title", lang))}</h2><p class="news-reader-lead">${escapeHtml(localeValue(article, "lead", lang))}</p></div>
            <div class="news-reader-prose">${localeValue(article, "body", lang)}${video}${cta}</div>
        </div>
    </article>`;
  }).join("\n    ");

  return `<main id="news" class="news-hub-page">
    <h1 id="welcome">${pl ? "Aktualności" : "News"}</h1>
    <section class="news-hub-index" data-news-index aria-label="${pl ? "Lista aktualności" : "News list"}"><div class="news-hub-grid">${cards}</div></section>
</main>
<section class="news-reader" data-news-reader role="dialog" aria-modal="true" aria-label="${pl ? "Artykuł" : "Article"}" tabindex="-1" hidden>
    <button class="news-reader-back" type="button" data-news-close aria-label="${pl ? "Wróć do listy aktualności" : "Back to news list"}"><span aria-hidden="true">←</span><span>${pl ? "Cofnij" : "Back"}</span></button>
    ${stories}
</section>`;
}

async function loadNews() {
  const dir = path.join(ROOT, "content", "news");
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".json"));
  const entries = await Promise.all(files.map((file) => readJson(path.join("content", "news", file))));
  return entries.filter((entry) => entry.published !== false).sort((a, b) => b.date.localeCompare(a.date));
}

async function writeIfChanged(filePath, content) {
  const previous = await fs.readFile(filePath, "utf8").catch(() => "");
  if (previous === content) return false;
  await fs.writeFile(filePath, content, "utf8");
  return true;
}

function addCmsDataScript(html, hash) {
  const src = `cms-data.js?v=${hash}`;
  if (/src="cms-data\.js(?:\?v=[^"]+)?"/.test(html)) {
    return html.replace(/src="cms-data\.js(?:\?v=[^"]+)?"/, `src="${src}"`);
  }
  return html.replace(/(<script src="script(?:\.min)?\.js[^>]*><\/script>)/, `<script src="${src}" defer></script>\n$1`);
}

function updateFooter(html, site, lang) {
  const text = `&copy; ${Number(site.footer.year)} ${escapeHtml(localeValue(site.footer, "copyright", lang))}`;
  return html.replace(/(<p class="shop-footer-copy">)[\s\S]*?(<\/p>)/, `$1${text}$2`);
}

async function renderPage(file, lang, renderer, cmsDataHash) {
  const filePath = path.join(ROOT, file);
  let html = await fs.readFile(filePath, "utf8");
  html = renderer(html);
  html = addCmsDataScript(html, cmsDataHash);
  html = updateFooter(html, site, lang);
  return writeIfChanged(filePath, html);
}

const [site, home, about, music, press, news] = await Promise.all([
  readJson("data/site.json"),
  readJson("data/home.json"),
  readJson("data/about.json"),
  readJson("data/music.json"),
  readJson("data/press.json"),
  loadNews(),
]);

const cmsData = `window.TABULA_RASA_CMS = ${JSON.stringify({
  socialLinks: site.socialLinks.map((link) => ({ href: link.url, label: link.label, icon: link.platform })),
  integrations: site.integrations,
})};\n`;
const cmsDataHash = crypto.createHash("sha256").update(cmsData).digest("hex").slice(0, 12);
let changed = await writeIfChanged(path.join(ROOT, "cms-data.js"), cmsData);
for (const lang of ["pl", "en"]) {
  const suffix = lang === "en" ? "-en" : "";
  changed = await renderPage(`index${suffix}.html`, lang, (html) => {
    let next = replaceManaged(html, `home-hero-${lang}`, renderHomeHero(home, lang), /<section class="home-hero home-landing-hero"[\s\S]*?<\/section>/);
    next = replaceManaged(next, `home-release-${lang}`, renderHomeRelease(home, lang), /<section id="(?:muzyka|music)" class="home-section home-music-feature"[\s\S]*?<\/section>/);
    return replaceManaged(next, `home-news-${lang}`, renderHomeNews(news, lang), /<section id="news" class="home-section home-news-v2"[\s\S]*?<\/section>/);
  }, cmsDataHash) || changed;
  changed = await renderPage(`about${suffix}.html`, lang, (html) => replaceManaged(html, `about-${lang}`, renderAbout(about, lang), /<section id="news" class="about-page">[\s\S]*?<\/section>/), cmsDataHash) || changed;
  changed = await renderPage(`music${suffix}.html`, lang, (html) => replaceManaged(html, `music-${lang}`, renderMusic(music, lang), /<section id="news" class="music-section music-page">[\s\S]*?<\/section>/), cmsDataHash) || changed;
  changed = await renderPage(`contact${suffix}.html`, lang, (html) => replaceManaged(html, `contact-${lang}`, renderContact(site, lang), /<section id="news" class="contact-page">[\s\S]*?<\/section>/), cmsDataHash) || changed;
  changed = await renderPage(`shop${suffix}.html`, lang, (html) => replaceManaged(html, `shop-${lang}`, renderShop(site, lang), /<section id="news" class="concerts-section">[\s\S]*?<\/section>/), cmsDataHash) || changed;
  changed = await renderPage(`press${suffix}.html`, lang, (html) => replaceManaged(html, `press-${lang}`, renderPress(site, press, about, lang), /<section id="news">[\s\S]*?<\/section>/), cmsDataHash) || changed;
  changed = await renderPage(`news${suffix}.html`, lang, (html) => replaceManaged(html, `news-${lang}`, renderNews(news, lang), /<main id="news" class="news-hub-page">[\s\S]*?(?=<footer class="shop-footer">)/), cmsDataHash) || changed;
}

const rootHtmlFiles = (await fs.readdir(ROOT)).filter((file) => file.endsWith(".html"));
for (const file of rootHtmlFiles) {
  const filePath = path.join(ROOT, file);
  let html = await fs.readFile(filePath, "utf8");
  const lang = /-en\.html$|^(terms|privacy-policy)\.html$/.test(file) ? "en" : "pl";
  html = updateFooter(addCmsDataScript(html, cmsDataHash), site, lang);
  changed = await writeIfChanged(filePath, html) || changed;
}

console.log(changed ? "CMS content rendered." : "CMS content already up to date.");
