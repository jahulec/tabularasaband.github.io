import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHomeShowsHtml,
  buildShowsJsonLdHtml,
  buildShowsListHtml,
  mergeShows,
  parseShowsFromIcs,
  renderHomePage,
  renderShowsPage,
} from "../scripts/sync-shows-from-calendar.mjs";

const fixtureIcs = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:with-link
SUMMARY:Klub Test | Warszawa
DTSTART;TZID=Europe/Warsaw:20260704T190000
LOCATION:Klub Test
DESCRIPTION:Bilety: https://tickets.example/show
END:VEVENT
BEGIN:VEVENT
UID:without-link
SUMMARY:Plener | Krakow
DTSTART;VALUE=DATE:20260620
DESCRIPTION:Wstep wolny
END:VEVENT
BEGIN:VEVENT
UID:cancelled
SUMMARY:Cancelled | City
DTSTART;VALUE=DATE:20260621
STATUS:CANCELLED
END:VEVENT
END:VCALENDAR`;

test("parses Google Calendar ICS shows, links, locations, and sorting", () => {
  const shows = parseShowsFromIcs(fixtureIcs);

  assert.deepEqual(shows.map((show) => show.date), ["2026-06-20", "2026-07-04"]);
  assert.equal(shows[0].title, "Plener | Krakow");
  assert.equal(shows[0].ticketUrl, "");
  assert.equal(shows[1].title, "Klub Test | Warszawa");
  assert.equal(shows[1].location, "Klub Test");
  assert.equal(shows[1].ticketUrl, "https://tickets.example/show");
});

test("renders localized show lists and upcoming JSON-LD", () => {
  const shows = parseShowsFromIcs(fixtureIcs);
  const plList = buildShowsListHtml(shows, "pl");
  const enList = buildShowsListHtml(shows, "en");
  const jsonLd = buildShowsJsonLdHtml(shows, new Date("2026-06-19T12:00:00"));

  assert.match(plList, /20 czerwca 2026/);
  assert.match(plList, /Wi\u0119cej/);
  assert.match(enList, /4 July 2026/);
  assert.match(enList, />More<\/a>/);
  assert.match(jsonLd, /"@type": "MusicEvent"/);
  assert.match(jsonLd, /https:\/\/tickets\.example\/show/);
});

test("merges calendar shows into existing shows without deleting current entries", () => {
  const existing = [
    { date: "2026-05-01", title: "Existing Only | Lodz", ticketUrl: "https://tickets.example/existing" },
    { date: "2026-07-04", title: "Klub Test | Warszawa", ticketUrl: "https://tickets.example/old" },
  ];
  const incoming = parseShowsFromIcs(fixtureIcs);
  const merged = mergeShows(existing, incoming);

  assert.deepEqual(merged.map((show) => show.title), [
    "Existing Only | Lodz",
    "Plener | Krakow",
    "Klub Test | Warszawa",
  ]);
  assert.equal(merged[0].ticketUrl, "https://tickets.example/existing");
  assert.equal(merged[2].location, "Klub Test");
  assert.equal(merged[2].ticketUrl, "https://tickets.example/show");
});

test("renders the homepage with the same upcoming order and a three-show limit", () => {
  const shows = [
    { date: "2026-06-01", title: "Past | City" },
    { date: "2026-06-20", title: "First | City" },
    { date: "2026-07-04", title: "Second | City", ticketUrl: "https://tickets.example/second" },
    { date: "2026-08-10", title: "Third | City" },
    { date: "2026-09-12", title: "Fourth | City" },
  ];
  const html = buildHomeShowsHtml(shows, "en", new Date("2026-06-19T12:00:00"));
  const dates = Array.from(html.matchAll(/data-show-date="([^"]+)"/g), (match) => match[1]);

  assert.deepEqual(dates, ["2026-06-20", "2026-07-04", "2026-08-10"]);
  assert.match(html, /Tickets \/ more/);
  assert.doesNotMatch(html, /2026-09-12/);
});

test("page rendering is deterministic when the input data does not change", () => {
  const shows = parseShowsFromIcs(fixtureIcs);
  const html = `<!doctype html>
<html>
<head>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"MusicEvent"}]}</script>
</head>
<body>
<section id="news" class="concerts-section shows-page">
<h1 id="welcome">Koncerty</h1>
<div class="shows-list"></div>
</section>
</body>
</html>`;

  const first = renderShowsPage(html, shows, "pl", new Date("2026-06-19T12:00:00"));
  const second = renderShowsPage(first, shows, "pl", new Date("2026-06-19T12:00:00"));

  assert.equal(second, first);
});

test("homepage rendering is deterministic when generated shows do not change", () => {
  const shows = parseShowsFromIcs(fixtureIcs);
  const html = `<!doctype html>
<html>
<body>
<section class="home-shows">
<!-- HOME_SHOWS_START -->
<div class="home-shows-list" data-home-shows></div>
<!-- HOME_SHOWS_END -->
</section>
</body>
</html>`;

  const first = renderHomePage(html, shows, "pl", new Date("2026-06-19T12:00:00"));
  const second = renderHomePage(first, shows, "pl", new Date("2026-06-19T12:00:00"));

  assert.equal(second, first);
  assert.match(first, /20 czerwca 2026/);
});
