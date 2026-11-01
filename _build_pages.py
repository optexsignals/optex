"""Writes the site's HTML pages from one shared header/footer. Run after editing: python website/_build_pages.py"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_URL = "https://github.com/optexsignals/optex"   # the public repo Netlify deploys from

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://optexmodel.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="alternate" type="application/rss+xml" title="OPTEX" href="feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css?v={v}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%2315171a'/><text x='16' y='23' font-family='Georgia,serif' font-size='20' fill='white' text-anchor='middle'>O</text></svg>">
</head>
<body>
<header class="mast"><div class="wrap">
  <a class="mark" href="index.html">OPTEX<small>All-weather stock portfolio</small></a>
  <nav class="nav"><a href="index.html"{a4}>Home</a><a href="how-it-works.html"{a2}>How it works</a><a href="performance.html"{a1}>Performance</a><a href="archive.html"{a3}>Archive</a><a class="cta" href="portfolio.html"{a0}>Today's portfolio</a></nav>
</div></header>
"""

FOOT = """<footer><div class="wrap">
  <div><span class="mark">OPTEX</span><p>optexmodel.com · <a href="archive.html">Every day, archived</a> · <a href="index.html#contact">Contact</a> · <a href="feed.xml">RSS</a></p></div>
  <p>For information only. Not investment advice, and not an offer to buy or sell any security or fund. Performance shown is model performance, not the results of actual trading. Past performance is not a guide to the future. Trading involves risk of loss, and futures leverage increases it.</p>
</div></footer>
<script src="assets/app.js?v={v}"></script>
"""


def page(fn, title, desc, which, body):
    a = {f"a{i}": (' aria-current="page"' if i == which else "") for i in range(5)}
    # version stamp from the asset files, so a normal refresh picks up any change
    v = int(max((HERE / "assets" / f).stat().st_mtime for f in ("style.css", "app.js")))
    (HERE / fn).write_text(HEAD.format(title=title, desc=desc, v=v, **a) + body.replace("@REPO@", REPO_URL).replace("{v}", str(v)) + "</body>\n</html>\n", encoding="utf-8")



PORTFOLIO = """<main class="wrap" id="app"><p class="loading">Loading the portfolio…</p></main>
""" + FOOT + """<script>
(async () => {
  const app = document.getElementById("app");
  try { renderPortfolio(await loadJSON("data/latest.json"), app); }
  catch (e) { app.innerHTML = '<p class="loading">Could not load the portfolio</p>'; }
})();
</script>
"""

ARCHIVE = """<main class="wrap" id="app"><p class="loading">Loading…</p></main>
""" + FOOT + """<script>
(async () => {
  const app = document.getElementById("app"), d = new URLSearchParams(location.search).get("d");
  try {
    if (d && /^\\d{4}-\\d{2}-\\d{2}$/.test(d)) return renderPortfolio(await loadJSON(`data/archive/${d}.json`), app, { archived: true });
    const idx = (await loadJSON("data/archive/index.json")).slice().reverse();
    app.innerHTML = `<div class="hero" style="grid-template-columns:1fr"><div><p class="kicker">Archive</p><h1 class="h2" style="font-size:clamp(48px,8vw,96px)">Every day,<br>as published</h1></div>
      <p class="say">Each day's portfolio is written once, before the open, and never edited. The files also live in a public Git repository, so anyone can check the timestamps.</p></div>
      <p class="alloc-cap">Strategy columns show the allocation at the open, as a % of the account. The last two columns show the previous session's return.</p>
      <div class="scroll"><table><tr><th class="l">Portfolio for the open of</th><th><i class="chip wave"></i>Core</th><th><i class="chip opp"></i>Contrarian</th><th><i class="chip fut"></i>Compass</th><th>Net</th><th>Previous session</th><th>S&amp;P 500</th></tr>
      ${idx.map((r) => `<tr><td class="l"><a href="archive.html?d=${r.asof}">${day(r.next_session || r.asof, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</a>${r.reconstructed ? " *" : ""}</td>
        <td>${pct(r.lv_next, 0, false)}</td><td>${pct(r.har_next, 0, false)}</td><td>${pct(r.nq_next)}</td>
        <td class="${tone(r.net_next ?? r.net_target_next)}"><b>${pct(r.net_next ?? r.net_target_next)}</b></td>
        <td class="${tone(r.day)}">${pct(r.day, 2)}</td><td>${pct(r.spx_day, 2)}</td></tr>`).join("")}</table></div>
      ${idx.some((r) => r.reconstructed) ? '<p class="note">* Rebuilt after the fact with the same rules, for days before the site went live. Not published at the time.</p>' : ""}`;
  } catch (e) { app.innerHTML = '<p class="loading">Could not load the archive</p>'; }
})();
</script>
"""

