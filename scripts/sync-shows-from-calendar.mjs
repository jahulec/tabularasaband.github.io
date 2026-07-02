import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "shows.json");
const SHOW_PAGES = [
  { path: path.join(ROOT, "shows.html"), lang: "pl" },
  { path: path.join(ROOT, "shows-en.html"), lang: "en" },
];
const HOME_PAGES = [
  { path: path.join(ROOT, "index.html"), lang: "pl" },
  { path: path.join(ROOT, "index-en.html"), lang: "en" },
];

const JSON_LD_START = "<!-- SHOWS_JSON_LD_START -->";
const JSON_LD_END = "<!-- SHOWS_JSON_LD_END -->";
const LIST_START = "<!-- SHOWS_LIST_START -->";
const LIST_END = "<!-- SHOWS_LIST_END -->";
const HOME_SHOWS_START = "<!-- HOME_SHOWS_START -->";
const HOME_SHOWS_END = "<!-- HOME_SHOWS_END -->";

const PL_MONTHS = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "wrze\u015bnia",
  "pa\u017adziernika",
  "listopada",
  "grudnia",
];

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeIcsText(value) {
  return String(value ?? "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function normalizeDate(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function formatDate(dateValue, lang) {
  const date = normalizeDate(dateValue);
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return date;

  const day = Number(match[3]);
  const monthIndex = Number(match[2]) - 1;
  const year = match[1];
  const month = lang === "en" ? EN_MONTHS[monthIndex] : PL_MONTHS[monthIndex];

  if (!month) return date;
  return lang === "en" ? `${day} ${month} ${year}` : `${day} ${month} ${year}`;
}

function parseIcsParams(rawName) {
  const [name, ...parts] = rawName.split(";");
  const params = {};

  for (const part of parts) {
    const [key, ...valueParts] = part.split("=");
    if (!key || valueParts.length === 0) continue;
    params[key.toUpperCase()] = valueParts.join("=").replace(/^"|"$/g, "");
  }

  return { name: name.toUpperCase(), params };
}

function parseIcsDate(value, params = {}) {
  const text = String(value ?? "").trim();
  const dateOnly = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly || params.VALUE === "DATE") {
    const match = dateOnly || text.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!match) return null;
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    return { date, startDate: date };
  }

  const dateTime = text.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!dateTime) return null;

  const [, year, month, day, hour, minute, second, zulu] = dateTime;
  const date = `${year}-${month}-${day}`;
  const time = `${hour}:${minute}:${second}`;
  return {
    date,
    startDate: zulu ? `${date}T${time}Z` : `${date}T${time}`,
  };
}

function firstUrl(value) {
  const match = String(value ?? "").match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0].replace(/[),.;]+$/g, "") : "";
}

function normalizeImportTag(value) {
  const tag = String(value ?? "").trim();
  if (!tag || tag === "*" || tag.toLowerCase() === "all") return "";
  return tag.toLowerCase();
}

function eventContainsTag(event, importTag) {
  const tag = normalizeImportTag(importTag);
  if (!tag) return true;

  return [
    event.SUMMARY,
    event.DESCRIPTION,
    event.LOCATION,
    event.CATEGORIES,
  ].some((value) => String(value ?? "").toLowerCase().includes(tag));
}

function readEventBlocks(icsText) {
  const unfolded = String(icsText ?? "").replace(/\r?\n[ \t]/g, "");
  const blocks = [];
  const regex = /BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g;
  let match;

  while ((match = regex.exec(unfolded))) {
    blocks.push(match[1]);
  }

  return blocks;
}

export function parseShowsFromIcs(icsText, { importTag = "" } = {}) {
  const shows = [];

  for (const block of readEventBlocks(icsText)) {
    const event = {};
    const paramsByName = {};

    for (const line of block.split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator < 0) continue;

      const rawName = line.slice(0, separator);
      const rawValue = line.slice(separator + 1);
      const { name, params } = parseIcsParams(rawName);
      const value = decodeIcsText(rawValue);

      if (!event[name]) {
        event[name] = value;
        paramsByName[name] = params;
      }
    }

    if ((event.STATUS || "").toUpperCase() === "CANCELLED") continue;
    if (!event.SUMMARY || !event.DTSTART) continue;
    if (!eventContainsTag(event, importTag)) continue;

    const parsedDate = parseIcsDate(event.DTSTART, paramsByName.DTSTART);
    if (!parsedDate) continue;

    const description = event.DESCRIPTION || "";
    const show = {
      date: parsedDate.date,
      startDate: parsedDate.startDate,
      title: event.SUMMARY.trim(),
      location: (event.LOCATION || "").trim(),
      ticketUrl: firstUrl(description),
    };

    shows.push(show);
  }

  return normalizeShows(shows);
}

