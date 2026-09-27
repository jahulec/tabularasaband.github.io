"""Refresh the bilingual press PDFs in place, keeping their filenames and photography.

Verified 2026-09-27: band Bandcamp (album), Spotify (Diamenty),
data/press.json (achievements), data/site.json (booking).
Requires PyMuPDF; run from the repository root on Windows.
"""
import json
import os
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
PRESS = json.loads(Path('data/press.json').read_text(encoding='utf-8'))
SITE = json.loads(Path('data/site.json').read_text(encoding='utf-8'))


def clear(page, rect, images=False):
    for link in page.get_links():
        if fitz.Rect(rect).intersects(link['from']):
            page.delete_link(link)
    page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions(images=2 if images else 0)


def box(page, text, rect, size=11, bold=False, color=(0, 0, 0)):
    # A fresh font resource is required after a previous run subsetted the PDF.
    name = 'press-v2-bold' if bold else 'press-v2-regular'
    page.insert_font(fontname=name, fontfile='C:/Windows/Fonts/' + ('arialbd.ttf' if bold else 'arial.ttf'))
    spare = page.insert_textbox(rect, text, fontname=name, fontsize=size, lineheight=1.25, color=color)
    if spare < 0:
        raise ValueError(f'Text overflow: {text[:60]} ({spare})')


def link(page, label, url, y):
    rect = fitz.Rect(56, y, 540, y + 25)
    box(page, label, rect, color=(0.04, 0.20, 0.35))
    page.insert_link({'kind': fitz.LINK_URI, 'from': rect, 'uri': url})