SIGNUP = """<form class="signup" name="daily" method="POST" data-netlify="true" netlify-honeypot="company" action="thanks.html">
      <input type="hidden" name="form-name" value="daily">
      <p hidden><label>Company <input name="company"></label></p>
      <input type="email" name="email" required placeholder="Your email address" aria-label="Email address" autocomplete="email">
      <button type="submit">Get it free</button>
    </form>
    <p class="fine">One email a day, before the open. Free. Unsubscribe any time.</p>"""

CONTACT = """<form class="contact" id="contact" name="contact" method="POST" data-netlify="true" netlify-honeypot="company" action="message-sent.html">
    <input type="hidden" name="form-name" value="contact">
    <p hidden><label>Company <input name="company"></label></p>
    <h3>Want to discuss further?</h3>
    <label>Name<input name="name" autocomplete="name" required></label>
    <label>Email<input type="email" name="email" autocomplete="email" required></label>
    <label>Question<textarea name="message" rows="5" required></textarea></label>
    <button type="submit">Send</button>
  </form>"""

# email sign-up at the foot of the inner pages, as on the homepage
CLOSER = """<div class="lp">
<section class="lp-end"><div class="wrap">
  <h2>Get each day's portfolio before the open.</h2>
  """ + SIGNUP + """
</div></section>
</div>
"""

PERFORMANCE = """<main class="wrap" id="app"><p class="loading">Loading the track record…</p></main>
""" + CLOSER + FOOT + """<script>renderPerformance(document.getElementById("app"));</script>
"""

