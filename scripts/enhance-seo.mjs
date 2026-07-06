import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://tabularasaband.pl";
const SOCIAL_IMAGE = `${SITE_ORIGIN}/social-card.png`;
const BRAND_LOGO = `${SITE_ORIGIN}/brand-icon-512.png`;

const entries = await fs.readdir(ROOT, { withFileTypes: true });
const htmlFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => entry.name)
  .sort();

function attributeContent(html, attributeName, attributeValue) {
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attributeName}=["']${attributeValue}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  return html.match(pattern)?.[1] || "";
}

function titleContent(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() || "Tabula Rasa";
}

function canonicalUrl(html) {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || SITE_ORIGIN;
}

function removeImmediateGtmBootstrap(html) {
  return html.replace(
    /\s*<script>\s*\(function\(w,d,s,l,i\)[\s\S]*?GTM-MK42J45H'\);\s*<\/script>\s*/g,
    "\n",
  );
}

function ensureRobotsMeta(html, isNoindex) {
  const content = isNoindex
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const tag = `<meta name="robots" content="${content}">`;
  const pattern = /<meta\s+[^>]*name=["']robots["'][^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/(<meta\s+name=["']description["'][^>]*>)/i, `$1\n    ${tag}`);
}

function ensureAppleTouchIcon(html) {
  if (/rel=["']apple-touch-icon["']/i.test(html)) return html;
  const tag = '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">';
  const iconPattern = /(<link\s+[^>]*rel=["']icon["'][^>]*>)/i;
  if (iconPattern.test(html)) return html.replace(iconPattern, `$1\n    ${tag}`);
  return html.replace("</head>", `    ${tag}\n</head>`);
}

function ensureNewsXDefault(html, fileName) {
  if (!["news.html", "news-en.html"].includes(fileName) || /hreflang=["']x-default["']/i.test(html)) {
    return html;
  }
  const tag = `    <link rel="alternate" href="${SITE_ORIGIN}/news.html" hreflang="x-default">`;
  const enAlternate = /(\s*<link\s+rel=["']alternate["']\s+href=["'][^"']+news-en\.html["']\s+hreflang=["']en["']>)/i;
  return html.replace(enAlternate, `$1\n${tag}`);
}

function socialMetadata(html, fileName) {
  const title = titleContent(html);
  const description = attributeContent(html, "name", "description");
  const canonical = canonicalUrl(html);
  const lang = html.match(/<html\s+[^>]*lang=["']([^"']+)["']/i)?.[1]?.toLowerCase() || "pl";
  const locale = lang.startsWith("en") ? "en_US" : "pl_PL";
  const alternateLocale = lang.startsWith("en") ? "pl_PL" : "en_US";
  const imageAlt = lang.startsWith("en")
    ? "Tabula Rasa official band logo"
    : "Oficjalne logo zespołu Tabula Rasa";
  const type = fileName.startsWith("news") ? "blog" : "website";

  const block = [
    `<meta property="og:type" content="${type}">`,
    '<meta property="og:site_name" content="Tabula Rasa">',
    `<meta property="og:locale" content="${locale}">`,
    `<meta property="og:locale:alternate" content="${alternateLocale}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${SOCIAL_IMAGE}">`,
    `<meta property="og:image:secure_url" content="${SOCIAL_IMAGE}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${imageAlt}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${SOCIAL_IMAGE}">`,
    `<meta name="twitter:image:alt" content="${imageAlt}">`,
  ].map((line) => `\t${line}`).join("\n");

  let next = html
    .replace(/\s*<meta\s+[^>]*property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/\s*<meta\s+[^>]*name=["']twitter:[^"']+["'][^>]*>/gi, "");

  const firstJsonLd = /(\s*<script\s+type=["']application\/ld\+json["'])/i;
  if (firstJsonLd.test(next)) return next.replace(firstJsonLd, `\n${block}\n$1`);
  return next.replace("</head>", `\n${block}\n</head>`);
}

function normalizeAssetReferences(html) {
  return html
    .replace(/href=["']styles\.css(?:\?[^"']*)?["']/gi, 'href="styles.min.css?v=20260706"')
    .replace(/href=["']styles-gallery\.css(?:\?[^"']*)?["']/gi, 'href="styles-gallery.min.css?v=20260706"')
    .replace(/src=["']script\.js(?:\?[^"']*)?["']/gi, 'src="script.min.js?v=20260706"')
    .replace(/src=["']script-gallery\.js(?:\?[^"']*)?["']/gi, 'src="script-gallery.min.js?v=20260706"');
}

function ensureStaticCookieBanner(html, fileName) {
  if (fileName === "mapa.html" || html.includes('id="trCookieConsentBanner"')) return html;
  const isEnglish = /<html\s+[^>]*lang=["']en/i.test(html);
  const copy = isEnglish
    ? {
        title: "Privacy settings",
        description: "We use necessary cookies and optional analytics and marketing tools only with your consent.",
        acceptAll: "Accept all",
        rejectOptional: "Reject optional",
        settings: "Settings",
        saveSettings: "Save settings",
        closeSettings: "Close",
        requiredLabel: "Necessary",
        requiredHint: "Always active",
        analyticsLabel: "Analytics",
        analyticsHint: "Traffic and performance measurement",
        marketingLabel: "Marketing",
        marketingHint: "Ad and social media measurement",
        privacyLabel: "Privacy policy",
        termsLabel: "Terms",
        privacyHref: "privacy-policy.html",
        termsHref: "terms.html",
      }
    : {
        title: "Ustawienia prywatności",
        description: "Używamy cookies niezbędnych oraz opcjonalnych narzędzi analitycznych i marketingowych tylko po Twojej zgodzie.",
        acceptAll: "Akceptuj wszystkie",
        rejectOptional: "Odrzuc opcjonalne",
        settings: "Ustawienia",
        saveSettings: "Zapisz ustawienia",
        closeSettings: "Zamknij",
        requiredLabel: "Niezbędne",
        requiredHint: "Zawsze aktywne",
        analyticsLabel: "Analityczne",
        analyticsHint: "Pomiar ruchu i wydajności",
        marketingLabel: "Marketingowe",
        marketingHint: "Pomiar reklam i social media",
        privacyLabel: "Polityka prywatności",
        termsLabel: "Regulamin",
        privacyHref: "polityka-prywatnosci.html",
        termsHref: "regulamin.html",
      };

  const banner = `
<section id="trCookieConsentBanner" class="cookie-consent-banner" role="dialog" aria-label="${copy.title}" aria-live="polite" aria-hidden="true">
    <div class="cookie-consent-inner">
        <div class="cookie-consent-copy">
            <h2>${copy.title}</h2>
            <p>${copy.description}</p>
        </div>
        <div class="cookie-consent-actions">
            <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept-all">${copy.acceptAll}</button>
            <button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="reject-optional">${copy.rejectOptional}</button>
            <button type="button" class="cookie-btn cookie-btn-link" data-cookie-action="toggle-settings">${copy.settings}</button>
            <div class="cookie-consent-links">
                <a href="${copy.privacyHref}">${copy.privacyLabel}</a>
                <span aria-hidden="true">&middot;</span>
                <a href="${copy.termsHref}">${copy.termsLabel}</a>
            </div>
        </div>
        <div class="cookie-consent-settings">
            <label class="cookie-switch-row cookie-switch-row-required">
                <span class="cookie-switch-copy"><strong>${copy.requiredLabel}</strong><small>${copy.requiredHint}</small></span>
                <input type="checkbox" checked disabled>
            </label>
            <label class="cookie-switch-row">
                <span class="cookie-switch-copy"><strong>${copy.analyticsLabel}</strong><small>${copy.analyticsHint}</small></span>
                <input type="checkbox" data-cookie-field="analytics">
            </label>
            <label class="cookie-switch-row">
                <span class="cookie-switch-copy"><strong>${copy.marketingLabel}</strong><small>${copy.marketingHint}</small></span>
                <input type="checkbox" data-cookie-field="marketing">
            </label>
            <div class="cookie-settings-actions">
                <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="save-settings">${copy.saveSettings}</button>
                <button type="button" class="cookie-btn cookie-btn-link" data-cookie-action="close-settings">${copy.closeSettings}</button>
            </div>
        </div>
    </div>
</section>
<script>
    (function () {
        var banner = document.getElementById('trCookieConsentBanner');
        try {
            if (!localStorage.getItem('tr_cookie_consent_v1')) {
                banner.classList.add('is-visible');
                banner.setAttribute('aria-hidden', 'false');
            }
        } catch (_) {
            banner.classList.add('is-visible');
            banner.setAttribute('aria-hidden', 'false');
        }
    })();
</script>`;
  return html.replace(/(<body\b[^>]*>)/i, `$1${banner}`);
}

for (const fileName of htmlFiles) {
  const filePath = path.join(ROOT, fileName);
  let html = await fs.readFile(filePath, "utf8");
  html = removeImmediateGtmBootstrap(html);
  html = html.replace(/\s*<meta\s+[^>]*name=["']keywords["'][^>]*>/gi, "");
  html = ensureRobotsMeta(html, fileName === "mapa.html");
  html = ensureAppleTouchIcon(html);
  html = ensureNewsXDefault(html, fileName);
  html = socialMetadata(html, fileName);
  html = normalizeAssetReferences(html);
  html = html.replaceAll(`${SITE_ORIGIN}/logo.png`, BRAND_LOGO);
  html = ensureStaticCookieBanner(html, fileName);
  await fs.writeFile(filePath, html, "utf8");
}

console.log(`Enhanced SEO metadata in ${htmlFiles.length} HTML files.`);
