import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "shows.json");
const OUTPUT_PATH = path.join(ROOT, "bandsintown-events.csv");

export const BANDSINTOWN_HEADERS = [
  "Artist Name",
  "Venue*",
  "Country*",
  "Address",
  "City*",
  "Region*",
  "Postal Code",
  "Timezone*",
  "Start Date* (yyyy-mm-dd)",
  "Start Time* (HH:MM)",
  "End Date",
  "End Time",
  "Streaming Link",
  "Ticket Link",
  "Ticket Type",
  "Ticket Link 2",
  "Ticket Type 2",
  "On-Sale Date",
  "On-Sale Time",
  "Lineup",
  "Event Name",
  "Event Display Format",
  "Description",
  "Schedule Date",
  "Schedule Time",
  "Do Not Announce",
  "Setlist",
  "Event Image",
];

function clean(value) {
  return String(value ?? "").trim();
}

function csvCell(value) {
  const text = clean(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function titleParts(title) {
  const parts = clean(title).split("|").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { venue: "", city: "" };
  return {
    venue: parts.slice(0, -1).join(" | "),
    city: parts.at(-1),
  };
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(clean(value));
}

function validTime(value) {
  const match = clean(value).match(/^(\d{2}):(\d{2})$/);
  return Boolean(match && Number(match[1]) < 24 && Number(match[2]) < 60);
}

export function bandsintownRow(show, { artistName = "Tabula Rasa" } = {}) {
  const inferred = titleParts(show.title);
  const venue = clean(show.venue) || inferred.venue;
  const city = clean(show.city) || inferred.city;
  const country = clean(show.country) || "Poland";
  const timezone = clean(show.timezone) || "Europe/Warsaw";
  const startDate = clean(show.date);
  const startTime = clean(show.startTime);
  const label = `${startDate || "bez daty"} — ${clean(show.title) || "bez nazwy"}`;
  const errors = [];

  if (!venue) errors.push("miejsce/klub");
  if (!city) errors.push("miasto");
  if (!validDate(startDate)) errors.push("data w formacie YYYY-MM-DD");
  if (!validTime(startTime)) errors.push("godzina w formacie HH:MM");
  if (show.endDate && !validDate(show.endDate)) errors.push("data zakończenia w formacie YYYY-MM-DD");
  if (show.endTime && !validTime(show.endTime)) errors.push("godzina zakończenia w formacie HH:MM");
  if (show.onSaleDate && !validDate(show.onSaleDate)) errors.push("data sprzedaży w formacie YYYY-MM-DD");
  if (show.onSaleTime && !validTime(show.onSaleTime)) errors.push("godzina sprzedaży w formacie HH:MM");
  if (show.scheduleDate && !validDate(show.scheduleDate)) errors.push("data publikacji w formacie YYYY-MM-DD");
  if (show.scheduleTime && !validTime(show.scheduleTime)) errors.push("godzina publikacji w formacie HH:MM");

  if (errors.length) {
    throw new Error(`${label}: uzupełnij ${errors.join(", ")}`);
  }

  const values = [
    artistName,
    venue,
    country,
    show.address,
    city,
    show.region,
    show.postalCode,
    timezone,
    startDate,
    startTime,
    show.endDate,
    show.endTime,
    show.streamingLink,
    show.ticketUrl,
    show.ticketType || (show.ticketUrl ? "Tickets" : ""),
    show.ticketUrl2,
    show.ticketType2,
    show.onSaleDate,
    show.onSaleTime,
    show.lineup,
    show.eventName || show.title,
    show.eventDisplayFormat || "Event Name",
    show.description,
    show.scheduleDate,
    show.scheduleTime,
    show.doNotAnnounce ? "Y" : "",
    show.setlist,
    show.eventImage,
  ];

  return values.map(csvCell).join(",");
}

export function buildBandsintownCsv(shows, options = {}) {
  const pending = Array.from(shows || []).filter((show) => show.publishToBandsintown === true);
  const rows = pending.map((show) => bandsintownRow(show, options));
  return `${[BANDSINTOWN_HEADERS.join(","), ...rows].join("\r\n")}\r\n`;
}

async function main() {
  const parsed = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const pendingCount = Array.from(parsed.shows || []).filter((show) => show.publishToBandsintown === true).length;
  const csv = buildBandsintownCsv(parsed.shows);
  await fs.writeFile(OUTPUT_PATH, csv, "utf8");
  console.log(`Bandsintown export ready: ${pendingCount} event(s).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(`Bandsintown export failed: ${error.message}`);
    process.exit(1);
  });
}
