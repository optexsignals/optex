# optexmodel.com

Static site, no build step. Netlify publishes this repo as-is.

- `/` — OPTEX Market Timing Model (QQQ, long/short). Pages built from DLTA_Fund/website_optex_index.
  `data/latest.json` today's position, `data/archive/` every day as published.
- `/allweather/` — OPTEX all-weather stock portfolio (moved from the root). Pages built from DLTA_Fund/website;
  the VM's daily job writes `allweather/data/`, `allweather/feed.xml`, `allweather/og.png`, `allweather/posts/`.

The commit history is the timestamped record of what was published and when.
