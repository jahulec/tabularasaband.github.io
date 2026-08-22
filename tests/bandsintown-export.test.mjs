import assert from "node:assert/strict";
import test from "node:test";

import {
  BANDSINTOWN_HEADERS,
  bandsintownRow,
  buildBandsintownCsv,
} from "../scripts/export-bandsintown-events.mjs";

test("exports the exact Bandsintown bulk-upload columns", () => {
  const csv = buildBandsintownCsv([
    {
      date: "2026-10-10",
      title: "Klub Próba | Warszawa",
      startTime: "20:00",
      ticketUrl: "https://tickets.example/show",
      description: "Koncert, premiera \"Nowy singiel\"",
      publishToBandsintown: true,
    },
  ]);

  const [header, row] = csv.trim().split("\r\n");
  assert.equal(header, BANDSINTOWN_HEADERS.join(","));
  assert.match(row, /^Tabula Rasa,Klub Próba,Poland,,Warszawa,,,Europe\/Warsaw,2026-10-10,20:00/);
  assert.match(row, /https:\/\/tickets\.example\/show,Tickets/);
  assert.match(row, /"Koncert, premiera ""Nowy singiel"""/);
});

test("skips concerts not marked for Bandsintown", () => {
  const csv = buildBandsintownCsv([
    { date: "2026-10-10", title: "Only website | Warszawa", startTime: "20:00" },
  ]);

  assert.equal(csv, `${BANDSINTOWN_HEADERS.join(",")}\r\n`);
});

test("rejects an incomplete concert before it can be mistaken for published", () => {
  assert.throws(
    () => bandsintownRow({ date: "2026-10-10", title: "Bez miasta", publishToBandsintown: true }),
    /miejsce\/klub, miasto, godzina/,
  );
});
