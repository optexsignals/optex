# Pages under /pro/ for traders and investment professionals. Run through _build_pages.py (exec'd at the end), which
# provides HEAD, FOOT, SIGNUP, CONTACT, page(). Same layout and data as the main site; only the wording differs.

PRO_HEAD = (HEAD.replace('<html lang="en">', '<html lang="en" data-base="../" data-site="pro">')
            .replace('href="assets/', 'href="../assets/').replace('href="feed.xml"', 'href="../feed.xml"')
            .replace("<small>All-weather stock portfolio</small>", "<small>For professionals</small>")
            .replace('<a href="how-it-works.html"{a2}>How it works</a>', '<a href="how-it-works.html"{a2}>Methodology</a>'))

PRO_FOOT = """<footer><div class="wrap">
  <div><span class="mark">OPTEX</span><p>optexmodel.com/pro · <a href="archive.html">Every day, archived</a> · <a href="index.html#contact">Contact</a> · <a href="../">Main site</a> · <a href="../feed.xml">RSS</a></p></div>
  <p>For information only. Not investment advice, and not an offer to buy or sell any security or fund. Results before November 2026 are simulated by applying the current rules to historical data, and are not the results of actual trading. Past performance is not a guide to the future. Trading involves risk of loss, and futures leverage increases it.</p>
</div></footer>
<script src="../assets/app.js?v={v}"></script>
"""

PRO_CLOSER = """<div class="lp">
<section class="lp-end"><div class="wrap">
  <h2>The full book, every day, before the open.</h2>
  """ + SIGNUP + """
</div></section>
</div>
"""

PRO_PORTFOLIO = PORTFOLIO.replace(CLOSER + FOOT, PRO_CLOSER + PRO_FOOT)
PRO_ARCHIVE = ARCHIVE.replace(CLOSER + FOOT, PRO_CLOSER + PRO_FOOT)
PRO_SENT = SENT.replace(CLOSER + FOOT, PRO_CLOSER + PRO_FOOT)

