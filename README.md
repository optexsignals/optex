# optexmodel.com — OPTEX all-weather stock portfolio

Static site, no build step. Netlify publishes this folder as-is.

- `data/latest.json` — today's portfolio (percent of the account only)
- `data/archive/YYYY-MM-DD.json` — every day's portfolio, written once and never edited
- `data/series.json`, `data/history*.json` — the performance record
- `posts/YYYY-MM-DD.md` — ready-to-paste post text; `og.png` — today's chart

Updated every trading day by the model's production job, which commits here before the market opens.
The commit history is the timestamped record that each portfolio was published before the open it applies to.