for en in (False, True):
    filename = 'Presspack-en.pdf' if en else 'Presspack.pdf'
    doc = fitz.open(filename)
    page = doc[1]
    # Refresh the opening paragraph while preserving the history and photograph.
    first = next(b for b in page.get_text('blocks') if any(s in b[4].replace('\u00a0', ' ') for s in ('The band was', 'Zespół powstał', 'Tabula Rasa powstała', 'Formed in Warsaw')))
    rect = fitz.Rect(55, first[1], 545, max(first[3] + 1, first[1] + 29))
    clear(page, rect)
    intro = ('Formed in Warsaw in 2023, Tabula Rasa released their debut album on 5 June 2025. The latest single, "Diamenty", arrived on 8 July 2026.' if en else
             'Tabula Rasa powstała w Warszawie w 2023 roku. Debiutancki album ukazał się 5 czerwca 2025, a najnowszy singiel "Diamenty" - 8 lipca 2026.')
    box(page, intro, rect, size=10.5)

    page = doc[3]
    clear(page, fitz.Rect(40, 75, 550, 735))
    box(page, 'MUSIC / RELEASES' if en else 'MUZYKA / WYDAWNICTWA', (56, 90, 545, 125), 22, True)
    box(page, 'RECOMMENDED TRACKS' if en else 'REKOMENDOWANE UTWORY', (56, 151, 540, 180), 16, True)
    link(page, '1. Diamenty / Streaming', 'https://e-muzyka.link/TabulaRasaDiamenty', 193)
    link(page, '2. Hybryda / Spotify', 'https://open.spotify.com/track/7C2lbCqXWDbjw6NXmX8LTo', 228)
    link(page, '3. Lewitacja / Spotify', 'https://open.spotify.com/track/5PLxOIq3esGKu2PJFCSsdR', 263)
    box(page, 'Diamenty: released 8 July 2026.' if en else 'Diamenty: premiera 8 lipca 2026.', (56, 300, 540, 322), 10)
    box(page, 'TABULA RASA', (56, 335, 540, 365), 17, True)
    box(page, ('Debut album released 5 June 2025. Nine tracks, available digitally and on CD.' if en else
               'Debiutancki album wydany 5 czerwca 2025. Dziewięć utworów, dostępnych cyfrowo i na CD.'), (56, 373, 540, 418))
    link(page, 'Bandcamp: Tabula Rasa', 'https://tabularasazespol.bandcamp.com/album/tabula-rasa', 427)
    box(page, 'NEW ALBUM DEMO (UNRELEASED)' if en else 'DEMO NOWEJ PŁYTY (NIEWYDANE)', (56, 483, 540, 511), 14, True)
    box(page, ('Private listening link for industry use only. The current live set is based mainly on new, unreleased material.' if en else
               'Prywatny odsłuch wyłącznie do celów branżowych. Aktualny koncertowy set zespołu opiera się głównie na nowym, niewydanym materiale.'), (56, 521, 540, 568))
    link(page, 'Demo / Google Drive', 'https://drive.google.com/drive/folders/15bcl-R37_is94j04Mk_hjTFz2wmLZ5zQ?usp=sharing', 579)
    box(page, 'LIVE VIDEO', (56, 634, 540, 660), 14, True)
    link(page, 'https://www.youtube.com/watch?v=BwzwxOD9rGs', 'https://www.youtube.com/watch?v=BwzwxOD9rGs', 671)

    page = doc[4]
    # Keep the original album artwork; remove inconsistent old release dates.
    clear(page, fitz.Rect(45, 400, 550, 738))
    tracks = [('Diamenty', 'DQwpv5y-qAU'), ('Lewitacja', '9pIKakO0nR0'), ('Hybryda', 'qgXjLFixykg'), ('Offline', '9bAQ1C6MBio'), ('Ostatni Raz', 'oQN6vtTc-7o'), ('Wszystko To Co Mam', '_NKiiR6thjE')]
    for i, (title, video) in enumerate(tracks):
        label = title + (' / 08.07.2026 / YouTube' if title == 'Diamenty' else ' / YouTube')
        link(page, label, 'https://www.youtube.com/watch?v=' + video, 415 + i * 34)
    box(page, 'ALBUM: TABULA RASA (2025)', (56, 632, 540, 660), 13, True)
    box(page, '24/7 / Hybryda / Ikar / James Deen / Lewitacja / Offline /\nOstatni Raz / Tabula Rasa / Wszystko To Co Mam', (56, 666, 540, 708), 11)
    link(page, 'Spotify / Tabula Rasa', 'https://open.spotify.com/artist/6xvV1lYwFaNpyXmlbzdLi3', 716)

    page = doc[6]
    photo = max(page.get_images(full=True), key=lambda im: im[2] * im[3])
    photo_bytes = doc.extract_image(photo[0])['image']
    clear(page, fitz.Rect(40, 75, 550, 740), images=True)
    box(page, '2026 / LIVE & AWARDS' if en else '2026 / KONCERTY I NAGRODY', (56, 88, 540, 122), 20, True)
    entries = PRESS['achievements'][0]['items']
    y = 141
    for entry in entries:
        text = entry['textEn' if en else 'textPl'].replace('—', '-').replace('ROcK Fesiwal', 'RoCK Festiwal')
        box(page, '- ' + text, (56, y, 540, y + 33), size=10.5)
        y += 30
    page.insert_image(fitz.Rect(56, 518, 540, 735), stream=photo_bytes, keep_proportion=True)

    page = doc[7]
    clear(page, fitz.Rect(50, 340, 545, 735))
    box(page, 'BOOKING', (56, 348, 540, 378), 16, True)
    contact = SITE['contact']
    link(page, contact['bookingEmail'], 'mailto:' + contact['bookingEmail'], 390)
    link(page, contact['bookingPhone'], 'tel:' + contact['bookingPhone'].replace(' ', ''), 420)
    box(page, 'BAND CONTACT' if en else 'KONTAKT Z ZESPOŁEM', (56, 490, 540, 522), 14, True)
    link(page, contact['generalEmail'], 'mailto:' + contact['generalEmail'], 534)
    link(page, contact['bandPhones'][0], 'tel:' + contact['bandPhones'][0].replace(' ', ''), 564)
    box(page, 'Updated: 27 September 2026' if en else 'Aktualizacja: 27 września 2026', (56, 691, 540, 720), 10)
    doc.set_metadata({**doc.metadata, 'title': 'Tabula Rasa - Press Pack 2026', 'author': 'Tabula Rasa'})
    doc.subset_fonts()
    doc.save(filename + '.tmp', garbage=4, deflate=True)
    doc.close()
    os.replace(filename + '.tmp', filename)
    print('Updated', filename)
