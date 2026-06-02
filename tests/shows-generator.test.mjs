import assert from "node:assert/strict";
import test from "node:test";

import {
  buildShowsJsonLdHtml,
  buildShowsListHtml,
  parseShowsFromIcs,
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
