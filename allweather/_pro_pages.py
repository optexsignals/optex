# Pages at optexmodel.com/allweather (the pro version) for traders and investment professionals. Run through _build_pages.py (exec'd at the end), which
# provides HEAD, FOOT, SIGNUP, CONTACT, page(). Same layout and data as the main site; only the wording differs.

PRO_HEAD = (HEAD.replace('<html lang="en" data-base="../">', '<html lang="en" data-site="pro">')
            .replace('href="../assets/', 'href="assets/').replace('href="../feed.xml"', 'href="feed.xml"')
            .replace('<a href="how-it-works.html"{a2}>How it works</a>', '<a href="how-it-works.html"{a2}>Investment process</a>'))

PRO_FOOT = """<footer><div class="wrap">
  <div><span class="mark">OPTEX</span><p>optexmodel.com/allweather · <a href="archive.html">Every day, archived</a> · <a href="index.html#contact">Contact</a> · <a href="feed.xml">RSS</a></p></div>
  <p>For information only. Not investment advice, and not an offer to buy or sell any security or fund. Results before November 2026 are simulated by applying the current rules to historical data, and are not the results of actual trading. Past performance is not a guide to the future. Trading involves risk of loss, and futures leverage increases it.</p>
</div></footer>
<script src="assets/app.js?v={v}"></script>
"""

