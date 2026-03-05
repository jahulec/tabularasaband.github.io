import fitz


SOURCE_PDF = "RiderTabulaRasa.pdf"
TARGET_PDF = "RiderTabulaRasa-en.pdf"


def clear_regions(page, regions):
    for region in regions:
        rect = fitz.Rect(*region)
        page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)


def clear_text_blocks(page):
    image_rects = []
    for image in page.get_images(full=True):
        xref = image[0]
        image_rects.extend(page.get_image_rects(xref))

    blocks = page.get_text("blocks")
    for block in blocks:
        if len(block) < 7:
            continue
        block_type = block[6]
        if block_type != 0:
            continue
        rect = fitz.Rect(block[0], block[1], block[2], block[3])
        rect.x0 -= 1
        rect.y0 -= 1
        rect.x1 += 1
        rect.y1 += 1

        intersects_image = any(rect.intersects(img_rect) for img_rect in image_rects)
        if intersects_image:
            continue

        page.add_redact_annot(rect, fill=(1, 1, 1))

    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)


def put(page, x, y, text, size=11, bold=False):
    page.insert_text((x, y), text, fontsize=size, fontname="hebo" if bold else "helv")


def page1(page):
    put(page, 100.34, 232.0, "TECHNICAL RIDER", size=26, bold=True)
    put(page, 372.07, 232.0, "BAND", size=26, bold=True)


def page2(page):
    y = 86
    put(page, 55.92, y, "Band: Tabula Rasa  Lineup:", size=11, bold=True)
    y += 28
    lines = [
        "1. Guitarist / Vocalist (Benek) - Electric guitar, Helix LT guitar processor,",
        "    lead vocal microphone",
        "2. Guitarist (Johnny) - Electric guitar, Helix LT guitar processor",
        "3. Bassist (Carlos) - Bass guitar, BOSS GT-1 multi-effects",
        "4. Keyboardist (Delia) - Jupiter-X synthesizer, Roland FP-30 piano, backing",
        "    vocal microphone and percussion (tambourine, shakers)",
        "5. Drummer (Bartek) - Gretsch Black Hawk Fusion drum kit (10, 12, 14, 22)",
        "",
        "STAGE PLOT",
        "• Frontman (guitar / vocal) - Downstage center",
        "• Keyboardist - Stage left, slightly upstage",
        "• Guitarist - Stage right (between bassist and frontman)",
        "• Bassist - Stage right",
        "• Drums - Upstage center (behind the frontman)",
        "",
        "MONITORING (MON)",
        "• Wedge monitors for everyone except the drummer",
    ]
    for text in lines:
        if text == "":
            y += 12
            continue
        put(page, 66.86 if text.startswith(("1.", "2.", "3.", "4.", "5.", "•")) else 55.92, y, text, size=11, bold=text in {"STAGE PLOT", "MONITORING (MON)"})
        y += 15


def page3(page):
    put(page, 66.86, 84, "• Drummer - in-ear monitor (sum mix from FOH console)", size=11)
    put(page, 55.92, 118, "INPUT LIST", size=12, bold=True)

    x_pos = 59.16
    x_src = 223.85
    x_qty = 363.67
    y = 138
    put(page, 119.30, y, "Position", size=11, bold=True)
    put(page, 258.65, y, "Source", size=11, bold=True)
    put(page, 338.47, y, "Qty", size=11, bold=True)

    rows = [
        ("Lead vocal", "Microphone", "1"),
        ("Guitar Helix LT (frontman)", "MONO input / XLR", "1"),
        ("Guitar Helix LT (guitarist)", "STEREO input / XLR", "2"),
        ("Bass (BOSS GT-1)", "MONO Jack -> DI box", "1"),
        ("Backing vocals (keyboardist)", "Microphone", "1"),
        ("Synthesizer (Roland Jupiter-X)", "STEREO input / XLR", "2"),
        ("Keys (Roland FP-30)", "MONO Jack -> DI box", "1"),
        ("Drums (kick)", "Microphone", "1"),
        ("Drums (snare top / bottom)", "Microphone", "2"),
        ("Drums (hi-hat)", "Microphone", "1"),
        ("Drums (high toms)", "Microphone", "2"),
        ("Drums (floor tom)", "Microphone", "1"),
        ("Drums (overheads)", "Microphone", "2"),
    ]

    y += 23
    for position, source, qty in rows:
        put(page, x_pos, y, position, size=11)
        put(page, x_src, y, source, size=11)
        put(page, x_qty, y, qty, size=11)
        y += 31 if "(" in position and ")" in position else 24

    put(page, 55.92, 556, "Our bassist is from Chile, so during soundcheck please communicate", size=11)
    put(page, 55.92, 571, "with Carlos in English ;) ", size=11)
    put(page, 55.92, 604, "CATERING & BACKSTAGE", size=12, bold=True)

    catering = [
        "• Water (minimum 10 bottles)",
        "• Tea, coffee, honey, lemon",
        "• 5 healthy, full-value meals (no fast food)",
        "• Access to 230V power sockets in the backstage area",
        "• Private backstage (if possible)",
    ]
    y = 621
    for line in catering:
        put(page, 66.86, y, line, size=11)
        y += 17


def page4(page):
    put(page, 55.92, 88, "FINAL NOTES", size=12, bold=True)
    put(page, 66.86, 118, "• Please contact the technical crew no later than 7 days before the show", size=11)
    put(page, 66.86, 135, "• Any rider changes require the band's approval", size=11)

    put(page, 55.92, 178, "CONTACT", size=12, bold=True)
    put(page, 66.86, 208, "Delia Janiszewska", size=11)
    put(page, 66.86, 225, "Phone: +48 602 502 562", size=11)
    put(page, 66.86, 242, "E-mail: tabularasa.zespol@gmail.com", size=11)


doc = fitz.open(SOURCE_PDF)
for page in doc:
    clear_text_blocks(page)

page1(doc[0])
page2(doc[1])
page3(doc[2])
page4(doc[3])

doc.set_metadata(
    {
        "title": "Tabula Rasa Technical Rider (EN)",
        "author": "Tabula Rasa",
        "subject": "Technical Rider",
        "keywords": "Tabula Rasa, rider, technical rider, stage plot",
    }
)

doc.save(TARGET_PDF)
doc.close()
print("Created RiderTabulaRasa-en.pdf")