PRO_LANDING = """<main class="lp">
<section class="lp-hero"><div class="wrap">
  <div class="lp-hero-text" id="signup">
    <h1><span class="c-core">Trend</span>, <span class="c-contra">reversal</span><br>and <span class="c-compass">timing</span>,<br>in one book.</h1>
    <div class="lp-hero-side">
      <p class="lede">A systematic US equity portfolio. Two long-only stock strategies in Nasdaq-100 members, and a Nasdaq-100 futures overlay that sets net exposure between −100% and +100%. Signals at the close, trades at the next open, every position published before the open.</p>
      """ + SIGNUP + """
      <p class="more"><a href="portfolio.html">See today's book →</a></p>
    </div>
  </div>
  <figure class="lp-hero-chart"><div class="chart-head"><span><i class="ln p"></i>OPTEX portfolio</span><span><i class="ln g"></i>S&amp;P 500</span></div><div class="chart" id="hero-chart"></div></figure>
</div></section>

<section class="wrap lp-stats lp-stats-4" id="stats"></section>

<section class="wrap lp-sec">
  <p class="kicker">The approach</p>
  <h2>Return that does not come<br>from market beta.</h2>
  <div class="lp-three">
    <div><h3>Low beta, by construction</h3><p>Compass hedges the stock books' market exposure on most days, so beta to the S&amp;P 500 has averaged about 0.3. The book was positive through five of the six major S&amp;P 500 sell-offs since 2008. The exception was the 2011 debt-ceiling sell-off.</p></div>
    <div><h3>Alpha after factor controls</h3><p id="alpha-txt">Weekly alpha against the Fama-French five factors, momentum, short-term reversal and betting-against-beta is shown on the performance page.</p></div>
    <div><h3>No discretion</h3><p>Signals are computed from end-of-day data after the close, and every trade executes at the next open. There are no overrides, no intraday decisions and no stop-losses.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <div class="sec-split">
  <div>
  <p class="kicker">Three strategies</p>
  <h2>Three return streams.<br>Low correlation.</h2>
  </div>
  <p class="lede" id="corr-txt">Each strategy earns a different premium and makes its money at different times.</p>
  </div>
  <div class="lp-books" id="books"></div>
  <p class="more"><a href="how-it-works.html">Methodology →</a></p>
</section>

<section class="wrap lp-sec" id="crash-test">
  <div class="sec-split">
  <div>
  <p class="kicker">Stress periods</p>
  <h2>Every major S&amp;P 500<br>sell-off since 2008</h2>
  </div>
  <p class="lede">Return over each S&amp;P 500 sell-off, measured from its peak to its trough, and the book's own largest drawdown inside that window. The book does not need a crash to make money, but these are the periods when an equity allocation most needs a diversifier.</p>
  </div>
  <div class="crash" id="crash"></div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Calendar years</p>
  <h2 id="yrs-h">No losing calendar year since 2000.</h2>
  <div class="yrs" id="years"></div>
  <p class="more"><a href="performance.html">Design vs later period, costs and factor exposure →</a></p>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Implementation</p>
  <h2>Straightforward to run.</h2>
  <div class="lp-three">
    <div><h3>Execution at the open</h3><p>All orders are market-on-open, from signals on the prior close, so there is no look-ahead and nothing to monitor during the session. Most days bring one or two trades, and about a third bring none.</p></div>
    <div><h3>Trading costs</h3><p>The simulation charges 5 bp per side on stocks, plus $0.005 a share on Contrarian trades, and 2 bp per side on futures. Quadrupling the stock cost to 20 bp per side takes about 1.2 points a year off the return.</p></div>
    <div><h3>Account size</h3><p>Positions are published as a percentage of capital. The futures leg needs about $250,000 to track the model closely with whole Micro Nasdaq-100 (MNQ) contracts. Below that, contract rounding becomes a material source of tracking error.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Verification</p>
  <h2>A record you can audit.</h2>
  <div class="lp-three">
    <div><h3>Published before the open</h3><p>Each day's book, with every position and every order for the open, is published before the US market opens. Nothing is published after the fact.</p></div>
    <div><h3>Timestamped</h3><p>Every day is kept in the <a href="archive.html">archive</a> and committed to a <a href="@REPO@">public Git repository</a>, so each file carries a timestamp that cannot be backdated without it showing.</p></div>
    <div><h3>One model, one book</h3><p>Everyone sees the same portfolio. The rules are fixed and applied the same way every day.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">FAQ</p>
  <h2>Common questions</h2>
  <div class="faq-grid">
  <div class="faq">
    <details><summary>How much of the record is out of sample?</summary><p>The rules were designed on 2000–2021, and 2022 onward was held back. The version frozen on 13 October 2026 was tested once on 2022 to October 2026: 25.9% a year, Sharpe ratio 1.57, max drawdown −11.7%. Three changes have been made since: hard exposure limits, full-size long futures positions, and a lower volatility threshold for Core. Those were checked against the later data as well, so the current version's post-2021 figures are not a clean hold-out. The live, published record starts in November 2026.</p></details>
    <details><summary>What drives the returns?</summary><p>Most of the alpha comes from Compass, a day-level market-timing signal: its returns are not explained by static factor loadings. Core behaves like a low-volatility trend book with market beta of about 0.4 to 0.5. Contrarian loads on short-term reversal. The <a href="performance.html">performance page</a> has the regressions for each strategy.</p></details>
    <details><summary>What costs and financing are assumed?</summary><p>5 bp per side on stocks plus $0.005 a share on Contrarian trades, and 2 bp per side on futures. Futures are financed at the 3-month T-bill rate. Idle cash earns nothing, which understates returns when rates are high. The performance page shows returns at up to 20 bp per side on stocks and 4 bp on futures.</p></details>
    <details><summary>What about capacity?</summary><p>All stock trades are in Nasdaq-100 members, no position is larger than 10% of capital, and the futures are among the most liquid contracts in the world. The simulation assumes fills at the official opening price. Market impact for large accounts has not been studied.</p></details>
    <details><summary>Is leverage used?</summary><p>Stocks are always paid for in cash, never bought on margin. Net exposure is held between −100% and +100%. Gross exposure can reach 300% when Compass takes the book fully short against a full stock book, so a large gap against the futures position can cost more than the stock positions alone.</p></details>
    <details><summary>Is this investment advice?</summary><p>No. It is the published output of a model, the same for everyone. It does not know your circumstances, and what you do with it is up to you.</p></details>
  </div>
  """ + CONTACT + """
  </div>
</section>

<section class="lp-end"><div class="wrap">
  <h2>The full book, every day, before the open.</h2>
  """ + SIGNUP + """
</div></section>
</main>
""" + PRO_FOOT + """<script>renderLanding();</script>
"""

PRO_PERFORMANCE = """<main class="wrap" id="app"><p class="loading">Loading the track record…</p></main>
<div class="wrap" id="pro-stats"></div>
""" + PRO_CLOSER + PRO_FOOT + """<script>renderPerformance(document.getElementById("app")); renderProStats(document.getElementById("pro-stats"));</script>
"""

PRO_EX = """{
  core: "Persistent, low-volatility advances are where Core earns most of its return. Through the first ten months of 2017 it held up to 80% of capital in Nasdaq-100 trend names and made most of the book's gain, while Compass kept net exposure low. The largest drawdown in the period was under 2%.",
  compass: "In a trending bear market the stock books shrink as volatility rises, and Compass carries the book. Through 2022 it moved between fully short, hedged and fully long dozens of times and contributed 66% while the S&P 500 fell 24%. Core was cut to under 10% of capital as volatility rose, which kept its losses small.",
  contrarian: "Forced selling is the condition Contrarian waits for. In late 2008 Core had already exited almost everything on rising volatility. Contrarian bought into the selling, at times with over 70% of capital, and exited within days on the rebounds, adding over 20% while the S&P 500 fell 22%."
}"""