export function normalizeShows(shows) {
  return Array.from(shows || [])
    .map((show) => ({
      date: normalizeDate(show.date || show.startDate),
      startDate: show.startDate || normalizeDate(show.date),
      title: String(show.title || "").trim(),
      location: String(show.location || "").trim(),
      ticketUrl: String(show.ticketUrl || "").trim(),
    }))
    .filter((show) => show.date && show.title)
    .sort((a, b) => (
      a.date.localeCompare(b.date)
      || a.title.localeCompare(b.title, "pl")
      || a.ticketUrl.localeCompare(b.ticketUrl)
    ));
}

function showMergeKey(show) {
  const date = normalizeDate(show.date || show.startDate);
  const title = String(show.title || "").trim().toLocaleLowerCase("pl");
  return `${date}::${title}`;
}

function mergeShowDetails(existingShow, incomingShow) {
  return {
    date: incomingShow.date || existingShow.date,
    startDate: incomingShow.startDate || existingShow.startDate,
    title: incomingShow.title || existingShow.title,
    location: incomingShow.location || existingShow.location,
    ticketUrl: incomingShow.ticketUrl || existingShow.ticketUrl,
  };
}

export function mergeShows(existingShows, incomingShows) {
  const merged = new Map();

  for (const show of normalizeShows(existingShows)) {
    merged.set(showMergeKey(show), show);
  }

  for (const show of normalizeShows(incomingShows)) {
    const key = showMergeKey(show);
    const previous = merged.get(key);
    merged.set(key, previous ? mergeShowDetails(previous, show) : show);
  }

  return normalizeShows(merged.values());
}

function buildShowArticle(show, lang) {
  const ticketLabel = lang === "en" ? "More" : "Wi\u0119cej";
  const ticket = show.ticketUrl
    ? `\n        <a href="${escapeHtml(show.ticketUrl)}" class="ticket-btn">${ticketLabel}</a>`
    : "";

  return `    <article class="concert-item koncert" data-show-date="${escapeHtml(show.date)}">
        <h3>${escapeHtml(show.title)}</h3>
        <time class="concert-date" datetime="${escapeHtml(show.date)}">${escapeHtml(formatDate(show.date, lang))}</time>${ticket}
    </article>`;
}

function startOfToday(today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function isUpcoming(show, today = new Date()) {
  const date = normalizeDate(show.date);
  if (!date) return false;
  const [year, month, day] = date.split("-").map(Number);
  const showDate = new Date(year, month - 1, day);
  const hideFrom = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate() + 1);
  return startOfToday(today) < hideFrom;
}

function upcomingShows(shows, today = new Date(), limit = Infinity) {
  return normalizeShows(shows)
    .filter((show) => isUpcoming(show, today))
    .slice(0, limit);
}

function buildEventJsonLd(show) {
  const event = {
    "@type": "MusicEvent",
    name: show.title,
    startDate: show.startDate || show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    performer: {
      "@type": "MusicGroup",
      name: "Tabula Rasa",
      url: "https://tabularasaband.pl/",
    },
  };

  if (show.location) {
    event.location = {
      "@type": "Place",
      name: show.location,
    };
  }

  if (show.ticketUrl) {
    event.offers = {
      "@type": "Offer",
      url: show.ticketUrl,
      availability: "https://schema.org/InStock",
      priceCurrency: "PLN",
    };
  }

  return event;
}

export function buildShowsListHtml(shows, lang = "pl") {
  const articles = normalizeShows(shows).map((show) => buildShowArticle(show, lang)).join("\n");
  return `${LIST_START}
<div class="shows-list">
${articles}
</div>
${LIST_END}`;
}

function buildHomeShowArticle(show, lang, index = 0) {
  const ticketLabel = lang === "en" ? "Tickets / more" : "Bilety / wi\u0119cej";
  const ticket = show.ticketUrl
    ? `\n            <a class="home-text-link home-show-link" href="${escapeHtml(show.ticketUrl)}">${ticketLabel}</a>`
    : "";

  const x = index % 2 === 0 ? 72 : -72;
  const y = 0;
  const stagger = index > 0 ? ` data-motion-stagger="${(index * 0.08).toFixed(2)}"` : "";

  return `        <article class="home-show" data-show-date="${escapeHtml(show.date)}" data-home-motion data-motion-x="${x}" data-motion-y="${y}"${stagger}>
            <time datetime="${escapeHtml(show.date)}">${escapeHtml(formatDate(show.date, lang))}</time>
            <h3>${escapeHtml(show.title)}</h3>${ticket}
        </article>`;
}

export function buildHomeShowsHtml(shows, lang = "pl", today = new Date()) {
  const upcoming = upcomingShows(shows, today, 3);

  if (upcoming.length === 0) {
    const message = lang === "en"
      ? "No upcoming shows right now."
      : "Aktualnie brak nadchodz\u0105cych koncert\u00f3w.";

    return `${HOME_SHOWS_START}
    <div class="home-shows-list home-shows-list-empty" data-home-shows>
        <p class="home-empty-shows">${message}</p>
    </div>
    ${HOME_SHOWS_END}`;
  }

  const articles = upcoming.map((show, index) => buildHomeShowArticle(show, lang, index)).join("\n");
  return `${HOME_SHOWS_START}
    <div class="home-shows-list" data-home-shows>
${articles}
    </div>
    ${HOME_SHOWS_END}`;
}