PRO_CLOSER = """<div class="lp">
<section class="lp-end"><div class="wrap">
  <h2>The full portfolio, every day, before the open.</h2>
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
    <h1>Three <span class="c-core">strategies</span>.<br>One <span class="c-contra">portfolio</span>.<br>Diversified <span class="c-compass">returns</span>.</h1>
    <div class="lp-hero-side">
      <p class="lede">An equity portfolio with two stock-selection models: volatility-managed trend and short-term mean reversion. Complemented by a daily market-timing model that adds index futures to set overall exposure. Traded daily, at the open.</p>
      """ + SIGNUP + """
      <p class="more"><a href="portfolio.html">See today's portfolio →</a></p>
    </div>
  </div>
  <figure class="lp-hero-chart"><div class="chart-head"><span><i class="ln p"></i>OPTEX portfolio</span><span><i class="ln g"></i>S&amp;P 500</span></div><div class="chart" id="hero-chart"></div></figure>
</div></section>

<section class="wrap lp-stats lp-stats-4" id="stats"></section>

<section class="wrap lp-sec" id="delivers">
  <div class="delivers">
  <div>
  <p class="kicker">What it delivers</p>
  <h2>Market-beating returns,<br>without the drawdowns.</h2>
  <p class="lede">The portfolio profits across bull and bear regimes, hedged to market-neutral almost half the time, opportunistically going long or short only when conviction is high.</p>
  </div>
  <div class="scroll edge" id="edge"></div>
  </div>
</section>

<section class="wrap lp-sec" id="strategies">
  <div class="sec-split">
  <div>
  <p class="kicker">Diversified approach</p>
  <h2 class="one-line">Three distinct strategies, each with its own edge.</h2>
  </div>
  </div>
  <div class="lp-books" id="books"></div>
  <p class="more"><a href="how-it-works.html">Investment process →</a></p>
</section>

<section class="wrap lp-sec" id="crash-test">
  <div class="sec-split">
  <div>
  <p class="kicker">Stress tested</p>
  <h2>Beta when you want it,<br>alpha when you need it.</h2>
  </div>
  <p class="lede">Volatile periods are where the Contrarian and Compass strategies perform best, just when they are needed most. The Core strategy moves to cash and the average holding period shortens, allowing the portfolio to capture moves in both directions.</p>
  </div>
  <div class="crash" id="crash"></div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Consistent performance</p>
  <h2 id="yrs-h">Not one losing year.</h2>
  <div class="yrs" id="years"></div>
  <p class="more"><a href="performance.html">Performance statistics, cost analysis and factor exposures →</a></p>
</section>

<section class="wrap lp-sec">
  <div class="sec-split">
  <div>
  <p class="kicker">Factor exposure</p>
  <h2>Alpha beyond factors.</h2>
  </div>
  <p class="lede">80% of the portfolio's return is alpha. The rest comes from factor exposures that balance one another across the three strategies.</p>
  </div>
  <div class="lp-three">
    <div><h3>Core</h3><p>Behaves like a low-volatility trend portfolio, with a market beta of 0.4. On top of its factor exposures it adds 6% a year of alpha.</p></div>
    <div><h3>Contrarian</h3><p>Its main factor exposure is short-term reversal, as expected of a strategy paid to provide liquidity. Beyond that it adds 3% a year of alpha.</p></div>
    <div><h3>Compass</h3><p>The largest source of alpha, at 15% a year. Its returns come from timing the market each day, not from holding factor exposures.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">Verification</p>
  <h2>A record you can audit.</h2>
  <div class="lp-three cols-2">
    <div><h3>Published before the open</h3><p>Each day's portfolio, with every position and every order for the open, is published before the US market opens. Nothing is published after the fact.</p></div>
    <div><h3>Timestamped</h3><p>Every day is kept in the <a href="archive.html">archive</a> and committed to a <a href="@REPO@">public Git repository</a>, so each file carries a timestamp that cannot be backdated without it showing.</p></div>
  </div>
</section>

<section class="wrap lp-sec">
  <p class="kicker">FAQ</p>
  <h2>Common questions</h2>
  <div class="faq-grid">
  <div class="faq">
    <details><summary>Is leverage used?</summary><p>Stock positions are fully funded, with no margin borrowing. Net exposure stays between −100% and +100%. Gross exposure reaches 300% only when Compass takes the portfolio fully net short while the stock strategies are fully invested.</p></details>
    <details><summary>Does it scale?</summary><p>The strategy is built to scale. Every stock position is a large-cap US name with deep daily liquidity, no position exceeds 10% of capital, and the index futures are among the most liquid contracts in the world.</p></details>
    <details><summary>Is this investment advice?</summary><p>No. It is the published output of a model, the same for everyone. It does not know your circumstances, and what you do with it is up to you.</p></details>
  </div>
  """ + CONTACT + """
  </div>
</section>

<section class="lp-end"><div class="wrap">
  <h2>The full portfolio, every day, before the open.</h2>
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
  core: "Persistent, low-volatility advances are where Core earns most of its return. Through the first ten months of 2017 it held up to 80% of capital in Nasdaq-100 trend names and made most of the portfolio's gain, while Compass kept net exposure low. The largest drawdown in the period was under 2%.",
  compass: "In a trending bear market the stock strategies shrink as volatility rises, and Compass carries the portfolio. Through 2022 it moved between fully short, hedged and fully long dozens of times and contributed 63% while the S&P 500 fell 24%. Core lost about 15% before volatility cut it to under 10% of capital.",
  contrarian: "Forced selling is the condition Contrarian waits for. In late 2008 Core had already exited almost everything on rising volatility. Contrarian bought into the selling, at times with over 70% of capital, and exited within days on the rebounds, adding over 20% while the S&P 500 fell 22%."
}"""

