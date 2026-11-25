"""Build offline HTML previews of each distinct layout in the three-month PDFs."""
from html import escape
from pathlib import Path
import re
from urllib.parse import quote

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "HTML"
SPEC = (
    ("Diary", "daily", 2),
    ("Weekly Diary", "weekly", 20),
    ("Monthly Diary", "monthly", 3),
)
STYLE = '''@font-face{font-family:"DM Sans";src:url("../Source/fonts/dm-sans.ttf")}
@font-face{font-family:"Instrument Serif";src:url("../Source/fonts/instrument-serif.ttf")}
*{box-sizing:border-box}body{margin:0;background:#eeede9;color:#171b22;font:1rem/1.5 "DM Sans",sans-serif}
header,main{max-width:1220px;margin:auto;padding:clamp(18px,4vw,48px)}header{padding-bottom:10px}
h1{font:clamp(3rem,8vw,5rem)/1 "Instrument Serif",serif;margin:.35em 0 .2em}
h2{font-weight:500}a{color:#344e70;text-underline-offset:.25em}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:22px}
figure{margin:0}figure>svg{display:block;width:100%;height:auto;border:1px solid #c4c7cc}
figcaption{margin:.6em 0 1em;color:#414852}.list{padding:0;list-style:none}
.list li{border-top:1px solid #b8bdc2;padding:.75em 0} @media print{header,figcaption{display:none!important}
main{padding:0;display:block!important}figure{break-after:page}figure>svg{border:0} @page{size:540pt 720pt;margin:0}}'''


def wrap(title, content):
    return f'''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title><style>{STYLE}</style>
{content}
</html>
'''


def inline_page(page, index, label):
    svg = page.get_svg_image(text_as_path=False)
    for identifier in set(re.findall(r'\bid="([^"]+)"', svg)):
        unique = f"page-{index}-{identifier}"
        svg = svg.replace(f'id="{identifier}"', f'id="{unique}"')
        svg = svg.replace(f'url(#{identifier})', f'url(#{unique})')
        svg = svg.replace(f'href="#{identifier}"', f'href="#{unique}"')
    return svg.replace("<svg ", f'<svg role="img" aria-label="{escape(label)}" ', 1)


links = []
for name, slug, count in SPEC:
    editions = []
    for theme in ("Light", "Dark"):
        pdf = ROOT / "3 Months" / theme / f"{name}.pdf"
        output = f"{slug}-{theme.lower()}.html"
        title = f"{name} / {theme}"
        url = "../" + quote(pdf.relative_to(ROOT).as_posix())
        pages = []
        with pymupdf.open(pdf) as book:
            total = len(book)
            for i in range(count):
                page = book[i]
                label = page.get_text().splitlines()[2]
                pages.append(f"<figure>{inline_page(page, i+1, label)}<figcaption>{escape(label)}</figcaption></figure>")
        (HTML/output).write_text(wrap(title, f'''<header><a href="index.html">Diary library</a>
<h1>{escape(title)}</h1><p><a href="{url}">Open the full {total}-page PDF</a></p></header>
<main class="grid" aria-label="Page layouts">{''.join(pages)}</main>'''), encoding="utf-8")
        editions.append(f'<a href="{output}">{theme} HTML</a> · <a href="{url}">{theme} PDF</a>')
    links.append(f"<li><strong>{name}</strong><br>{' / '.join(editions)}</li>")
legacy = []
for page in sorted((HTML/"diary").glob("*.html")):
    label = page.stem.replace("-", " ").title()
    legacy.append(f'<li><a href="diary/{page.name}">{label}</a></li>')
(HTML/"index.html").write_text(wrap("Remarkable Paper Pro", f'''<header><h1>Remarkable Paper Pro</h1>
<p>Undated daily, weekly, and monthly diaries for handwriting.</p></header>
<main><h2>Three-month editions</h2><ul class="list">{''.join(links)}</ul>
<h2>Original single-page templates</h2><ul class="list">{''.join(legacy)}</ul></main>'''), encoding="utf-8")