export function buildShowsJsonLdHtml(shows, today = new Date()) {
  const graph = normalizeShows(shows)
    .filter((show) => isUpcoming(show, today))
    .map(buildEventJsonLd);

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return `${JSON_LD_START}
<script type="application/ld+json">
${JSON.stringify(payload, null, 2)}
</script>
${JSON_LD_END}`;
}

function replaceMarkedBlock(html, start, end, replacement, fallback) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);

  if (startIndex >= 0 && endIndex > startIndex) {
    return `${html.slice(0, startIndex)}${replacement}${html.slice(endIndex + end.length)}`;
  }

  return fallback(html, replacement);
}

function replaceJsonLd(html, replacement) {
  return replaceMarkedBlock(html, JSON_LD_START, JSON_LD_END, replacement, (source, block) => {
    let replaced = false;
    const next = source.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, (match) => {
      if (replaced || !match.includes("MusicEvent")) return match;
      replaced = true;
      return block;
    });

    if (!replaced) {
      return source.replace("</head>", `${block}\n</head>`);
    }

    return next;
  });
}

function replaceShowsList(html, replacement) {
  return replaceMarkedBlock(html, LIST_START, LIST_END, replacement, (source, block) => (
    source.replace(/<div class="shows-list">[\s\S]*?<\/div>/, block)
  ));
}

function replaceHomeShows(html, replacement) {
  return replaceMarkedBlock(html, HOME_SHOWS_START, HOME_SHOWS_END, replacement, (source, block) => (
    source.replace(/<div class="home-shows-list" data-home-shows>[\s\S]*?<\/div>/, block)
  ));
}

export function renderShowsPage(html, shows, lang = "pl", today = new Date()) {
  let next = replaceJsonLd(html, buildShowsJsonLdHtml(shows, today));
  next = replaceShowsList(next, buildShowsListHtml(shows, lang));
  return next;
}

export function renderHomePage(html, shows, lang = "pl", today = new Date()) {
  return replaceHomeShows(html, buildHomeShowsHtml(shows, lang, today));
}

async function writeIfChanged(filePath, content) {
  let previous = "";
  try {
    previous = await fs.readFile(filePath, "utf8");
  } catch {
    // Missing files are created below.
  }

  if (previous === content) return false;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  return true;
}

async function fetchIcs(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Calendar fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function loadShowsData() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return normalizeShows(parsed.shows || []);
}

async function saveShowsData(shows) {
  const content = `${JSON.stringify({ shows: normalizeShows(shows) }, null, 2)}\n`;
  return writeIfChanged(DATA_PATH, content);
}

export async function renderAllShowsPages(shows, { today = new Date() } = {}) {
  let changed = false;

  for (const page of SHOW_PAGES) {
    const html = await fs.readFile(page.path, "utf8");
    const rendered = renderShowsPage(html, shows, page.lang, today);
    changed = (await writeIfChanged(page.path, rendered)) || changed;
  }

  for (const page of HOME_PAGES) {
    const html = await fs.readFile(page.path, "utf8");
    const rendered = renderHomePage(html, shows, page.lang, today);
    changed = (await writeIfChanged(page.path, rendered)) || changed;
  }

  return changed;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const renderOnly = args.has("--render-only");
  const replaceExisting = args.has("--replace");
  let shows;
  let dataChanged = false;

  if (renderOnly) {
    shows = await loadShowsData();
  } else {
    const fixtureArg = process.argv.find((arg) => arg.startsWith("--ics-file="));
    const fixturePath = fixtureArg ? fixtureArg.slice("--ics-file=".length) : "";
    const importTagArg = process.argv.find((arg) => arg.startsWith("--import-tag="));
    const importTag = importTagArg
      ? importTagArg.slice("--import-tag=".length)
      : process.env.GOOGLE_CALENDAR_IMPORT_TAG || process.env.CALENDAR_IMPORT_TAG || "#strona";
    const url = process.env.GOOGLE_CALENDAR_ICS_URL || process.env.CALENDAR_ICS_URL || "";
    if (!fixturePath && !url) {
      throw new Error("Missing GOOGLE_CALENDAR_ICS_URL.");
    }

    const ics = fixturePath
      ? await fs.readFile(path.resolve(ROOT, fixturePath), "utf8")
      : await fetchIcs(url);

    const calendarShows = parseShowsFromIcs(ics, { importTag });
    const existingShows = replaceExisting ? [] : await loadShowsData().catch(() => []);
    shows = mergeShows(existingShows, calendarShows);
    dataChanged = await saveShowsData(shows);
  }

  const pagesChanged = await renderAllShowsPages(shows);
  console.log(dataChanged || pagesChanged ? "Shows updated." : "Shows already up to date.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
