# Presspack update - 27 September 2026

Both PDFs retain the Tabula Rasa name, original filenames and eight-page format.

Follow-up correction: recommended tracks are explicitly Diamenty, Hybryda and
Lewitacja, in that order. The live video is the user-supplied
https://www.youtube.com/watch?v=BwzwxOD9rGs . Diamenty also appears in the
singles/videos list with its release date. The 2026 awards include first places
at Rock Battle of Barcja, Kozynostra Rock Fest and RoCK Festiwal in Kołobrzeg.

The public unversioned PDF URL was still serving the pre-update file through
Cloudflare (cache HIT, Last-Modified 17 September 2026). Versioned URLs return
the current file. The CMS builder now hashes the PDFs into download URLs; PDF
changes also trigger CMS Build. Downloaded filenames remain unchanged.

Sources checked:

- Debut album, 5 June 2025, nine tracks and CD: https://tabularasazespol.bandcamp.com/album/tabula-rasa
- Diamenty, 8 July 2026: https://open.spotify.com/album/29zE5tKZJrtZZVgjIHVDm5
- Release/video links: `data/music.json`, `content/news/2026-07-02-diamenty.json`.
- 2026 achievements: `data/press.json`, cross-checked with https://tabularasaband.pl/press.html
- Rock Battle of Barcja first place: https://bartoszyceon.pl/xii-rock-battle-of-barcja-tabula-rasa-zwycieza-w-bartoszycach/
- Current booking: `data/site.json`. The band contact remains available separately.

The PDFs are built from their original layout in revision
`f629532974dda56f1cadf37013f34c467686d945`. Original photographs, headings,
singles table, dates, biography, achievements and contacts are retained. The
recommended tracks are updated as requested; the Tabula Rasa track and its URL
remain in the singles table. Full URLs appear beside titles in the original
font sizes and colours. Diamenty is an added table row, the new live URL is
added beside its label, and the old live reel and private demo remain available.
Latest wins extend the existing 2026 list without moving its photographs.
Current management contact is appended below the original contact details.

Website editorial copy and CMS data are unchanged. The mobile menu now makes its
closed links inert, focuses its first link on opening, cycles keyboard focus within
its controls and restores focus to the toggle on closing. Keyboard focus is visible.
Generated asset hashes in HTML were rebuilt for cache invalidation.

Validation: rendered all 16 PDF pages, checked updated text and link annotations;
11 generator tests, 42 smoke tests, 14 UI/UX tests and one keyboard-menu regression.
For the layout restoration, verified the original text outside the explicitly
replaced recommendations, identical image content/positions on every page, and
pixel-identical rendering of the untouched cover, lineup and historic awards
pages. Visually inspected all modified pages in both languages.
