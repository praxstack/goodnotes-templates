"""Build three undated Paper Pro diaries inspired by the Prax GoodNotes journal."""
from argparse import ArgumentParser
from functools import lru_cache
from io import BytesIO
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.lib.colors import HexColor, linearlyInterpolatedColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from svglib.svglib import svg2rlg

OUTPUT = Path(__file__).resolve().parents[1] / "Editions"
ASSETS = Path(__file__).with_name("fonts")
WIDTH, HEIGHT = 540, 720
LEFT, RIGHT = 46, 494
GAP = 28
THEMES = {
    "Light": {
        "paper": "#faf9f6", "ink": "#161b23", "quiet": "#4d525a", "rule": "#9298a0",
        "edge": "#c6c8ca", "sage": "#285a4c", "clay": "#86403b", "amber": "#795318",
        "lavender": "#524577", "plain": "#32465e",
    },
    "Dark": {
        "paper": "#13161b", "ink": "#f5f2e9", "quiet": "#c2c4c9", "rule": "#737984",
        "edge": "#464c56", "sage": "#a0caba", "clay": "#efaa9f", "amber": "#dfbd7f",
        "lavender": "#c9bbec", "plain": "#adc4df",
    },
}
BOOK_ACCENT = {"Diary": "plain", "Weekly diary": "sage", "Monthly diary": "clay"}
ART = Path(__file__).with_name("diary-art")
WATERMARKS = {
    "Morning": ("dawn", "amber"),
    "Evening": ("dusk", "lavender"),
    "Week ahead": ("week", "sage"),
    "Month ahead": ("month", "clay"),
    "Month in review": ("month", "clay"),
}
ART_WIDTH, ART_HEIGHT = 150, 80
ART_SCALE = 0.88
ART_LEFT = RIGHT - ART_WIDTH * ART_SCALE
ART_BOTTOM = 579


@lru_cache(maxsize=8)
def watermark(name, paper, accent):
    source = (ART / f"{name}.svg").read_text()
    for placeholder, strength in (("#31556d", 0.58), ("#9ab9be", 0.36)):
        mixed = linearlyInterpolatedColor(HexColor(paper), HexColor(accent), 0, 1, strength)
        source = source.replace(placeholder, "#" + mixed.hexval()[2:])
    return svg2rlg(BytesIO(source.encode("utf-8")))


def draw_watermark(canvas, name, tone):
    form = f"DiaryWatermark-{name}"
    if not canvas.hasForm(form):
        art = watermark(name, THEMES[canvas.theme]["paper"], THEMES[canvas.theme][tone])
        canvas.beginForm(form, 0, 0, ART_WIDTH * ART_SCALE, ART_HEIGHT * ART_SCALE)
        canvas.saveState()
        canvas.scale(ART_SCALE, ART_SCALE)
        renderPDF.draw(art, canvas, 0, 0)
        canvas.restoreState()
        canvas.endForm()
    canvas.saveState()
    canvas.translate(ART_LEFT, ART_BOTTOM)
    canvas.doForm(form)
    canvas.restoreState()



def write(canvas, x, y, text, font="Diary Sans", size=11, color="ink"):
    width = pdfmetrics.stringWidth(text, font, size)
    assert LEFT - 2 <= x and x + width <= RIGHT + 1, text
    canvas.setFont(font, size)
    canvas.setFillColor(canvas.palette[color])
    canvas.drawString(x, y, text)


def right_text(canvas, edge, y, text, size=10, color="quiet"):
    x = edge - pdfmetrics.stringWidth(text, "Diary Sans", size)
    write(canvas, x, y, text, size=size, color=color)


def stroke(canvas, x1, y1, x2, y2, color="rule", weight=0.55):
    canvas.setStrokeColor(canvas.palette[color])
    canvas.setLineWidth(weight)
    canvas.line(x1, y1, x2, y2)