LANDING = """<main class="lp">
<section class="lp-hero"><div class="wrap">
  <div class="lp-hero-text" id="signup">
    <h1>Know <span class="c-core">what</span> to buy,<br><span class="c-contra">when</span> to buy,<br>and when to <span class="c-compass">protect.</span></h1>
    <div class="lp-hero-side">
      <p class="lede">A rules-based portfolio that takes the guesswork out of investing, built to profit whether markets rise or fall.</p>
      """ + SIGNUP + """
      <p class="more"><a href="portfolio.html">See today's portfolio →</a></p>
    </div>
  </div>
  <figure class="lp-hero-chart"><div class="chart-head"><span><i class="ln p"></i>OPTEX all-weather stock portfolio</span><span><i class="ln g"></i>S&amp;P 500</span></div><div class="chart" id="hero-chart"></div></figure>
</div></section>

<section class="wrap lp-stats" id="stats"></section>

<section class="wrap lp-sec">
  <p class="kicker">The problem</p>
  <h2>The market rewards discipline.<br>Most investors act on emotion.</h2>
  <div class="lp-three">
    <div><h3>Which stocks?</h3><p>There are thousands, and everyone has a tip. Most people end up buying companies they are familiar with, or whatever is in the news.</p></div>
    <div><h3>When to buy and sell?</h3><p>Wait for a dip and it never comes. Buy near the top, sell in the panic. Timing is where most investors lose.</p></div>
    <div><h3>What about the crashes?</h3><p>Everyone knows markets fall, and when they do it hurts. Most portfolios simply ride the drop all the way down. This one is built to profit on the way up, and on the way down.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <div class="sec-split">
  <div>
  <p class="kicker">The solution</p>
  <h2>Three strategies.<br>One portfolio.</h2>
  </div>
  <p class="lede">Three distinct strategies, each with its own edge. One captures long-term trends, one profits from panic, and one decides how much risk to take. Together they deliver significantly higher returns, with less risk and fewer losses.</p>
  </div>
  <div class="lp-books" id="books"></div>
  <p class="more"><a href="how-it-works.html">How each strategy works →</a></p>
</section>

<section class="wrap lp-sec" id="crash-test">
  <div class="sec-split">
  <div>
  <p class="kicker">The crash test</p>
  <h2>Markets are crashing.<br>Should you hold, sell or buy?</h2>
  </div>
  <p class="lede">When markets sell off and volatility spikes, it is stressful, and that is exactly when good decisions are hardest to make. The portfolio has no nerves to lose. It follows rules set in advance, whatever the headlines say. Here is how it handled every major S&amp;P 500 sell-off since 2008.</p>
  </div>
  <div class="crash" id="crash"></div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Track record</p>
  <h2 id="yrs-h">Not one losing year.</h2>
  <div class="yrs" id="years"></div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Day to day</p>
  <h2>Clear to follow. Easy to live with.</h2>
  <div class="lp-three">
    <div><h3>One email, before the open</h3><p>Each morning you get the full portfolio: every holding, every change, and where the market exposure stands. Read it in two minutes.</p></div>
    <div><h3>Works at any size</h3><p>Everything is shown as a percentage of the account, so it reads the same for a $10,000 account or a $10 million one.</p></div>
    <div><h3>No screen-watching</h3><p>All changes happen at the open, so there is nothing to do during the day. Most days bring one or two trades, and about a third bring none.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Transparency</p>
  <h2>Every decision, on the record.</h2>
  <div class="lp-three">
    <div><h3>Called in advance</h3><p>Each day's portfolio is published before the US market opens, so every decision is made in public, never after the fact.</p></div>
    <div><h3>A permanent record</h3><p>Every day stays in the <a href="archive.html">archive</a>, and every file is timestamped in a <a href="@REPO@">public Git repository</a>. Nothing can be quietly changed later.</p></div>
    <div><h3>Rules, not opinions</h3><p>Every decision comes from the same fixed rules, applied the same way every day. No forecasts, no gut feel, no exceptions.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">FAQ</p>
  <h2>Common questions</h2>
  <div class="faq-grid">
  <div class="faq">
    <details><summary>Can it lose money?</summary><p>Yes. In the 2011 debt scare it fell 13%, and its worst fall since 2000 was 15%. Future falls can be deeper.</p></details>
    <details><summary>What does it cost?</summary><p>The daily email is free.</p></details>
    <details><summary>Is this investment advice?</summary><p>No. It is the published output of a model, the same for everyone. It does not know your circumstances, and what you do with it is up to you.</p></details>
    <details><summary>Do I need to trade futures?</summary><p>Compass, the market-timing strategy, uses Nasdaq-100 index futures. Core and Contrarian trade ordinary shares. Without the futures you would hold the stocks with their full market risk, which is not the same portfolio.</p></details>
  </div>
  """ + CONTACT + """
  </div>
</section>

<section class="lp-end"><div class="wrap">
  <h2>Get each day's portfolio before the open.</h2>
  """ + SIGNUP + """
</div></section>
</main>
""" + FOOT + """<script>renderLanding();</script>
"""

SENT = """<main class="wrap lp-thanks">
  <p class="kicker">Message sent</p>
  <h1>Thank you.</h1>
  <p class="lede">We have your question and will reply by email. Meanwhile, here is <a href="portfolio.html">today's portfolio</a>.</p>
</main>
""" + FOOT + """
"""

THANKS = """<main class="wrap lp-thanks">
  <p class="kicker">You're on the list</p>
  <h1>Thank you.</h1>
  <p class="lede">The first email arrives before the next US market open. Meanwhile, here is <a href="portfolio.html">today's portfolio</a>.</p>
</main>
""" + FOOT + """
"""