PRO_HOW = """<main class="wrap">
  <div class="hero how-hero">
    <div><p class="kicker">Investment process</p><h1 class="h2" style="font-size:clamp(40px,5.6vw,74px);line-height:1.04">Core.<br>Contrarian.<br>Compass.</h1>
    <p class="say">Two long-only stock strategies decide what the portfolio owns. A futures overlay decides how much market risk it carries.</p></div>
    <figure class="hero-art" id="hero-art"></figure>
  </div>
  <div class="three">
    <div><p class="kicker" style="color:var(--wave)"><i class="chip wave"></i> Volatility-managed trend</p><h3>Core</h3>
      <p>Core trades large-cap US stocks. Each stock's short-term volatility is ranked against its own past year. Core buys strong performers when a high-volatility spell gives way to a quiet one, and sells when volatility returns to the stock, which usually happens as the advance rolls over.</p>
      <p>Positions are equal-weighted at 1.5% of capital, up to 50 names, with no rebalancing while held. There is no sector model; diversification comes from the number of names.</p>
      <p>Its market beta is about 0.4, with negative loadings on value and profitability. On top of its factor exposures it adds about 6% a year of alpha.</p></div>
    <div><p class="kicker" style="color:var(--opp)"><i class="chip opp"></i> Short-term mean reversion</p><h3>Contrarian</h3>
      <p>Contrarian looks for capitulation in Nasdaq-100 members: a run of heavy selling that leaves a stock deeply oversold at a time when its volatility is already elevated. These are the conditions in which forced and emotional sellers pay for liquidity.</p>
      <p>It enters in tranches of 3.3% of capital, adding up to three times (10%) if the selling continues, and exits on the rebound, usually within days. It is in cash most of the time and busiest in market-wide panics, when Core is cutting back.</p>
      <p>Its returns load on the short-term reversal factor, with little market beta.</p></div>
    <div><p class="kicker" style="color:var(--kairos)"><i class="chip fut"></i> Market timing</p><h3>Compass</h3>
      <p>Compass is a daily market-state model built on breadth, volatility, sentiment and trend inputs. It produces a directional reading for the Nasdaq-100 each day.</p>
      <p>When the reading is not decisive, which over 2000–2026 was a little under half of all days, Compass sizes a short Nasdaq-100 futures position to offset the stock strategies' exposure, leaving the portfolio close to market-neutral. When the reading is decisive, Compass takes the whole portfolio net long or net short, up to 100% either way. Position size is scaled down when realized volatility is high.</p>
      <p>Most of the portfolio's alpha comes from Compass. Its edge is at the daily horizon, and static factor loadings explain only about a quarter of its weekly return variance.</p></div>
  </div>

  <section class="lp-sec pm">
    <p class="kicker">Portfolio construction</p>
    <h2 class="h2">How the three are combined</h2>
    <p class="lede pm-lede">Capital goes to the stock strategies in a fixed order, Compass sets net exposure on top, and every limit is checked before the portfolio is published.</p>
    <div class="three pm-flow">
      <div><p class="kicker">First call on capital</p><h3>Contrarian</h3>
        <p>Contrarian has priority. If its entries need more cash than is free, Core sells its oldest positions to make room, and buys them back later if they still qualify.</p></div>
      <div><p class="kicker">Remaining capital</p><h3>Core</h3>
        <p>Core invests what is left, 1.5% per name. Together the two stock strategies never exceed 100% of capital, so stocks are never held on margin.</p></div>
      <div><p class="kicker">Net exposure</p><h3>Compass</h3>
        <p>Compass measures the stock strategies' exposure and trades Nasdaq-100 futures to the target net position. It only trades when the position has drifted meaningfully from target, which cuts turnover with little effect on returns.</p></div>
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
    <p class="lede ex-lede">Three periods where a different strategy carried the portfolio. Each strategy's line is its contribution to the whole account, so the three add up to the portfolio's return.</p>
    <div class="examples" id="examples"><p class="loading">Loading…</p></div>
  </section>
  <section class="lp-sec">
    <p class="kicker">Limitations</p>
    <h2 class="h2">Where it can go wrong</h2>
    <div class="lp-three">
      <div><h3>Persistent melt-ups</h3><p>Compass treats extreme readings as risk. In a long, euphoric rally it can sit hedged or short for months while the index keeps rising. Tests on the late-1990s bubble, before the published record starts, show this costing the portfolio for several years.</p></div>
      <div><h3>A short later period</h3><p>The post-2021 data covers under five years, and some design choices were made after it was first seen. The live record only starts in November 2026.</p></div>
      <div><h3>Daily-horizon edge</h3><p>Compass's edge is at the one-day horizon and assumes fills at the official open. Late execution, missed opens or wider spreads at the open erode it faster than they erode the stock strategies.</p></div>
      <div><h3>One index, one sector tilt</h3><p>All stock positions are Nasdaq-100 members and the hedge is Nasdaq-100 futures, so the portfolio carries the index's technology concentration whenever it is net long.</p></div>
      <div><h3>Futures sizing</h3><p>Below about $250,000, whole MNQ contracts cannot match the target futures position closely, and tracking error against the published portfolio rises.</p></div>
      <div><h3>One model carries the alpha</h3><p>Compass supplies about half of the factor-adjusted alpha over 2000–2021 and almost all of it since 2022. If its signal stopped working, most of the edge would go with it, and the stock strategies alone would deliver little more than their market exposure.</p></div>
      <div><h3>Gap risk</h3><p>Gross exposure can reach 300%. With the futures fully short and the stock strategies fully invested, a large overnight rally loses on the futures while the stocks only partly offset it.</p></div>
    </div>
  </section>
  <section class="lp-sec">
    <p class="kicker">Daily process</p>
    <h2 class="h2">From the close to the open</h2>
    <div class="three four">
      <div><p class="kicker">Step 1</p><h3>The close</h3><p>After the US close the models run on final end-of-day data: Nasdaq-100 membership, prices, breadth and sentiment. Each strategy updates its entry and exit signals.</p></div>
      <div><p class="kicker">Step 2</p><h3>The portfolio</h3><p>Trades are combined in the fixed order, Contrarian, then Core, then the Compass futures target, and every position and exposure limit is checked.</p></div>
      <div><p class="kicker">Step 3</p><h3>Publication</h3><p>The portfolio for the next session, with every order for the open, is published on this site, emailed to subscribers and committed to the <a href="@REPO@">public Git repository</a>.</p></div>
      <div><p class="kicker">Step 4</p><h3>The open</h3><p>Every order executes at the next open. Nothing changes during the session.</p></div>
    </div>
  </section>
  <p class="more" style="margin-top:44px"><a href="performance.html">Performance, costs and factor exposure →</a></p>
</main>
""" + PRO_CLOSER + PRO_FOOT + """<script>renderExamples(document.getElementById("examples"), """ + PRO_EX + """); renderHeroArt(document.getElementById("hero-art"));</script>
"""