PRO_HOW = """<main class="wrap">
  <div class="hero how-hero">
    <div><p class="kicker">Methodology</p><h1 class="h2" style="font-size:clamp(48px,8vw,104px)">Core.<br>Contrarian.<br>Compass.</h1>
    <p class="say">Two long-only stock strategies decide what the book owns. A futures overlay decides how much market risk it carries. This page describes how each part works and how they are combined. It does not publish the parameters.</p></div>
    <figure class="hero-art" id="hero-art"></figure>
  </div>
  <div class="three">
    <div><p class="kicker" style="color:var(--wave)"><i class="chip wave"></i> Volatility-managed trend</p><h3>Core</h3>
      <p>The universe is the current Nasdaq-100 membership, point in time, with dual-class duplicates removed. Each stock's short-term volatility is ranked against its own past year. Core buys when a high-volatility spell gives way to a quiet one, provided the stock is not lagging the rest of the index, and sells when volatility climbs back to the top of its range, which usually happens as the advance rolls over.</p>
      <p>Positions are equal-weighted at 1.5% of capital, up to 50 names, with no rebalancing while held. There is no sector model; diversification comes from the number of names.</p>
      <p>Its returns are mostly market beta, about 0.4, with negative loadings on value and profitability. Over 2000–2021 its contribution carried a weekly alpha of about 7% a year (t 4.4). Since 2022 that alpha has been close to zero.</p></div>
    <div><p class="kicker" style="color:var(--opp)"><i class="chip opp"></i> Short-term reversal</p><h3>Contrarian</h3>
      <p>Contrarian looks for capitulation in Nasdaq-100 members: a run of heavy selling that leaves a stock deeply oversold at a time when its volatility is already elevated. These are the conditions in which forced and emotional sellers pay for liquidity.</p>
      <p>It enters in tranches of 3.3% of capital, adding up to three times (10%) if the selling continues, and exits on the rebound, usually within days. It is in cash most of the time and busiest in market-wide panics, when Core is cutting back.</p>
      <p>Its returns load on the short-term reversal factor, with little market beta.</p></div>
    <div><p class="kicker" style="color:var(--kairos)"><i class="chip fut"></i> Market timing</p><h3>Compass</h3>
      <p>Compass is a daily market-state model built on breadth, volatility, sentiment and trend inputs. It produces a directional reading for the Nasdaq-100 each day.</p>
      <p>Most days the reading is not decisive, and Compass simply sizes a short Nasdaq-100 futures position to offset the stock books' exposure, leaving the book close to market-neutral. When the reading is decisive, Compass takes the whole book net long or net short, up to 100% either way. Position size is scaled down when realized volatility is high.</p>
      <p>Most of the book's alpha comes from Compass. Its edge is at the daily horizon, and static factor loadings explain only about a quarter of its weekly return variance.</p></div>
  </div>

  <section class="lp-sec pm">
    <p class="kicker">Portfolio construction</p>
    <h2 class="h2">How the three are combined</h2>
    <p class="lede pm-lede">Capital goes to the stock strategies in a fixed order, Compass sets net exposure on top, and every limit is checked before the book is published.</p>
    <div class="three pm-flow">
      <div><p class="kicker">First call on capital</p><h3>Contrarian</h3>
        <p>Contrarian has priority. If its entries need more cash than is free, Core sells its oldest positions to make room, and buys them back later if they still qualify.</p></div>
      <div><p class="kicker">Remaining capital</p><h3>Core</h3>
        <p>Core invests what is left, 1.5% per name. Together the two stock books never exceed 100% of capital, so stocks are never held on margin.</p></div>
      <div><p class="kicker">Net exposure</p><h3>Compass</h3>
        <p>Compass measures the stock books' exposure and trades Nasdaq-100 futures to the target net position. It only trades when the position has drifted meaningfully from target, which cuts turnover with little effect on returns.</p></div>
    </div>
    <h3 class="sub-h">Strategy and portfolio limits</h3>
    <div class="scroll"><table class="quant risk-t">
      <tr><th class="l"></th><th>Core</th><th>Contrarian</th><th>Compass</th><th>Portfolio</th></tr>
      <tr><td class="l">Position size</td><td>1.5% of capital</td><td>3.3% per tranche, up to three (10%)</td><td>−200% to +100%</td><td>–</td></tr>
      <tr><td class="l">Max positions</td><td>50</td><td>20</td><td>1</td><td>71</td></tr>
      <tr><td class="l">Max allocation</td><td>75%</td><td>100%</td><td>−200% to +100%</td><td>±100% net</td></tr>
      <tr><td class="l">Direction</td><td>Long only</td><td>Long only</td><td>Long/short</td><td>Long/short</td></tr>
      <tr><td class="l">Gross exposure</td><td>Max 75%</td><td>Max 100%</td><td>Max 200%</td><td>Max 300%</td></tr>
      <tr><td class="l">Leverage</td><td>None</td><td>None</td><td>Futures margin</td><td>Stocks paid in cash; net exposure within ±100%</td></tr>
    </table></div>
  </section>
  <section class="lp-sec">
    <p class="kicker">Attribution</p>
    <h2 class="h2">Who makes the money, and when</h2>
    <p class="lede ex-lede">Three periods where a different strategy carried the book. Each strategy's line is its contribution to the whole account, so the three add up to the portfolio's return.</p>
    <div class="examples" id="examples"><p class="loading">Loading…</p></div>
  </section>
  <section class="lp-sec">
    <p class="kicker">Limitations</p>
    <h2 class="h2">Where it can go wrong</h2>
    <div class="lp-three">
      <div><h3>Persistent melt-ups</h3><p>Compass treats extreme readings as risk. In a long, euphoric rally it can sit hedged or short for months while the index keeps rising. Tests on the late-1990s bubble, before the published record starts, show this costing the book for several years.</p></div>
      <div><h3>A short later period</h3><p>The post-2021 data covers under five years, and some design choices were made after it was first seen. The live record only starts in November 2026.</p></div>
      <div><h3>Daily-horizon edge</h3><p>Compass's edge is at the one-day horizon and assumes fills at the official open. Late execution, missed opens or wider spreads at the open erode it faster than they erode the stock strategies.</p></div>
      <div><h3>One index, one sector tilt</h3><p>All stock positions are Nasdaq-100 members and the hedge is Nasdaq-100 futures, so the book carries the index's technology concentration whenever it is net long.</p></div>
      <div><h3>Futures sizing</h3><p>Below about $250,000, whole MNQ contracts cannot match the target futures position closely, and tracking error against the published book rises.</p></div>
      <div><h3>Gap risk</h3><p>Gross exposure can reach 300%. With the book fully short and a full stock book, a large overnight rally loses on the futures while the stocks only partly offset it.</p></div>
    </div>
  </section>
  <section class="lp-sec">
    <p class="kicker">Daily process</p>
    <h2 class="h2">From the close to the open</h2>
    <div class="three four">
      <div><p class="kicker">Step 1</p><h3>The close</h3><p>After the US close the models run on final end-of-day data: Nasdaq-100 membership, prices, breadth and sentiment. Each strategy updates its entry and exit signals.</p></div>
      <div><p class="kicker">Step 2</p><h3>The book</h3><p>Trades are combined in the fixed order, Contrarian, then Core, then the Compass futures target, and every position and exposure limit is checked.</p></div>
      <div><p class="kicker">Step 3</p><h3>Publication</h3><p>The book for the next session, with every order for the open, is published on this site, emailed to subscribers and committed to the <a href="@REPO@">public Git repository</a>.</p></div>
      <div><p class="kicker">Step 4</p><h3>The open</h3><p>Every order executes at the next open. Nothing changes during the session.</p></div>
    </div>
  </section>
  <p class="more" style="margin-top:44px"><a href="performance.html">Performance, costs and factor exposure →</a></p>
</main>
""" + PRO_CLOSER + PRO_FOOT + """<script>renderExamples(document.getElementById("examples"), """ + PRO_EX + """); renderHeroArt(document.getElementById("hero-art"));</script>
"""

page("index.html", "OPTEX for Professionals | Systematic US Equity Long/Short",
     "A systematic US equity portfolio: low-volatility trend, short-term reversal and Nasdaq-100 futures timing, published daily before the open.", 4, PRO_LANDING, pro=True)
page("portfolio.html", "Today's Book | OPTEX for Professionals", "The OPTEX book at the next open: every position and every order.", 0, PRO_PORTFOLIO, pro=True)
page("performance.html", "Performance | OPTEX for Professionals",
     "OPTEX track record: design vs later period, cost sensitivity, factor exposure and full risk statistics.", 1, PRO_PERFORMANCE, pro=True)
page("how-it-works.html", "Methodology | OPTEX for Professionals",
     "How the OPTEX book works: Core, Contrarian and Compass, portfolio construction, limits and limitations.", 2, PRO_HOW, pro=True)
page("archive.html", "Archive | OPTEX for Professionals", "Every day of the OPTEX book, exactly as published before the open.", 3, PRO_ARCHIVE, pro=True)
page("message-sent.html", "Message Sent | OPTEX", "Thanks for getting in touch.", -1, PRO_SENT, pro=True)
