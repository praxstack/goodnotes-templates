# Remarkable Paper Pro

Undated diaries for handwriting on the reMarkable Paper Pro. The three-month set comes in Light and Dark with a 540 × 720 pt portrait page, muted color accents, and four original vector illustrations.

## Three-month set

| Diary | Layout | Light | Dark |
| --- | --- | --- | --- |
| Diary | 90 days with Morning and Evening pages · 180 pages | [PDF](3%20Months/Light/Diary.pdf) · [HTML](HTML/daily-light.html) | [PDF](3%20Months/Dark/Diary.pdf) · [HTML](HTML/daily-dark.html) |
| Weekly Diary | 13 weeks with 20 pages each · 260 pages | [PDF](3%20Months/Light/Weekly%20Diary.pdf) · [HTML](HTML/weekly-light.html) | [PDF](3%20Months/Dark/Weekly%20Diary.pdf) · [HTML](HTML/weekly-dark.html) |
| Monthly Diary | Three months with a plan, notes, and review · 9 pages | [PDF](3%20Months/Light/Monthly%20Diary.pdf) · [HTML](HTML/monthly-light.html) | [PDF](3%20Months/Dark/Monthly%20Diary.pdf) · [HTML](HTML/monthly-dark.html) |

Open the [side-by-side preview](Editions/Watermark%20Preview.png) for a quick comparison. Download the folder before opening [the offline HTML library](HTML/index.html) in a browser. The HTML shows each distinct page layout once. The PDFs contain the full sequence and outline entries for each day, week, or month.

## Use on reMarkable

Import the PDF as a document. Write directly on the printed layout and swipe to the next prepared page. For a fresh copy, long-press the imported file in My files and choose **Duplicate → Original document**. See [reMarkable's guidance on PDF layouts](https://support.remarkable.com/articles/Knowledge/Templates).

## Earlier editions and source

- [Editions](Editions) contains the earlier Light and Dark sets covering 60 days, 20 weeks, and 12 months respectively.
- [Single Pages](Single%20Pages) and [original HTML templates](HTML/diary) contain the first Morning and Night layouts.
- [Goodnotes](Goodnotes) contains the two 31-day Morning/Evening builds.
- The PDFs next to this README are the earlier three-diary drafts and the 30-day Morning-only files.
- [Source](Source) contains both builders, the original [SVG watermarks](Source/diary-art), and the [font files and licenses](Source/fonts).

Run from the repository root:

```sh
uv run --no-project --with reportlab --with svglib python 'Remarkable Paper Pro/Source/build_diaries.py' --three-month
uv run --no-project --with pymupdf python 'Remarkable Paper Pro/Source/build_previews.py'
```

Omit `--three-month` to build the earlier Light and Dark sets under `Editions`.

The prompts take inspiration from the [Prax Goodnotes journal](../packages/packs-prax-journal/versions/prax-goodnotes-journal-chatgpt-version). The Paper Pro editions use their own layouts and SVG illustrations.