page("index.html", "OPTEX | All-Weather Stock Portfolio",
     "A systematic US equity portfolio: low-volatility trend, short-term reversal and Nasdaq-100 futures timing, published daily before the open.", 4, PRO_LANDING, pro=True)
page("portfolio.html", "Today's Portfolio | OPTEX", "The OPTEX portfolio at the next open: every position and every order.", 0, PRO_PORTFOLIO, pro=True)
page("performance.html", "Performance | OPTEX",
     "OPTEX track record: design vs later period, cost sensitivity, factor exposure and full risk statistics.", 1, PRO_PERFORMANCE, pro=True)
page("how-it-works.html", "Investment Process | OPTEX",
     "How the OPTEX portfolio works: Core, Contrarian and Compass, portfolio construction, limits and limitations.", 2, PRO_HOW, pro=True)
page("archive.html", "Archive | OPTEX", "Every day of the OPTEX portfolio, exactly as published before the open.", 3, PRO_ARCHIVE, pro=True)
page("message-sent.html", "Message Sent | OPTEX", "Thanks for getting in touch.", -1, PRO_SENT, pro=True)
# the one shared email list: Buttondown redirects sign-ups to optexmodel.com/allweather/thanks.html and the email links welcome.html
page("welcome.html", "Welcome | OPTEX", "Welcome to the OPTEX daily email: what you will receive, when it arrives and how the portfolio works.", -1, WELCOME.replace(FOOT, PRO_FOOT), pro=True)
page("thanks.html", "You're on the List | OPTEX", "Thanks for signing up to the OPTEX daily email.", -1, THANKS.replace(FOOT, PRO_FOOT), pro=True)
