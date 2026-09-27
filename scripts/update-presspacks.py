"""Add information to the original PDF layout, preserving its photographs and data.

Requires PyMuPDF and a Git checkout containing BASE_REVISION (before PDF edits).
The original fonts are reused; only the new singles row uses Windows Tahoma.
"""
import json
import os
import subprocess
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
BASE_REVISION = 'f629532974dda56f1cadf37013f34c467686d945'
SITE = json.loads(Path('data/site.json').read_text(encoding='utf-8'))


def rgb(value):
    return tuple(((value >> shift) & 255) / 255 for shift in (16, 8, 0))


def embedded_fonts(doc, page_number, family):
    fonts = [fitz.Font(fontbuffer=doc.extract_font(f[0])[3])
             for f in doc[page_number].get_fonts() if f[3].split('+')[-1] == family]
    if not fonts:
        raise ValueError(f'Missing original font: {family}')
    return fonts


def runs(text, fonts):
    # The original Helvetica uses separate Latin and Polish glyph subsets.
    result = []
    for character in text:
        font = next((f for f in fonts if f.has_glyph(ord(character))), None)
        if font is None:
            raise ValueError(f'Original fonts have no glyph for {character!r}')
        if result and result[-1][0] is font:
            result[-1] = (font, result[-1][1] + character)
        else:
            result.append((font, character))
    return result


def width(text, fonts, size=12):
    return sum(font.text_length(part, fontsize=size) for font, part in runs(text, fonts))


def put(page, x, y, text, fonts, size=12, color=0):
    writer = fitz.TextWriter(page.rect)
    for font, part in runs(text, fonts):
        writer.append((x, y), part, font=font, fontsize=size)
        x += font.text_length(part, fontsize=size)
    if x > 545:
        raise ValueError(f'Text exceeds original right margin: {text}')
    writer.write_text(page, color=rgb(color))
    return x


def url(page, x, y, text, fonts, size=12, color=4618374, target=None, underline=True):
    end = put(page, x, y, text, fonts, size, color)
    if underline:
        page.draw_line((x, y + 1.3), (end, y + 1.3), color=rgb(color), width=.5)
    page.insert_link({'kind': fitz.LINK_URI, 'from': fitz.Rect(x, y-size, end, y+3), 'uri': target or text})


def clear_recommendations(page):
    rect = fitz.Rect(54, 155.1, 545, 280)
    for link in page.get_links():
        if rect.intersects(link['from']):
            page.delete_link(link)
    page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions(images=0, graphics=0)
    page.draw_rect(rect, color=None, fill=(1, 1, 1))


for en in (False, True):
    filename = 'Presspack-en.pdf' if en else 'Presspack.pdf'
    baseline = subprocess.check_output(['git', 'show', f'{BASE_REVISION}:{filename}'])
    doc = fitz.open(stream=baseline, filetype='pdf')
    body = embedded_fonts(doc, 3, 'Arimo Regular' if en else 'HelveticaNeue')
    award_font = embedded_fonts(doc, 6, 'Noto Sans SemiCondensed')
    bullet_font = embedded_fonts(doc, 6, 'Nimbus Roman Regular')
    table_bold = [fitz.Font(fontfile='C:/Windows/Fonts/tahomabd.ttf')]
    table_regular = embedded_fonts(doc, 4, 'Arimo Regular') if en else [fitz.Font(fontfile='C:/Windows/Fonts/tahoma.ttf')]

    # Preserve the biography and add release facts in the gap above its photo.
    page = doc[1]
    for y, text in zip((475, 489), (
        ('The debut album "Tabula Rasa" was released on 5 June 2025.' if en else 'Debiutancki album „Tabula Rasa” ukazał się 5 czerwca 2025.'),
        ('The latest single "Diamenty" was released on 8 July 2026.' if en else 'Najnowszy singiel „Diamenty”: premiera 8 lipca 2026.'),
    )):
        put(page, 55.9, y, text, body)

    # Keep the original heading, demo, live reel and photograph untouched.
    page = doc[3]
    clear_recommendations(page)
    recommendations = [
        ('Diamenty', 'https://e-muzyka.link/TabulaRasaDiamenty', None),
        ('Hybryda', 'https://open.spotify.com/track/7C2lbCqXWDbjw6NXmX8LTo?', 'si=253042e00e6e43de'),
        ('Lewitacja', 'https://open.spotify.com/track/5PLxOIq3esGKu2PJFCSsdR?', 'si=b3dc968977444bc9'),
    ]
    for index, (title, address, suffix) in enumerate(recommendations):
        y = 167 + index * 42
        put(page, 55.9, y + .4, '•', bullet_font)
        label = f' "{title}"  ' if en else f' „{title}”  '
        x = put(page, 60.1, y, label, body)
        target = address + (suffix or '')
        url(page, x, y, address, body, target=target)
        if suffix:
            url(page, 63.1, y + 14, suffix, body, target=target)
    # Tabula Rasa remains in the intact singles table, with its original link/date.
    x = put(page, 63.1, 437, 'Live: ' if en else 'Materiał live: ', body)
    url(page, x, 437, 'https://www.youtube.com/watch?v=BwzwxOD9rGs', body, color=153)

    # One row above the intact table: original title/date/URL columns and colour.
    page = doc[4]
    put(page, 109 - width('Diamenty', table_bold)/2, 393, 'Diamenty', table_bold, color=1391971)
    put(page, 166.0264, 385, 'Released 8 July 2026' if en else 'Premiera 8 lipca 2026', table_regular, color=1391971)
    url(page, 166.0264, 401.2167, 'https://www.youtube.com/watch?v=DQwpv5y-qAU', table_bold, color=1391971, underline=False)

    # Append wins to the old list; neither of the two photographs moves.
    page = doc[6]
    for y, name in zip((274.9, 288.9, 302.9), ('Rock Battle of Barcja', 'Kozynostra Rock Fest', 'RoCK Festiwal, Kołobrzeg')):
        put(page, 60.4, y + .6, '•', bullet_font)
        put(page, 72.6 if en else 67.6, y, ('1st place - ' if en else '1 miejsce - ') + name, award_font)
    additional = (
        ['Audience Award - Wszyscy Śpiewamy na Rockowo', '2nd place - Konkurs Zespołów Rockowych im. Mikołaja Matyski', 'Płock and Dęblin Juwenalia festivals'] if en else
        ['Nagroda Publiczności - Wszyscy Śpiewamy na Rockowo', 'II miejsce - Konkurs Zespołów Rockowych im. Mikołaja Matyski', 'Płockie i Dęblińskie Juwenalia']
    )
    for y, text in zip((685, 699, 713), additional):
        put(page, 60.4, y + .6, '•', bullet_font)
        put(page, 72.6 if en else 67.6, y, text, award_font)

    # Retain old contact information and add current management below it.
    page = doc[7]
    contact_font = embedded_fonts(doc, 7, 'HelveticaNeue')
    put(page, 55.9, 480, 'Booking / management:', contact_font, 16)
    contact = SITE['contact']
    url(page, 90.02, 506, contact['bookingEmail'], contact_font, 16, color=0, target='mailto:'+contact['bookingEmail'], underline=False)
    url(page, 87.796, 536, contact['bookingPhone'], contact_font, 16, color=0, target='tel:'+contact['bookingPhone'].replace(' ', ''), underline=False)
    # Do not resubset baseline fonts: preserve the rendering of untouched pages.
    doc.save(filename + '.tmp', garbage=4, deflate=True)
    doc.close()
    os.replace(filename + '.tmp', filename)
    print('Updated original layout:', filename)