def frame(canvas, series, tag, title, subtitle, date_label, number, total):
    canvas.setFillColor(canvas.palette["paper"])
    canvas.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    accent = BOOK_ACCENT[series]
    stroke(canvas, LEFT, 668, LEFT + 20, 668, accent, 2.0)
    write(canvas, LEFT + 31, 664.5, series, size=11, color=accent)
    right_text(canvas, RIGHT, 664.5, tag, color=accent)

    title_size = 65 if len(title) <= 13 else 53
    if title in WATERMARKS:
        title_end = LEFT - 2 + pdfmetrics.stringWidth(title, "Diary Serif", title_size)
        assert title_end + 16 <= ART_LEFT
        draw_watermark(canvas, *WATERMARKS[title])
    write(canvas, LEFT - 2, 594, title, "Diary Serif", title_size)
    write(canvas, LEFT, 566, subtitle, size=11, color="quiet")
    field_x = 355
    write(canvas, field_x, 566, date_label, size=10, color="quiet")
    label_width = pdfmetrics.stringWidth(date_label, "Diary Sans", 10)
    stroke(canvas, field_x + label_width + 9, 564.5, RIGHT, 564.5, "rule")
    stroke(canvas, LEFT, 548, RIGHT, 548, accent, 0.82)

    stroke(canvas, LEFT, 44, RIGHT, 44, "edge", 0.7)
    right_text(canvas, RIGHT, 25, f"{number:02} / {total}")


def writing_row(canvas, top, height, prompts, feature=False):
    assert top - height >= 58
    width = (RIGHT - LEFT - GAP * (len(prompts) - 1)) / len(prompts)
    for index, (heading, helper, tone) in enumerate(prompts):
        x = LEFT + index * (width + GAP)
        font, size = ("Diary Serif", 29) if feature else ("Diary Sans", 12)
        assert pdfmetrics.stringWidth(heading, font, size) <= width, heading
        write(canvas, x, top - (27 if feature else 16), heading, font, size, tone)
        if helper:
            assert pdfmetrics.stringWidth(helper, "Diary Sans", 10) <= width, helper
            write(canvas, x, top - (43 if feature else 32), helper, size=10, color="quiet")
        first = top - ((67 if helper else 55) if feature else (52 if helper else 38))
        for y in range(first, top - height + 5, -21):
            stroke(canvas, x, y, x + width, y)
    return top - height - 10


def rows(canvas, layout):
    top = 531
    for index, (height, prompts) in enumerate(layout):
        feature = index == 0 and len(prompts) == 1
        top = writing_row(canvas, top, height, prompts, feature)


def page_outline(canvas, key, label):
    canvas.bookmarkPage(key)
    canvas.addOutlineEntry(label, key)


def new_diary(title, theme, output):
    directory = output / theme
    directory.mkdir(parents=True, exist_ok=True)
    canvas = Canvas(str(directory / f"{title}.pdf"), pagesize=(WIDTH, HEIGHT), pageCompression=1)
    canvas.theme = theme
    canvas.palette = {key: HexColor(value) for key, value in THEMES[theme].items()}
    canvas.setTitle(f"{title} ({theme})")
    return canvas


def daily(theme, output, days):
    canvas = new_diary("Diary", theme, output)
    morning = (
        (132, (("One tiny next step", "Name the first physical action you can take in five minutes.", "sage"),)),
        (104, (("Mood", "How am I arriving?", "plain"), ("Energy", "What can I give?", "amber"),
               ("Focus", "What has my attention?", "lavender"))),
        (98, (("Body and breath", "", "plain"), ("What matters today?", "", "clay"))),
        (98, (("If I get stuck", "", "amber"), ("Something I’m grateful for", "", "lavender"))),
    )
    evening = (
        (132, (("What did I get through?", "Include a small win or something you moved forward.", "sage"),)),
        (111, (("What felt heavy?", "", "clay"), ("What helped slightly?", "", "lavender"))),
        (104, (("Tomorrow inherits", "One small thing that is ready to start.", "amber"), ("Something I’m grateful for", "", "plain"))),
        (86, (("One honest, kinder sentence", "", "sage"),)),
    )
    for day in range(1, days + 1):
        page_outline(canvas, f"day-{day}", f"Day {day:02}")
        for offset, (title, subtitle, layout) in enumerate((
            ("Morning", "Check in, then choose a small start.", morning),
            ("Evening", "Close the day gently. Small efforts count.", evening),
        )):
            frame(canvas, "Diary", f"Day {day:02}", title, subtitle, "Date", 2 * day - 1 + offset, 2 * days)
            rows(canvas, layout)
            canvas.showPage()
    canvas.save()


