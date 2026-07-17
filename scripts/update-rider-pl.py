import os

import fitz


TARGET_PDF = "RiderTabulaRasa.pdf"
FONT = "C:/Windows/Fonts/times.ttf"
FONT_BOLD = "C:/Windows/Fonts/timesbd.ttf"
REGULAR_FONT = "tabula-rider-regular"
BOLD_FONT = "tabula-rider-bold"


def clear(page, rect):
    page.add_redact_annot(fitz.Rect(*rect), fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)


def register_fonts(page, include_bold=False):
    page.insert_font(fontname=REGULAR_FONT, fontfile=FONT)
    if include_bold:
        page.insert_font(fontname=BOLD_FONT, fontfile=FONT_BOLD)


def put(page, point, text, size=11, bold=False):
    page.insert_text(
        point,
        text,
        fontsize=size,
        fontname=BOLD_FONT if bold else REGULAR_FONT,
    )


doc = fitz.open(TARGET_PDF)

# Monitoring section on page 3.
page = doc[2]
clear(page, (60, 75, 540, 126))
register_fonts(page)
put(page, (66, 91), "\u2022 Wedge dla wszystkich opr\u00f3cz perkusisty")
put(page, (66, 106), "\u2022 Perkusista - in-ear monitor (sygna\u0142 mono), kabel XLR,")
put(page, (77, 121), "po\u0142\u0105czenie ze sto\u0142em przez MixStation (Wi-Fi)")

# Requirements section on page 4.
page = doc[3]
clear(page, (45, 480, 570, 780))
register_fonts(page)
put(page, (49, 492), "\u2022 Roland Jupiter-X musi by\u0107 wys\u0142any pe\u0142nopasmowo do systemu PA,", size=12.96)
put(page, (60, 508), "r\u00f3wnie\u017c do subwoofer\u00f3w.", size=12.96)
put(page, (60, 524), "Nie stosowa\u0107 filtr\u00f3w HPF ograniczaj\u0105cych d\u00f3\u0142 instrumentu.", size=12.96)
put(page, (49, 540), "\u2022 Klimatyzacja lub wydajne wiatraki s\u0105 wymagane.", size=12.96)

# Move final notes down to make room for the new requirement.
register_fonts(page, include_bold=True)
put(page, (55, 578), "UWAGI KO\u0143COWE", size=14.04, bold=True)
put(page, (61, 610), "\u2022 Prosimy o kontakt z ekip\u0105 techniczn\u0105 najp\u00f3\u017aniej 7 dni przed koncertem", size=12.96)
put(page, (61, 628), "\u2022 Wszelkie zmiany w riderze wymagaj\u0105 akceptacji zespo\u0142u", size=12.96)
put(page, (61, 646), "\u2022 Nasz basista jest z Chile; podczas pr\u00f3by d\u017awi\u0119ku prosimy o rozmow\u0119", size=12.96)
put(page, (72, 662), "z Carlosem w j\u0119zyku angielskim :-)", size=12.96)
put(page, (55, 706), "KONTAKT", size=14.04, bold=True)
put(page, (66, 737), "Jan Mitrowski", size=12.96)
put(page, (66, 755), "Tel: 724 011 079", size=12.96)
put(page, (66, 773), "E-mail: tabularasa.zespol@gmail.com", size=12.96)

doc.save(TARGET_PDF + ".tmp", garbage=4, deflate=True)
doc.close()
os.replace(TARGET_PDF + ".tmp", TARGET_PDF)