HOW = """<main class="wrap">
  <div class="hero how-hero">
    <div><p class="kicker">How it works</p><h1 class="h2" style="font-size:clamp(48px,8vw,104px)">Core.<br>Contrarian.<br>Compass.</h1>
    <p class="say">One portfolio. Three distinct strategies, each with its own edge. One captures long-term trends, one profits from panic, and one decides how much risk to take.</p></div>
    <figure class="hero-art" id="hero-art"></figure>
  </div>
  <div class="three">
    <div><p class="kicker" style="color:var(--wave)"><i class="chip wave"></i> The long-term engine</p><h3>Core</h3>
      <p>Every stock swings between calm spells and rough patches. The Core strategy looks for strong, leading stocks that have just come through a rough patch and are settling into a calm, steady advance.</p>
      <p>It holds each stock for as long as that advance persists, and sells when volatility returns, usually as the stock starts to roll over. Core scans the market every day, so the portfolio is constantly refreshed as old positions exit and new ones are added.</p>
      <p>Risk is strictly managed. Each new position is limited to 1.5% of the portfolio, and with up to 50 holdings spread across sectors, it stays broadly diversified.</p></div>
    <div><p class="kicker" style="color:var(--opp)"><i class="chip opp"></i> The opportunist</p><h3>Contrarian</h3>
      <p>When an earnings miss or a bad headline sets off a wave of fear, even great companies can be sold relentlessly, day after day, driving the price far below anything the news justifies. The Contrarian strategy looks for these moments of capitulation, when forced and emotional selling has run its course.</p>
      <p>It steps in gradually to manage risk. Each purchase is 3.3% of the portfolio, and if the selling continues it adds more, up to three purchases (10%) in any one stock. It sells as soon as the price snaps back, usually within days.</p>
      <p>Most of the time it waits in cash. It is busiest in market panics, exactly when Core is cutting back.</p></div>
    <div><p class="kicker" style="color:var(--kairos)"><i class="chip fut"></i> The risk manager</p><h3>Compass</h3>
      <p>The Compass strategy assesses the entire market every day, reading breadth, volatility, sentiment and trend, and forms a directional view.</p>
      <p>Most days its job is to protect Core and Contrarian, using Nasdaq-100 index futures to hedge out their market risk so that returns come from stock selection alone. When it has high conviction of a move in either direction, it takes the entire portfolio long or short.</p>
      <p>It sizes its positions according to market conditions, cutting exposure when volatility runs high. That keeps losses in check in the roughest markets, while still letting it profit from both its long and its short calls.</p></div>
  </div>

  <section class="lp-sec pm">
    <p class="kicker">Portfolio management</p>
    <h2 class="h2">How the three work together</h2>
    <p class="lede pm-lede">Core and Contrarian decide which stocks the portfolio owns. Compass decides how much market risk it carries. Capital is allocated in a fixed order, and every limit is checked each day before the open.</p>
    <div class="three pm-flow">
      <div><p class="kicker">First call on capital</p><h3>Contrarian</h3>
        <p>When Contrarian spots a capitulation opportunity, it is prioritized. If there isn't enough cash, the Core strategy sells its oldest positions to make room. As cash frees up again, Core buys back any of those stocks that are still in a calm, steady advance.</p></div>
      <div><p class="kicker">Remaining capital</p><h3>Core</h3>
        <p>Core invests the cash that is left, 1.5% per stock. Together, Core and Contrarian never hold more than 100% of the portfolio, so stocks are never bought on margin.</p></div>
      <div><p class="kicker">Net exposure</p><h3>Compass</h3>
        <p>Compass measures the market exposure of the stock positions and uses Nasdaq-100 futures to set the portfolio's net exposure: close to zero on most days, long or short when it has high conviction.</p></div>
    </div>
    <h3 class="sub-h">Strategy &amp; portfolio limits</h3>
    <div class="scroll"><table class="quant risk-t">
      <tr><th class="l"></th><th>Core</th><th>Contrarian</th><th>Compass</th><th>Portfolio</th></tr>
      <tr><td class="l">Position size</td><td>1.5% of the portfolio</td><td>3.3% per purchase, up to three purchases (10%)</td><td>−200% to +100%</td><td>–</td></tr>
      <tr><td class="l">Max positions</td><td>50</td><td>20</td><td>1</td><td>71</td></tr>
      <tr><td class="l">Max allocation</td><td>75%</td><td>100%</td><td>−200% to +100%</td><td>±100% net</td></tr>
      <tr><td class="l">Net exposure</td><td>Long only</td><td>Long only</td><td>Long/short</td><td>Long/short</td></tr>
      <tr><td class="l">Gross exposure</td><td>75%</td><td>Max 100%</td><td>Max 200%</td><td>Max 300%</td></tr>
      <tr><td class="l">Leverage</td><td>None</td><td>None</td><td>Futures, on margin</td><td>None net: stocks paid in cash, net exposure never above 100%</td></tr>
    </table></div>
  </section>
  <section class="lp-sec">
    <p class="kicker">Why three strategies</p>
    <h2 class="h2">Different edges for different markets</h2>
    <p class="lede ex-lede">Each strategy captures a separate, independent edge, so each makes its money at different times and in different ways. Combined, they allow the portfolio to earn strong risk-adjusted returns whether markets are rising or falling.</p>
    <div class="examples" id="examples"><p class="loading">Loading…</p></div>
  </section>
  <section class="lp-sec">
    <p class="kicker">Execution</p>
    <h2 class="h2">While the market is closed, the models go to work</h2>
    <p class="lede pm-lede">The portfolio follows the same routine every day. All decisions are made after the close, and the updated portfolio, with every trade for the next day, is published before the market opens.</p>
  <div class="three four">
    <div><p class="kicker">Step 1</p><h3>The close</h3><p>After the US market closes, the models run on the day's final data. Each strategy reviews its positions and looks for entry and exit signals.</p></div>
    <div><p class="kicker">Step 2</p><h3>The portfolio</h3><p>Each strategy's trades are combined into one portfolio, in the fixed order: Contrarian first, then Core, then Compass sets the net exposure with futures. Every position and exposure limit is checked before anything is final.</p></div>
    <div><p class="kicker">Step 3</p><h3>Before the open</h3><p>The portfolio for the next trading day, with every buy and sell to be made at the open, is published on this site and emailed to subscribers. Every day is kept in the <a href="archive.html">archive</a> and timestamped in a <a href="@REPO@">public Git repository</a>, an auditable record of every position that can never be quietly changed.</p></div>
    <div><p class="kicker">Step 4</p><h3>The open</h3><p>All trades are made at the next morning's open. Nothing is changed during the day, and there are no stop-losses. Risk is controlled through diversification and the position limits within each strategy.</p></div>
  </div>
  </section>
  <p class="more" style="margin-top:44px"><a href="performance.html">See the full track record →</a></p>
</main>
""" + CLOSER + FOOT + """<script>renderExamples(document.getElementById("examples")); renderHeroArt(document.getElementById("hero-art"));</script>
"""

page("index.html", "OPTEX — the all-weather stock portfolio",
     "Know what to buy, when to buy, and when to protect: a rules-based stock portfolio, published free every day before the open.", 4, LANDING)
page("portfolio.html", "OPTEX — today's portfolio",
     "What the OPTEX all-weather stock portfolio holds at the next open: Core, Contrarian and Compass.", 0, PORTFOLIO)
page("message-sent.html", "OPTEX — message sent", "Thanks for getting in touch.", -1, SENT)
page("thanks.html", "OPTEX — you're on the list", "Thanks for signing up to the OPTEX daily email.", -1, THANKS)
page("archive.html", "OPTEX — archive", "Every day of the OPTEX all-weather stock portfolio, exactly as published before the open.", 3, ARCHIVE)
page("performance.html", "OPTEX — performance", "The track record of the OPTEX all-weather stock portfolio against the S&amp;P 500 and Nasdaq-100.", 1, PERFORMANCE)
page("how-it-works.html", "OPTEX — how it works",
     "How the OPTEX all-weather stock portfolio works: Core, Contrarian and Compass.", 2, HOW)
print("pages written")