def weekly(theme, output, weeks):
    canvas = new_diary("Weekly Diary", theme, output)
    days = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    pages = [
        ("Week ahead", "Choose what to protect this week.", (
            (134, (("What matters this week?", "", "sage"),)),
            (134, (("Dates and commitments", "", "amber"), ("What can wait?", "", "clay"))),
            (154, (("One thing to start with", "When and where can I begin?", "lavender"),)),
        )),
        *((day, "Keep whatever you want to remember.", (
            (340, (("Loose writing", "", "plain"),)),
            (110, (("One thing that helped", "", "sage"),)),
        )) for day in days),
        ("Focus and priorities", "Give one thing a clear first step.", (
            (226, (("One thing to protect", "", "sage"),)),
            (226, (("What gets less time?", "", "plain"),)),
        )),
        ("Tasks and follow-ups", "Make pending things visible.", (
            (234, (("To do", "", "amber"),)),
            (218, (("Waiting on", "", "plain"),)),
        )),
        ("Decisions", "Keep a record for future you.", (
            (234, (("What I decided and why", "", "clay"),)),
            (218, (("What to revisit", "", "plain"),)),
        )),
        ("Ideas", "A place to put ideas until you need them.", ((466, (("Ideas worth keeping", "", "lavender"),)),)),
        ("What I’m learning", "Capture a useful observation and a way to test it.", (
            (226, (("What I noticed", "", "plain"),)),
            (226, (("What I’ll try next", "", "sage"),)),
        )),
        *((f"Notes {index}", "Room for whatever the week brings.",
           ((466, (("Loose writing", "", "plain"),)),)) for index in range(1, 6)),
        ("Weekly pattern review", "Look for what kept showing up.", (
            (134, (("Repeated triggers", "", "clay"), ("Escape loops", "", "lavender"),
                   ("Repeated helps", "", "sage"))),
            (134, (("Body signals", "", "plain"), ("A thought that returned", "", "plain"))),
            (149, (("One experiment next week", "Keep it small enough to actually test.", "amber"),)),
        )),
        ("Reset for next week", "Pick up what is worth carrying.", (
            (150, (("What I did that counts", "", "amber"),)),
            (134, (("Keep doing", "", "sage"), ("Try differently", "", "clay"))),
            (149, (("One big thing, one small start", "", "lavender"),)),
        )),
    ]
    assert len(pages) == 20
    for week in range(1, weeks + 1):
        page_outline(canvas, f"week-{week}", f"Week {week:02}")
        for offset, (title, subtitle, layout) in enumerate(pages, start=1):
            number = (week - 1) * len(pages) + offset
            frame(canvas, "Weekly diary", f"Week {week:02}  /  {offset:02} of 20", title, subtitle,
                  "Date" if title in days else "Week of", number, weeks * len(pages))
            rows(canvas, layout)
            canvas.showPage()
    canvas.save()


def monthly(theme, output, months):
    canvas = new_diary("Monthly Diary", theme, output)
    pages = (
        ("Month ahead", "Picture the ordinary days you’re making room for.", (
            (134, (("An ordinary good morning", "What would it look like?", "sage"),)),
            (134, (("Dates that matter", "", "amber"), ("What needs space?", "", "lavender"))),
            (162, (("What can I begin this week?", "", "plain"),)),
        )),
        ("Monthly notes", "Keep the small moments as well as the big ones.", (
            (128, (("A scene I want to remember", "", "lavender"),)),
            (332, (("Loose writing", "", "plain"),)),
        )),
        ("Month in review", "Start with what the month felt like.", (
            (110, (("What this month felt like", "", "sage"),)),
            (108, (("What I’m proud of", "", "amber"), ("What kept happening?", "", "clay"))),
            (108, (("A day it clicked", "", "plain"), ("A day it didn’t", "", "plain"))),
            (110, (("What I want next month to feel like", "", "sage"),)),
        )),
    )
    for month in range(1, months + 1):
        page_outline(canvas, f"month-{month}", f"Month {month:02}")
        for offset, (title, subtitle, layout) in enumerate(pages, start=1):
            number = (month - 1) * len(pages) + offset
            frame(canvas, "Monthly diary", f"Month {month:02}", title, subtitle, "Month / year", number, months * len(pages))
            rows(canvas, layout)
            canvas.showPage()
    canvas.save()


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--three-month", action="store_true", help="Build the 90-day set in a separate folder.")
    args = parser.parse_args()
    if args.three_month:
        output = OUTPUT.with_name("3 Months")
        days, weeks, months = 90, 13, 3
    else:
        output = OUTPUT
        days, weeks, months = 60, 20, 12
    pdfmetrics.registerFont(TTFont("Diary Sans", str(ASSETS / "dm-sans.ttf")))
    pdfmetrics.registerFont(TTFont("Diary Serif", str(ASSETS / "instrument-serif.ttf")))
    for theme in THEMES:
        daily(theme, output, days)
        weekly(theme, output, weeks)
        monthly(theme, output, months)
