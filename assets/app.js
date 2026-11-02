/* OPTEX site. Reads data/latest.json (or an archived day). Everything is % of the account. */
const NS = "http://www.w3.org/2000/svg";
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const pct = (x, dp = 0, sign = true) => {
  if (x == null) return "–";
  const t = x.toFixed(dp);
  if (+t === 0) return (0).toFixed(dp) + "%";              // no "−0%"
  return (sign && x > 0 ? "+" : "") + t.replace("-", "−") + "%";
};
const tone = (x) => x == null ? "" : x > 0 ? "up" : x < 0 ? "down" : "";
const svg = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
const day = (d, o = { weekday: "long", day: "numeric", month: "long" }) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
async function loadJSON(u) { const r = await fetch(u, { cache: "no-cache" }); if (!r.ok) throw new Error(u + " " + r.status); return r.json(); }

/* ---------- home: the portfolio after the next open ---------- */
function renderPortfolio(s, root, { archived = false } = {}) {
  const n = s.next;
  const wave = n.holdings.filter((h) => h.book === "LV"), opp = n.holdings.filter((h) => h.book === "HAR");
  const p = s.perf;
  root.innerHTML = `
  <div class="dateline">
    <p class="kicker">${archived ? "Archived · " : ""}Portfolio at the open</p>
    <h1 class="when">${day(n.date)}</h1>
    <p class="kicker pub">${s.reconstructed ? "Rebuilt after the fact with the same rules · not published at the time" : `Published ${new Date(s.published_utc).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ET`}</p>
    ${archived ? `<a class="banner" href="portfolio.html">This is an archived day. See today's portfolio →</a>` : ""}
  </div>

  <p class="alloc-cap">Allocation at the open, as a percentage of the account</p>
  <div class="eq" style="--len:${Math.max(...[pct(n.lv, 0, false), pct(n.har, 0, false), pct(Math.abs(n.nq), 0, false), pct(n.net)].map((t) => t.length))}">
    <div class="term"><div class="l"><i class="chip wave"></i>Core</div><div class="n">${pct(n.lv, 0, false)}</div><div class="s">${wave.length} stocks, long</div></div>
    <div class="op">+</div>
    <div class="term"><div class="l"><i class="chip opp"></i>Contrarian</div><div class="n">${pct(n.har, 0, false)}</div><div class="s">${opp.length ? opp.length + " stock" + (opp.length > 1 ? "s" : "") + ", long" : "waiting in cash"}</div></div>
    <div class="op">${n.nq < 0 ? "−" : "+"}</div>
    <div class="term"><div class="l"><i class="chip fut"></i>Compass</div><div class="n">${n.nq <= -0.5 ? '<span class="sg">−</span>' : ""}${pct(Math.abs(n.nq), 0, false)}</div><div class="s">${Math.abs(n.nq) < 0.5 ? "none" : n.nq < 0 ? "Nasdaq-100 futures, short" : "Nasdaq-100 futures, long"}</div></div>
    <div class="op">=</div>
    <div class="term net"><div class="l">Net exposure</div><div class="n">${pct(n.net)}</div><div class="s">${pct(n.cash, 0, false)} of the account in cash</div></div>
  </div>

  <div class="books">
    <div class="book wave">
      <div class="top"><h2 class="h2">Core</h2><span class="pct">${pct(n.lv, 0, false)}</span></div>
      <p class="alloc-cap">Position size in each stock, as a % of the account</p>
      ${sectors(wave)}
      ${changes(n, "LV")}
    </div>
    <div class="book opp">
      <div class="top"><h2 class="h2">Contrarian</h2><span class="pct">${pct(n.har, 0, false)}</span></div>
      ${opp.length ? `<div class="tiles">${opp.map(tile).join("")}</div>` : `<div class="empty"><b>Waiting</b>Holding cash until opportunity presents.</div>`}
      ${changes(n, "HAR")}
    </div>
    <div class="book kai">
      <div class="top"><h2 class="h2">Compass</h2><span class="pct">${pct(n.nq)}</span></div>
      <div class="kai-pos"><b>${Math.abs(n.nq) < 0.5 ? "Flat" : n.nq < 0 ? "Short" : "Long"}</b>${Math.abs(n.nq) < 0.5 ? "No futures position" : `Nasdaq-100 index futures, ${pct(Math.abs(n.nq), 0, false)} of the account`}</div>
      ${kairosChange(s.exposure.nq, n.nq)}
    </div>
  </div>

  <p class="more" style="margin-top:44px"><a href="archive.html">Historical portfolio allocations →</a></p>`;
}

const BENCH = { spx: ["S&P 500", "--ink-3"], qqq: ["Nasdaq-100", "--ink-2"] };
const benchOn = (sel = "#seg") => [...document.querySelectorAll(sel + " button")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.b);
function windowStart(dates, r) {
  const last = dates[dates.length - 1], end = new Date(last + "T12:00:00Z");
  if (r === "YTD") return Math.max(0, dates.findIndex((d) => d >= last.slice(0, 4) + "-01-01") - 1);
  const from = new Date(end - RANGES.find(([k]) => k === r)[1] * 864e5).toISOString().slice(0, 10);
  return Math.max(0, dates.findIndex((d) => d >= from) - 1);
}
const RANGE_NAME = { "1W": "Last week", "1M": "Last month", "3M": "Last 3 months", "6M": "Last 6 months", YTD: "Year to date", "12M": "Last 12 months", "3Y": "Last 3 years", "5Y": "Last 5 years", "10Y": "Last 10 years" };
const RANGES = [["1W", 7], ["1M", 31], ["3M", 92], ["6M", 183], ["YTD", 0], ["12M", 366], ["3Y", 1096], ["5Y", 1827], ["10Y", 3653], ["ALL", 1e6]];
async function record(s, archived) {
  let D;
  if (archived) {               // the archived day's own 12-month window, as published
    const se = s.series, toR = (g) => g.map((v, i) => i ? (v / g[i - 1] - 1) * 100 : 0);
    D = { dates: se.dates, model: toR(se.model), spx: toR(se.spx), qqq: toR(se.qqq), net: se.net, lv: se.lv || se.stocks, har: se.har || se.dates.map(() => 0), nq: se.nq };
  } else D = await fullDaily(["lv", "har", "nq"]);
  const st = { bs: ["spx"], r: archived ? "ALL" : "5Y", zoom: null };
  const zr = document.getElementById("zoom-reset");
  const draw = () => {
    const last = D.dates[D.dates.length - 1], end = new Date(last + "T12:00:00Z");
    let i0 = 0, i1 = D.dates.length;
    if (st.zoom) { i0 = Math.max(0, D.dates.indexOf(st.zoom[0]) - 1); i1 = D.dates.indexOf(st.zoom[1]) + 1; }
    else if (st.r === "YTD") { const y = last.slice(0, 4); i0 = Math.max(0, D.dates.findIndex((d) => d >= y + "-01-01") - 1); }
    else { const days = RANGES.find(([k]) => k === st.r)[1], from = new Date(end - days * 864e5).toISOString().slice(0, 10); i0 = Math.max(0, D.dates.findIndex((d) => d >= from) - 1); }
    const sl = (f) => D[f].slice(i0, i1), dates = sl("dates");
    if (zr) zr.hidden = !st.zoom;
    const grow = (rets) => { let g = 100; return rets.map((r, i) => (i ? (g *= 1 + r / 100) : g)); };
    const ddOf = (g) => { let pk = -Infinity; return g.map((v) => { pk = Math.max(pk, v); return (v / pk - 1) * 100; }); };
    const m = grow(sl("model")), bms = st.bs.map((b) => ({ key: b, name: BENCH[b][0], color: css(BENCH[b][1]), g: grow(sl(b)) }));
    const ret = (g) => (g[g.length - 1] / g[0] - 1) * 100;
    const ann = (g) => dates.length > 378 ? ((g[g.length - 1] / g[0]) ** (252 / (dates.length - 1)) - 1) * 100 : null;
    const cell = (l, a, f) => `<div><p class="kicker">${l}</p><div class="m ${tone(a)}">${a == null ? "–" : pct(a, 1)}</div>${bms.map((x) => `<div class="b">${x.name} ${f(x.g) == null ? "–" : pct(f(x.g), 1)}</div>`).join("")}</div>`;
    const span = st.zoom ? `${day(dates[0], { day: "numeric", month: "short", year: "numeric" })} – ${day(dates[dates.length - 1], { day: "numeric", month: "short", year: "numeric" })}`
      : st.r === "ALL" ? "since " + dates[0].slice(0, 4) : st.r;
    document.getElementById("row").innerHTML = cell(`Return, ${span}`, ret(m), ret) + (ann(m) != null ? cell("Per year", ann(m), ann) : "");
    const yrs = dates.length / 252, log = yrs > 4, lw = yrs > 4 ? 0.5 : 1.4, pf = (v) => pct(v, 1);
    timeChart(document.getElementById("chart"), dates, [
      { h: 340, log, title: "Growth of 100", fmt: log ? (v) => Math.round(10 ** v).toLocaleString() : (v) => v.toFixed(0), series: bms.map((x) => ({ name: x.name, v: x.g, color: x.color, w: 1.5, tipFmt: (v) => pct(v - 100, 1) })).concat([
        { name: "Portfolio", v: m, color: css("--wave"), w: 2.4, tipFmt: (v) => pct(v - 100, 1) }]) },
      { h: 130, title: "Drawdown", fmt: (v) => v.toFixed(0).replace("-", "−") + "%", zero: true, max: 0, series: bms.map((x) => ({ name: x.name + " drawdown", v: ddOf(x.g), color: x.color, w: 1.2, tipFmt: pf })).concat([
        { name: "Portfolio drawdown", v: ddOf(m), color: css("--wave"), w: 1.6, area: true, tipFmt: pf }]) },
      { h: 190, title: "Exposure", fmt: (v) => v.toFixed(0).replace("-", "−") + "%", zero: true, min: -100, max: 100, clamp: true, tickStep: 100, series: [
        { name: "Core exposure", v: sl("lv"), color: css("--wave"), w: lw, step: true, tipFmt: (v) => pct(v) },
        { name: "Contrarian exposure", v: sl("har"), color: css("--opp"), w: lw, step: true, tipFmt: (v) => pct(v) },
        { name: "Compass exposure", v: sl("nq"), color: css("--kairos"), w: lw, step: true, tipFmt: (v) => pct(v) },
        { name: "Net exposure", v: sl("net"), color: css("--ink"), w: lw * 1.6, step: true, tipFmt: (v) => pct(v) }] },
    ], { yearTicks: yrs > 2.5, yearEvery: yrs > 14 ? 4 : yrs > 7 ? 2 : 1, dayTicks: dates.length <= 30, axisAfter: 1, label: ["Portfolio"].concat(bms.map((x) => x.name)).join(" vs "),
      onBrush: (a, b) => { st.zoom = [dates[a], dates[b]]; draw(); } });
  };
  draw();
  if (zr) zr.addEventListener("click", () => { st.zoom = null; draw(); });
  document.querySelectorAll("#seg button").forEach((bt) => bt.addEventListener("click", () => {
    bt.setAttribute("aria-pressed", bt.getAttribute("aria-pressed") !== "true"); st.bs = benchOn("#seg"); draw();
  }));
  document.querySelectorAll("#ranges button").forEach((bt) => bt.addEventListener("click", () => {
    document.querySelectorAll("#ranges button").forEach((o) => o.setAttribute("aria-pressed", o === bt)); st.r = bt.dataset.r; st.zoom = null; draw();
  }));
}

/* ---------- quant statistics (QuantStats-style), all from daily returns in % ---------- */
function perfStats(d, pr) {
  const r = pr.map((x) => x / 100), n = r.length, mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const m = mean(r), sd = Math.sqrt(r.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1));
  const ddn = Math.sqrt(mean(r.map((x) => Math.min(0, x) ** 2)));
  const skew = mean(r.map((x) => (x - m) ** 3)) / sd ** 3, kurt = mean(r.map((x) => (x - m) ** 4)) / sd ** 4 - 3;
  // equity, drawdowns and drawdown episodes
  let g = 1, pk = 1, pkI = -1; const dd = [], eps = []; let ep = null;
  r.forEach((x, i) => {
    g *= 1 + x;
    if (g >= pk) { if (ep) { ep.end = i; eps.push(ep); ep = null; } pk = g; pkI = i; }
    else { if (!ep) ep = { start: pkI, depth: 0, trough: i }; const v = g / pk - 1; if (v < ep.depth) { ep.depth = v; ep.trough = i; } }
    dd.push(g / pk - 1);
  });
  if (ep) { ep.end = null; eps.push(ep); }
  const cal = (i) => (i < 0 ? d[0] : d[i]), days = (a, b) => (new Date(b) - new Date(a)) / 864e5;
  const worst = eps.reduce((w, e) => (!w || e.depth < w.depth ? e : w), null);
  const longest = eps.reduce((w, e) => Math.max(w, days(cal(e.start), e.end == null ? d[n - 1] : d[e.end])), 0);
  const cagr = n > 250 ? (g ** (252 / n) - 1) : null, mdd = Math.min(0, ...dd);
  const per = (key) => { const o = {}; r.forEach((x, i) => { const k = d[i].slice(0, key); o[k] = (o[k] ?? 1) * (1 + x); }); return Object.keys(o).sort().map((k) => o[k] - 1); };
  const mo = per(7), yr = per(4), sorted = [...r].sort((a, b) => a - b), q = Math.max(0, Math.floor(0.05 * n) - 1);
  const var95 = sorted[q], cvar = mean(sorted.slice(0, q + 1));
  const ups = mo.filter((x) => x > 0), dns = mo.filter((x) => x < 0);
  return {
    tot: g - 1, cagr, vol: sd * Math.sqrt(252), sharpe: (m / sd) * Math.sqrt(252), sortino: (m / ddn) * Math.sqrt(252),
    calmar: cagr == null || !mdd ? null : cagr / -mdd, skew, kurt,
    bestDay: sorted[n - 1], worstDay: sorted[0], winDay: r.filter((x) => x > 0).length / n,
    bestMo: Math.max(...mo), worstMo: Math.min(...mo), posMo: ups.length / mo.length,
    avgUp: ups.length ? mean(ups) : null, avgDn: dns.length ? mean(dns) : null,
    bestYr: yr.length > 1 ? Math.max(...yr) : null, worstYr: yr.length > 1 ? Math.min(...yr) : null,
    mdd, mddPeriod: worst ? [cal(worst.start), worst.end == null ? null : d[worst.end]] : null,
    longest, avgDd: eps.length ? mean(eps.map((e) => e.depth)) : 0,
    in5: dd.filter((v) => v <= -0.05).length / n, in10: dd.filter((v) => v <= -0.10).length / n, in20: dd.filter((v) => v <= -0.20).length / n,
    var95, cvar, _r: r, _d: d,
  };
}
function relStats(a, b) {
  const lin = (x, y) => {
    const mx = x.reduce((s, v) => s + v, 0) / x.length, my = y.reduce((s, v) => s + v, 0) / y.length;
    let c = 0, vx = 0, vy = 0; x.forEach((v, i) => { c += (v - mx) * (y[i] - my); vx += (v - mx) ** 2; vy += (y[i] - my) ** 2; });
    return { beta: c / vy, corr: c / Math.sqrt(vx * vy), mx, my };
  };
  const mon = (s) => { const o = {}; s._r.forEach((x, i) => { const k = s._d[i].slice(0, 7); o[k] = (o[k] ?? 1) * (1 + x); }); return Object.keys(o).sort().map((k) => o[k] - 1); };
  const D = lin(a._r, b._r), am = mon(a), bm = mon(b), M = lin(am, bm);
  const cap = (f) => { const ix = bm.map((x, i) => (f(x) ? i : -1)).filter((i) => i >= 0); if (!ix.length) return null;
    const ga = ix.reduce((s, i) => s * (1 + am[i]), 1) ** (1 / ix.length) - 1, gb = ix.reduce((s, i) => s * (1 + bm[i]), 1) ** (1 / ix.length) - 1; return ga / gb; };
  return { betaD: D.beta, corrD: D.corr, betaM: M.beta, corrM: M.corr, alpha: (D.mx - D.beta * D.my) * 252,
           up: cap((x) => x > 0), down: cap((x) => x < 0) };
}
const TERMS = {
  "Cumulative return": "Total gain or loss over the whole period.",
  "CAGR": "Compound annual growth rate: the steady yearly return that would produce the same result.",
  "Best year": "Highest calendar-year return in the period.",
  "Worst year": "Lowest calendar-year return in the period.",
  "Best month": "Highest calendar-month return.",
  "Worst month": "Lowest calendar-month return.",
  "Average up month": "Average return in months that made money.",
  "Average down month": "Average return in months that lost money.",
  "Positive months": "Share of months that made money.",
  "Best day": "Largest one-day gain.",
  "Worst day": "Largest one-day loss.",
  "Positive days": "Share of trading days that made money.",
  "Annualized volatility": "How much returns swing around, scaled to a year. Higher means a bumpier ride.",
  "Sharpe ratio": "Return per unit of volatility. Above 1 is good, above 2 is excellent.",
  "Sortino ratio": "Like Sharpe, but only counts downside swings as risk.",
  "Calmar ratio": "CAGR divided by the max drawdown: return earned per unit of worst-case pain.",
  "Skew": "Shape of the return distribution. Positive means occasional big gains outweigh big losses.",
  "Excess kurtosis": "How fat the tails are. Higher means more extreme days, up or down, than a normal distribution.",
  "Daily value at risk (95%)": "On the worst 1 day in 20, losses were at least this large.",
  "Expected shortfall (95%)": "The average loss on those worst 1-in-20 days.",
  "Max drawdown": "Largest fall from a previous high to a low.",
  "Max drawdown period": "When the largest fall started, and when it got back to its previous high.",
  "Longest drawdown": "Longest stretch spent below a previous high.",
  "Average drawdown": "Average depth of all falls from a previous high.",
  "Time in drawdown deeper than 5%": "Share of days spent more than 5% below a previous high.",
  "Time in drawdown deeper than 10%": "Share of days spent more than 10% below a previous high.",
  "Time in drawdown deeper than 20%": "Share of days spent more than 20% below a previous high.",
  "Beta (daily)": "How much it moves with the index day to day. 1 = in step, 0 = unrelated, negative = opposite.",
  "Correlation (daily)": "How closely daily moves line up with the index, from −1 to 1.",
  "Beta (monthly)": "As daily beta, measured on monthly returns.",
  "Correlation (monthly)": "As daily correlation, measured on monthly returns.",
  "Upside capture": "Share of the index's gains captured in the index's up months.",
  "Downside capture": "Share of the index's losses taken in its down months. Below 0% means it made money on average when the index fell.",
};
function keyTable(d, cols) {
  const S = cols.map((c) => ({ name: c.name, s: perfStats(d, c.r) })), refs = S.slice(1);
  const P = (x, dp = 1) => (x == null || !isFinite(x) ? "–" : pct(x * 100, dp)), U = (x, dp = 1) => (x == null || !isFinite(x) ? "–" : pct(x * 100, dp, false));
  const N = (x) => (x == null || !isFinite(x) ? "–" : x.toFixed(2).replace("-", "−"));
  const dur = (x) => (x < 45 ? `${Math.round(x)} days` : `${Math.round(x / 30.4)} months`);
  const sec = (l) => `<tr class="sec"><td class="l" colspan="${S.length + 1}">${l}</td></tr>`;
  const lab = (l) => `<td class="l"${TERMS[l] ? ` title="${TERMS[l]}"` : ""}>${l}</td>`;
  const row = (l, f) => `<tr>${lab(l)}${S.map((c, j) => `<td>${j ? f(c.s) : `<b>${f(c.s)}</b>`}</td>`).join("")}</tr>`;
  let h = `<table class="quant"><tr><th class="l"></th>${S.map((c) => `<th>${c.name.replace("&", "&amp;")}</th>`).join("")}</tr>`;
  h += sec("Returns") + row("Cumulative return", (s) => P(s.tot)) + row("CAGR", (s) => P(s.cagr)) + row("Best year", (s) => P(s.bestYr)) + row("Worst year", (s) => P(s.worstYr))
    + row("Best month", (s) => P(s.bestMo)) + row("Worst month", (s) => P(s.worstMo));
  h += sec("Risk") + row("Annualized volatility", (s) => U(s.vol)) + row("Sharpe ratio", (s) => N(s.sharpe)) + row("Sortino ratio", (s) => N(s.sortino)) + row("Calmar ratio", (s) => N(s.calmar))
    + row("Skew", (s) => N(s.skew)) + row("Excess kurtosis", (s) => N(s.kurt)) + row("Daily value at risk (95%)", (s) => P(s.var95, 2)) + row("Expected shortfall (95%)", (s) => P(s.cvar, 2));
  h += sec("Drawdowns") + row("Max drawdown", (s) => P(s.mdd)) + row("Longest drawdown", (s) => dur(s.longest))
    + row("Average drawdown", (s) => P(s.avgDd)) + row("Time in drawdown deeper than 5%", (s) => U(s.in5, 0)) + row("Time in drawdown deeper than 10%", (s) => U(s.in10, 0)) + row("Time in drawdown deeper than 20%", (s) => U(s.in20, 0));
  refs.forEach((b) => {
    const R = S.map((c) => relStats(c.s, b.s));
    const rr = (l, f) => `<tr>${lab(l)}${R.map((x, j) => `<td>${j ? f(x) : `<b>${f(x)}</b>`}</td>`).join("")}</tr>`;
    h += sec(`Relative to the ${b.name.replace("&", "&amp;")}`) + rr("Beta (daily)", (x) => N(x.betaD)) + rr("Correlation (daily)", (x) => N(x.corrD))
      + rr("Beta (monthly)", (x) => N(x.betaM)) + rr("Correlation (monthly)", (x) => N(x.corrM))
      + rr("Upside capture", (x) => U(x.up, 0)) + rr("Downside capture", (x) => (x.down == null ? "–" : `${Math.round(x.down * 100)}%`.replace("-", "−")));
  });
  return h + `</table>`;
}

function kairosChange(now, next) {
  const d = next - now;
  let t = "No change";
  if (Math.abs(d) >= 0.5) {
    if (Math.abs(next) < 0.5) t = `Close the ${now < 0 ? "short" : "long"} (now ${pct(now)})`;
    else if (Math.abs(now) < 0.5) t = `Open a ${next < 0 ? "short" : "long"} of ${pct(Math.abs(next), 0, false)}`;
    else if (Math.sign(now) !== Math.sign(next)) t = `Flip from ${pct(now)} to ${pct(next)}`;
    else t = `${Math.abs(next) > Math.abs(now) ? "Increase" : "Reduce"} the ${next < 0 ? "short" : "long"} from ${pct(now)} to ${pct(next)}`;
  }
  return `<div class="changes"><p class="kicker">Changes at the open</p><div class="chg"><b>${t}</b></div></div>`;
}
function tile(h) {
  const t = `${h.name} · ${h.sector}${h.new ? " · buy at the open" : h.since ? " · held since " + day(h.since, { day: "numeric", month: "short", year: "numeric" }) : ""}${h.ret_since != null ? " · " + pct(h.ret_since, 1) + " since entry" : ""}`;
  return `<div class="tile" title="${t.replace(/"/g, "")}"><b>${sym(h.symbol)}</b><span>${h.weight.toFixed(1)}%</span></div>`;
}
const sym = (t) => t.replace(/-\d{6}$/, "");          // Norgate marks delisted tickers WBD-202610
const SECTOR_SHORT = { "Information Technology": "Technology", "Communication Services": "Communication" };
function sectors(hs) {
  // Core grouped by sector, largest sector first
  const g = {};
  hs.forEach((h) => (g[h.sector] = g[h.sector] || []).push(h));
  const tot = (xs) => xs.reduce((a, h) => a + h.weight, 0);
  return `<div class="sectors">` + Object.entries(g).sort((a, b) => tot(b[1]) - tot(a[1])).map(([sec, xs]) => `<div class="sector">
    <div class="sec-h"><span>${SECTOR_SHORT[sec] || sec}</span><b>${tot(xs).toFixed(0)}%</b></div>
    <div class="tiles">${xs.map(tile).join("")}</div></div>`).join("") + `</div>`;
}
function changes(n, book) {
  const sold = n.exits.filter((x) => x.book === book).map((x) => sym(x.symbol));
  const hs = n.holdings.filter((h) => h.book === book);
  const bought = hs.filter((h) => h.new).map((h) => sym(h.symbol)), more = hs.filter((h) => h.added).map((h) => sym(h.symbol));
  const line = (l, xs) => `<div class="chg"><span>${l}</span><b>${xs.length ? xs.join(", ") : "–"}</b></div>`;
  return `<div class="changes"><p class="kicker">Changes at the open</p>${sold.length || bought.length || more.length ? line("Sell", sold) + line("Buy", bought) + (more.length ? line("Add to", more) : "") : `<div class="chg"><b>None</b></div>`}</div>`;
}
/* ---------- time chart (shared crosshair across panels) ---------- */
function timeChart(host, dates, panels, opts = {}) {
  host.innerHTML = "";
  // phones: draw 1:1 at the real width (readable text, visible lines) and a bit shallower; desktop: 1000-wide drawing
  const cw = host.clientWidth, phone = cw > 0 && cw < 600;
  if (phone) panels.forEach((p) => (p.h = Math.round(p.h * 0.7)));
  const W = phone ? cw : 1000, x0 = phone ? 36 : 40, x1 = W - 4 - (opts.padRight || 0) * (phone ? 0.7 : 1), gap = 18;
  // opts.axisAfter: put the date axis under that panel (e.g. 0 = under the price chart) with room before the next one
  const ax = opts.axisAfter, gp = panels.map((_, i) => (i === ax ? 50 : gap)), th = panels.map((p) => (p.title ? 24 : 0));
  const H = panels.reduce((a, p, i) => a + p.h + th[i], 0) + gp.slice(0, -1).reduce((a, g) => a + g, 0) + (ax != null && ax < panels.length - 1 ? 6 : 22);
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": opts.label || "chart" });
  const n = dates.length, X = (i) => x0 + (i / (n - 1)) * (x1 - x0), ink = css("--ink"), faint = "rgba(27,26,23,.14)";
  let top = 0; const geo = [];
  const plotH = ax != null && ax < panels.length - 1 ? panels.slice(0, ax + 1).reduce((a, p, i) => a + p.h + th[i], 0) + gap * ax : panels.reduce((a, p, i) => a + p.h + th[i], 0) + gap * (panels.length - 1);
  let axisY = H - 3;
  (opts.shade || []).forEach(([a, b]) => {
    const i0 = dates.findIndex((d) => d >= a), j = dates.findIndex((d) => d > b), i1 = j < 0 ? n - 1 : j;
    if (i0 >= 0 && i1 > i0) s.appendChild(svg("rect", { x: X(i0), y: 0, width: X(i1) - X(i0), height: plotH, fill: "rgba(21,23,26,.06)" }));
  });
  panels.forEach((p, pi) => {
    if (p.log) p.series.forEach((se) => { se.raw = se.v; se.v = se.v.map((v) => v == null ? null : Math.log10(v)); });
    if (p.clamp) p.series.forEach((se) => { se.raw = se.v; se.v = se.v.map((v) => v == null ? null : Math.max(p.min, Math.min(p.max, v))); });
    const vals = p.series.flatMap((se) => se.v.filter((v) => v != null));
    let lo = Math.min(...vals, p.zero ? 0 : Infinity), hi = Math.max(...vals, p.zero ? 0 : -Infinity);
    if (p.min != null) lo = Math.min(lo, p.min); if (p.max != null) hi = Math.max(hi, p.max);
    const pad = (hi - lo) * 0.05 || 1; lo -= pad; hi += pad;
    const t0 = top + th[pi], Y = (v) => t0 + p.h - ((v - lo) / (hi - lo)) * p.h;
    const ticks = [];
    if (p.log) { for (let k = Math.floor(lo); k <= hi; k++) [1, 2, 5].forEach((m) => { const v = k + Math.log10(m); if (v >= lo && v <= hi) ticks.push(v); }); }
    else { const st = p.tickStep || niceStep((hi - lo) / 3); for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) ticks.push(v); }
    if (p.title) { const tt = svg("text", { x: x0, y: top + 13, style: `fill:${ink};font-weight:600;font-size:13px` }); tt.textContent = p.title; s.appendChild(tt); }
    ticks.forEach((v) => {
      const z = Math.abs(v) < 1e-9 && p.zero;
      s.appendChild(svg("line", { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: z ? ink : faint, "stroke-width": z ? 1.5 : 1 }));
      const t = svg("text", { x: x0 - 6, y: Y(v) + 4, "text-anchor": "end" }); t.textContent = p.fmt(v); s.appendChild(t);
    });
    p.series.forEach((se) => {
      let d = "", on = false;
      se.v.forEach((v, i) => { if (v == null) { on = false; return; } const x = X(i), y = Y(v); d += se.step && on ? `H${x}V${y}` : (on ? "L" : "M") + x + "," + y; on = true; });
      if (se.area) s.appendChild(svg("path", { d: d + `V${Y(0)}H${X(0)}Z`, fill: se.color, opacity: 0.18 }));
      if (se.wash) s.appendChild(svg("path", { d: d + `V${t0 + p.h}H${X(0)}Z`, fill: se.color, opacity: se.wash }));   // soft fill down to the panel floor
      s.appendChild(svg("path", { d, fill: "none", stroke: se.color, "stroke-width": se.w || 2, "stroke-linejoin": "round" }));
    });
    const ends = p.series.filter((se) => se.endLabel).map((se) => ({ se, y: Y(se.v[se.v.length - 1]) })).sort((a, b) => a.y - b.y);
    const ls = opts.labelSize || 15;
    ends.forEach((o, i) => { if (i && o.y - ends[i - 1].y < ls * 1.2) o.y = ends[i - 1].y + ls * 1.2; });
    ends.forEach(({ se, y }) => { const tx = svg("text", { x: x1 + 8, y: y + ls / 3, style: `fill:${se.color};font-weight:600;font-size:${ls}px` }); tx.textContent = se.endLabel; s.appendChild(tx); });
    geo.push({ Y }); if (pi === ax && ax < panels.length - 1) axisY = top + th[pi] + p.h + 20; top += th[pi] + p.h + gp[pi];
  });
  let last = -1;
  if (opts.dayTicks) {
    const every = Math.max(1, Math.ceil(dates.length / 8));
    dates.forEach((d, i) => { if (i % every === 0) { const t = svg("text", { x: X(i), y: axisY, "text-anchor": "middle" }); t.textContent = day(d, { day: "numeric", month: "short" }); s.appendChild(t); } });
  } else dates.forEach((d, i) => {
    const dt = new Date(d + "T12:00:00Z"), m = dt.getUTCMonth(), y = dt.getUTCFullYear();
    if (m !== last && i > 0 && (!opts.yearTicks || (m === 0 && y % (opts.yearEvery || 1) === 0))) {
      const t = svg("text", { x: X(i), y: axisY, "text-anchor": "middle" });
      t.textContent = opts.yearTicks ? y : dt.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }); s.appendChild(t);
    }
    last = m;
  });
  if (opts.live) {
    const li = dates.findIndex((d) => d >= opts.live), [r, l] = opts.markLabels || ["Live", "Backtest"];
    if (li > 0) {
      s.appendChild(svg("line", { x1: X(li), x2: X(li), y1: -6, y2: top - gp[gp.length - 1], stroke: ink, "stroke-width": 1.5, "stroke-dasharray": "2 3" }));
      const edge = X(li) > W * 0.9;
      const a = svg("text", { x: edge ? X(li) - 6 : X(li) + 6, y: 4, "text-anchor": edge ? "end" : "start", style: `fill:${ink};font-weight:700;letter-spacing:0` }); a.textContent = edge ? r + " →" : r; s.appendChild(a);
      if (!edge) { const b = svg("text", { x: X(li) - 6, y: 4, "text-anchor": "end", style: "letter-spacing:.08em" }); b.textContent = l; s.appendChild(b); }
    }
  }
  const cross = svg("line", { y1: 0, y2: top - gp[gp.length - 1], stroke: ink, "stroke-width": 1, visibility: "hidden" }); s.appendChild(cross);
  const dots = panels.flatMap((p, pi) => p.series.map((se) => { const c = svg("rect", { width: 8, height: 8, fill: se.color, visibility: "hidden" }); s.appendChild(c); return { c, se, g: geo[pi] }; }));
  const hit = svg("rect", { x: x0, y: 0, width: x1 - x0, height: top - gp[gp.length - 1], fill: "transparent" }); s.appendChild(hit);
  host.appendChild(s);
  const tip = document.createElement("div"); tip.className = "tip"; host.appendChild(tip);
  hit.addEventListener("pointermove", (ev) => {
    const r = s.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round((((ev.clientX - r.left) / r.width) * W - x0) / (x1 - x0) * (n - 1))));
    cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("visibility", "visible");
    let h = `<b>${day(dates[i], { day: "numeric", month: "short", year: "numeric" })}</b>`;
    dots.forEach(({ c, se, g }) => {
      const v = se.v[i]; if (v == null) return c.setAttribute("visibility", "hidden");
      c.setAttribute("x", X(i) - 4); c.setAttribute("y", g.Y(v) - 4); c.setAttribute("visibility", "visible");
      h += `<br><span class="dot" style="background:${se.color}"></span>${se.name} ${se.tipFmt((se.raw || se.v)[i])}`;
    });
    tip.innerHTML = h; tip.style.display = "block";
    const hx = (X(i) / W) * r.width; tip.style.left = (hx > r.width * 0.6 ? hx - tip.offsetWidth - 12 : hx + 12) + "px"; tip.style.top = "6px";
  });
  if (opts.onBrush) {
    s.style.touchAction = "pan-y"; hit.style.cursor = "crosshair";
    const sel = svg("rect", { y: 0, height: top - gp[gp.length - 1], fill: "rgba(43,92,158,.12)", visibility: "hidden" });
    s.insertBefore(sel, hit);
    const idx = (ev) => { const r = s.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.round((((ev.clientX - r.left) / r.width) * W - x0) / (x1 - x0) * (n - 1)))); };
    let a0 = null;
    hit.addEventListener("pointerdown", (ev) => { a0 = idx(ev); hit.setPointerCapture(ev.pointerId); });
    hit.addEventListener("pointermove", (ev) => {
      if (a0 == null) return;
      const b = idx(ev), lo = Math.min(a0, b), hi = Math.max(a0, b);
      sel.setAttribute("x", X(lo)); sel.setAttribute("width", Math.max(0, X(hi) - X(lo))); sel.setAttribute("visibility", hi > lo ? "visible" : "hidden");
    });
    hit.addEventListener("pointerup", (ev) => {
      if (a0 == null) return;
      const b = idx(ev), lo = Math.min(a0, b), hi = Math.max(a0, b); a0 = null; sel.setAttribute("visibility", "hidden");
      if (hi - lo >= 3) opts.onBrush(lo, hi);
    });
  }
  hit.addEventListener("pointerleave", () => { tip.style.display = "none"; cross.setAttribute("visibility", "hidden"); dots.forEach((d) => d.c.setAttribute("visibility", "hidden")); });
}
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x)), f = x / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }

/* ---------- shared: full daily record ---------- */
async function fullDaily(extra = []) {
  const [H, S] = await Promise.all([loadJSON("data/history_daily.json"), loadJSON("data/series.json")]);
  const cut = H.dates.findIndex((d) => d >= S.dates[0]), k = cut < 0 ? H.dates.length : cut;
  const fs = ["dates", "model", "spx", "qqq", "net"].concat(extra), D = {};
  if (extra.some((f) => !S[f])) { fs.forEach((f) => (D[f] = H[f])); return D; }   // live file without these fields yet: history only
  fs.forEach((f) => (D[f] = H[f].slice(0, k).concat(S[f])));
  return D;
}
function calendarYears(D) {
  const out = [];
  D.dates.forEach((d, i) => {
    const y = +d.slice(0, 4);
    if (!out.length || out[out.length - 1].year !== y) out.push({ year: y, model: 1, spx: 1, qqq: 1 });
    const o = out[out.length - 1];
    ["model", "spx", "qqq"].forEach((f) => (o[f] *= 1 + D[f][i] / 100));
  });
  out.forEach((o) => ["model", "spx", "qqq"].forEach((f) => (o[f] = (o[f] - 1) * 100)));
  return out;
}

/* ---------- landing page ---------- */
async function renderLanding() {
  try { await landing(); } finally { const el = location.hash && document.querySelector(location.hash); if (el) el.scrollIntoView(); }
}
async function landing() {
  const [h, D] = await Promise.all([loadJSON("data/history.json"), fullDaily()]);
  const years = calendarYears(D);
  const st = h.stats.full, lose = (k) => years.filter((y) => y[k] < 0).length;
  document.getElementById("stats").innerHTML = [
    [pct(st.r.cagr, 1, false), "annual return", `S&P 500 ${pct(st.spx.cagr, 1, false)}`],
    [pct(st.r.maxdd, 0), "worst fall, peak to trough", `S&P 500 ${pct(st.spx.maxdd, 0)}`],
    [String(lose("model")), `losing years out of ${years.length}`, `S&P 500: ${lose("spx")}`],
  ].map(([v, l, b]) => `<div><div class="v">${v}</div><div class="l">${l}</div><div class="b">${b}</div></div>`).join("");

  const card = (cls, name, q, txt) => `<div class="lp-book ${cls}"><p class="kicker">${q}</p><h3>${name}</h3><p>${txt}</p></div>`;
  document.getElementById("books").innerHTML =
    card("wave", "Core", "The long-term engine", "Owns strong, high-quality companies in steady uptrends, the kind that consistently beat the market. Highly selective, yet diversified: up to 50 positions, spread across sectors. This is the strategy that captures big, powerful advances from the start, before you hear about them.") +
    card("opp", "Contrarian", "The opportunist", "Buys high-quality stocks when other investors are panicking. Short-term trades in the world's top companies, held for days rather than months. This is how the portfolio turns investor emotion into extra return.") +
    card("fut", "Compass", "The risk manager", "Assesses the entire market every day and builds a directional view. Most days its job is to protect Core and Contrarian by hedging out their market risk, but when it has high conviction of a move in either direction, it takes the entire portfolio long or short. This is how the portfolio profits in all types of market: bull, bear and everything in between.");

  document.getElementById("crash").innerHTML = `<div class="crash-head"><span></span><span>S&amp;P 500</span><span>Portfolio</span><span>Its deepest dip</span></div>` +
    h.crashes.map((c) => `<div class="crash-row">
      <div class="crash-name"><b>${c.name}</b><span>${day(c.from, { month: "short", year: "numeric" })} – ${day(c.to, { month: "short", year: "numeric" })}</span></div>
      <div class="crash-v down" data-l="S&amp;P 500">${pct(c.spx, 0)}</div>
      <div class="crash-v ${tone(c.model)}" data-l="Portfolio">${pct(c.model, 0)}</div>
      <div class="crash-dip" data-l="Deepest dip">${pct(c.dip, 0)}</div></div>`).join("");

  const oy = +h.oos_start.slice(0, 4), ly = +D.dates[D.dates.length - 1].slice(0, 4);
  document.getElementById("years").innerHTML = years.map((y) => `<div><div class="y">${y.year}${y.year === ly ? " YTD" : ""}</div><div class="m ${tone(y.model)}">${pct(y.model)}</div><div class="b ${y.spx < 0 ? "down" : ""}">S&amp;P ${pct(y.spx)}</div></div>`).join("");

  // the chart runs on the same spliced record, so it ends at the latest close
  const k = D.dates.findIndex((d) => d >= "2018-01-01");
  const grow = (r) => { let g = 100; return r.slice(k).map((x, i) => (i ? (g *= 1 + x / 100) : g)); };
  const heroChart = () => timeChart(document.getElementById("hero-chart"), D.dates.slice(k), [
    { h: 370, log: true, fmt: (v) => Math.round(10 ** v).toLocaleString(), series: [
      { name: "S&P 500", v: grow(D.spx), color: css("--ink-3"), w: 1.6, tipFmt: (v) => pct(v - 100, 0) },
      { name: "OPTEX all-weather stock portfolio", v: grow(D.model), color: css("--wave"), w: 2.6, wash: 0.1, tipFmt: (v) => pct(v - 100, 0) }] },
  ], { yearTicks: true, yearEvery: 1, label: "Portfolio vs S&P 500 since 2018" });
  heroChart();
  let narrow = innerWidth < 600;                     // phone and desktop draw differently: redraw when crossing
  addEventListener("resize", () => { if ((innerWidth < 600) !== narrow) { narrow = innerWidth < 600; heroChart(); } });
}

/* ---------- performance page ---------- */
const rangeBtns = (id, def) => `<div class="seg ranges" id="${id}">${RANGES.map(([k]) => `<button aria-pressed="${k === def}" data-r="${k}">${k}</button>`).join("")}</div>`;
const benchBtns = (id) => `<div class="seg bench" id="${id}"><span class="seg-l">Compare with</span><button aria-pressed="true" data-b="spx">S&amp;P 500</button><button aria-pressed="false" data-b="qqq">Nasdaq-100</button></div>`;
function renderPerformance(root) {
  root.innerHTML = `
  <div class="record perf-top">
    <div class="bar-head"><h1 class="h2 perf-h1">Performance</h1>${benchBtns("seg")}</div>
    <div class="range-bar">${rangeBtns("ranges", "5Y")}
      <span class="zoom-hint">Drag across the chart to zoom in</span><button class="zoom-reset" id="zoom-reset" hidden>Reset zoom</button></div>
    <div class="row" id="row"></div>
    <div class="chart" id="chart"></div>
    <div class="legend"><span><i style="background:var(--ink)"></i>Net exposure</span><span><i style="background:var(--wave)"></i>Core exposure</span><span><i style="background:var(--opp)"></i>Contrarian exposure</span><span><i style="background:var(--kairos)"></i>Compass exposure</span></div>
  </div>
  <div class="record keynums">
    <div class="bar-head"><h2 class="h2">Key numbers</h2>${benchBtns("kn-seg")}</div>
    <div class="range-bar">${rangeBtns("kn-ranges", "5Y")}</div>
    <div class="scroll" id="keynums" style="margin-top:18px"></div>
  </div>
  <div class="record" style="margin-top:56px">
    <div class="bar-head"><div><p class="kicker">Every year</p><h2 class="h2">Year by year</h2></div>${benchBtns("yr-seg")}</div>
    <div class="scroll" id="years" style="margin-top:18px"></div>
  </div>
  <p class="more" style="margin-top:44px"><a href="archive.html">Historical portfolio allocations →</a></p>`;
  record(null, false);
  keySection();
}
async function keySection() {
  const D = await fullDaily(), st = { r: "5Y" };
  const draw = () => {
    const i0 = st.r === "ALL" ? 0 : windowStart(D.dates, st.r), bs = benchOn("#kn-seg");
    const d = D.dates.slice(i0 + 1), cols = [{ name: "Portfolio", r: D.model.slice(i0 + 1) }].concat(bs.map((b) => ({ name: BENCH[b][0], r: D[b].slice(i0 + 1) })));
    document.getElementById("keynums").innerHTML = keyTable(d, cols);
  };
  draw();
  document.querySelectorAll("#kn-seg button").forEach((bt) => bt.addEventListener("click", () => { bt.setAttribute("aria-pressed", bt.getAttribute("aria-pressed") !== "true"); draw(); }));
  document.querySelectorAll("#kn-ranges button").forEach((bt) => bt.addEventListener("click", () => {
    document.querySelectorAll("#kn-ranges button").forEach((o) => o.setAttribute("aria-pressed", o === bt)); st.r = bt.dataset.r; draw();
  }));
  // year by year: return and max drawdown within each calendar year, for the portfolio and each benchmark switched on
  const Y = {}, F = ["model", "spx", "qqq"];
  D.dates.forEach((dt, i) => {
    const y = dt.slice(0, 4), o = (Y[y] = Y[y] || Object.fromEntries(F.map((f) => [f, [1, 1, 0]])));
    F.forEach((f) => { const a = o[f]; a[0] *= 1 + D[f][i] / 100; a[1] = Math.max(a[1], a[0]); a[2] = Math.min(a[2], a[0] / a[1] - 1); });
  });
  const ly = D.dates[D.dates.length - 1].slice(0, 4), P = (x) => pct(x * 100, 1);
  const years = () => {
    const bs = benchOn("#yr-seg"), nm = (b) => BENCH[b][0].replace("&", "&amp;");
    document.getElementById("years").innerHTML = `<table class="quant yrs-t"><tr><th class="l">Year</th><th>Portfolio</th>${bs.map((b) => `<th>${nm(b)}</th>`).join("")}<th title="Largest fall from a high within the year">Portfolio max drawdown</th>${bs.map((b) => `<th>${nm(b)} max drawdown</th>`).join("")}</tr>`
      + Object.keys(Y).sort().reverse().map((y) => { const o = Y[y];
        return `<tr><td class="l">${y}${y === ly ? " (YTD)" : ""}</td><td class="${tone(o.model[0] - 1)}"><b>${P(o.model[0] - 1)}</b></td>${bs.map((b) => `<td class="${tone(o[b][0] - 1)}">${P(o[b][0] - 1)}</td>`).join("")}<td>${P(o.model[2])}</td>${bs.map((b) => `<td>${P(o[b][2])}</td>`).join("")}</tr>`; }).join("") + `</table>`;
  };
  years();
  document.querySelectorAll("#yr-seg button").forEach((bt) => bt.addEventListener("click", () => { bt.setAttribute("aria-pressed", bt.getAttribute("aria-pressed") !== "true"); years(); }));
}

/* ---------- how it works: three markets, fixed snapshots ---------- */
// Each strategy's figure is its gain or loss as a share of the whole portfolio, weighted by the portfolio's value on the
// day, so the three add up exactly to the portfolio's return over the period.
const EXAMPLES = [
  { lead: "core", kind: "Bull markets", name: "Bull markets", eg: "the steady advance of 2017", from: "2017-01-01", to: "2017-10-31",
    text: "Long, persistent bull markets are where stocks make most of their gains, and the Core strategy is built to capture them. Through the first ten months of 2017 it held 50–80% of the portfolio in leading stocks advancing steadily higher and made most of the return. The Compass strategy hedged much of the market risk, so the gain came from owning the right stocks. The deepest dip was less than 2%." },
  { lead: "compass", kind: "Bear markets", name: "Bear markets", eg: "the 2022 bear market", from: "2022-01-03", to: "2022-10-12",
    text: "Slow, grinding bear markets bring months of sharp rallies and renewed sell-offs that wear down buy-and-hold investors. Through 2022, the Compass strategy switched the portfolio between fully short, hedged and fully long dozens of times as conditions changed, adding 66% while the S&P 500 fell 24%. The Core strategy cut back to under 10% of the portfolio as volatility rose, which kept its losses small." },
  { lead: "contrarian", kind: "Crashes", name: "Crashes", eg: "the 2008 great financial crisis", from: "2008-10-01", to: "2008-12-31",
    text: "In a crash, forced and fearful selling drives even great companies far below fair value, and these are the moments the Contrarian strategy waits for. As banks failed in late 2008, the Core strategy had already sold almost everything. Contrarian selectively made purchases, at times with over 70% of the portfolio, and sold within days as prices rebounded, making over 20% while the S&P 500 fell 22%." },
];
async function renderExamples(root) {
  const D = await fullDaily(["core", "contrarian", "compass"]);
  const B = [["core", "Core", "--wave"], ["contrarian", "Contrarian", "--opp"], ["compass", "Compass", "--kairos"]];
  const E = EXAMPLES.map((x) => {
    const i0 = D.dates.findIndex((d) => d >= x.from), i1 = D.dates.findLastIndex((d) => d <= x.to);
    // running totals from 0 on the day before the period: portfolio and S&P cumulative return, each strategy's share of it
    let g = 1, s = 1; const c = { core: 0, contrarian: 0, compass: 0 }, L = { model: [0], spx: [0], core: [0], contrarian: [0], compass: [0] };
    const dates = [D.dates[i0 - 1]];
    for (let i = i0; i <= i1; i++) {
      B.forEach(([k]) => (c[k] += (D[k][i] / 100) * g));
      g *= 1 + D.model[i] / 100; s *= 1 + D.spx[i] / 100;
      dates.push(D.dates[i]); L.model.push((g - 1) * 100); L.spx.push((s - 1) * 100); B.forEach(([k]) => L[k].push(c[k] * 100));
    }
    return { ...x, d0: D.dates[i0], d1: D.dates[i1], dates, L, port: (g - 1) * 100, spx: (s - 1) * 100, c: Object.fromEntries(B.map(([k]) => [k, c[k] * 100])) };
  });
  const top = Math.max(...E.flatMap((e) => B.map(([k]) => Math.abs(e.c[k]))));      // one scale for all three
  root.innerHTML = E.map((e, j) => { const [, ln, lc] = B.find(([k]) => k === e.lead);
    return `<div class="ex"><div class="ex-head">
    <div><h3>${e.name}</h3><p class="ex-when">Example: ${e.eg}</p><p class="ex-text">${e.text}</p></div>
    <div><div class="ex-top"><div><div class="v ${tone(e.port)}">${pct(e.port, 1)}</div><div class="l">Portfolio</div></div>
      <div><div class="v sp">${pct(e.spx, 1)}</div><div class="l">S&amp;P 500</div></div></div>
    <p class="ex-bars-h">Share of the portfolio's return</p>
    <div class="ex-bars">${B.map(([k, n, col]) => { const v = e.c[k], w = (Math.abs(v) / top) * 50;
      return `<div class="ex-row${k === e.lead ? " lead" : ""}"><span class="n">${n}</span><span class="track"><i style="background:var(${col});width:${w}%;${v < 0 ? `right:50%` : `left:50%`}"></i></span><span class="pv ${tone(v)}">${pct(v, 1)}</span></div>`; }).join("")}</div></div></div>
    <div class="chart ex-chart" id="ex-chart-${j}"></div></div>`; }).join("");
  const f = (v) => pct(v, 1);
  E.forEach((e, j) => { const [, ln, lc] = B.find(([k]) => k === e.lead);
    timeChart(document.getElementById(`ex-chart-${j}`), e.dates, [
      { h: 330, zero: true, fmt: (v) => v.toFixed(0).replace("-", "−") + "%", series: [
        { name: "S&P 500", endLabel: "S&P 500", v: e.L.spx, color: css("--ink-3"), w: 2, tipFmt: f },
        ...B.map(([k, n, col]) => ({ name: n, endLabel: n, v: e.L[k], color: css(col), w: 2, tipFmt: f })),
        { name: "Portfolio", endLabel: "Portfolio", v: e.L.model, color: css("--ink"), w: 3, tipFmt: f }] },
    ], { padRight: 110, dayTicks: e.dates.length < 80, label: `${e.name}: portfolio, S&P 500 and each strategy's share of the return` }); });
}

/* ---------- header: always shown on desktop; on phones it hides while scrolling down ---------- */
(() => {
  const m = document.querySelector(".mast"); if (!m) return;
  let last = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    m.classList.toggle("stuck", y > 80);
    if (Math.abs(y - last) < 4) return;
    m.classList.toggle("away", innerWidth < 760 && y > last && y > 120);
    last = y;
  }, { passive: true });
})();

/* ---------- how it works: hero graphic, the three strategies taking turns ---------- */
// Decoration only (no labels, axes or dates). It starts from the real Oct 2008 – Sep 2009 shares of the return, then
// stylizes Contrarian (a steeper early surge, then some swings instead of a long flat stretch) and gives Compass a small
// early dip, and spreads the three end points apart. The portfolio line is always the sum of the three strategy lines.
async function renderHeroArt(host) {
  if (!host) return;
  const D = await fullDaily(["core", "contrarian", "compass"]);
  const K = [["compass", "--kairos", 0.6], ["core", "--wave", 0.6], ["contrarian", "--opp", 0.85], ["model", "--ink", 0.92]];
  const i0 = D.dates.findIndex((d) => d >= "2008-10-01"), i1 = D.dates.findLastIndex((d) => d <= "2009-09-30");
  let g = 1; const L = { core: [0], compass: [0] }, c = { core: 0, compass: 0 };
  for (let i = i0; i <= i1; i++) { ["core", "compass"].forEach((k) => { c[k] += (D[k][i] / 100) * g; L[k].push(c[k] * 100); }); g *= 1 + D.model[i] / 100; }
  const n = L.core.length, T = (i) => i / (n - 1);
  L.contrarian = L.core.map((_, i) => { const t = T(i), r = Math.min(t / 0.16, 1), u = Math.max(t - 0.16, 0);
    return 27 * (1 - (1 - r) ** 2) + (4.5 * Math.sin((2 * Math.PI * u) / 0.23) + 2 * Math.sin((2 * Math.PI * u) / 0.09 + 1.3)) * Math.exp(-u * 0.8) * Math.min(u / 0.04, 1) + 3 * u; });
  L.compass = L.compass.map((v, i) => v - 7 * Math.exp(-(((T(i) - 0.13) / 0.07) ** 2)) - 11 * T(i) ** 2.5);   // early dip; finishes well below Core
  L.core = L.core.map((v, i) => v + 10 * T(i) ** 2);                                                        // Core finishes highest
  L.model = L.core.map((v, i) => v + L.contrarian[i] + L.compass[i]);
  const sm = (v, w = 6) => v.map((_, i) => { const k = Math.min(w, i, v.length - 1 - i), a = v.slice(i - k, i + k + 1); return a.reduce((x, y) => x + y, 0) / a.length; });   // window narrows at the ends, so every line starts at 0
  const lo = -20, hi = 80, Wd = 600, Ht = 340;
  const X = (i) => 6 + (i / (n - 1)) * (Wd - 12), Y = (v) => 6 + ((hi - v) / (hi - lo)) * (Ht - 12);
  const s = svg("svg", { viewBox: `0 0 ${Wd} ${Ht}`, "aria-hidden": "true" });
  s.appendChild(svg("line", { x1: 0, x2: Wd, y1: Y(0), y2: Y(0), stroke: "rgba(27,26,23,.12)" }));
  K.forEach(([k, col, op]) => s.appendChild(svg("path", { d: sm(L[k]).map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1)).join(""),
    fill: "none", stroke: css(col), "stroke-width": k === "model" ? 8 : 3, opacity: op, "stroke-linecap": "round", "stroke-linejoin": "round" })));
  host.appendChild(s);
}

/* ---------- header: menu button on phones ---------- */
(() => {
  const m = document.querySelector(".mast"), b = m && m.querySelector(".menu-btn"); if (!b) return;
  b.addEventListener("click", () => { const o = m.classList.toggle("open"); b.setAttribute("aria-expanded", o); });
  m.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => m.classList.remove("open")));
})();

/* ---------- email sign-up: a normal form post to Buttondown (its documented embed), which then redirects to thanks.html.
   (A background fetch never reached Buttondown, so the browser submits the form itself.) ---------- */
document.querySelectorAll("form.signup").forEach((f) => f.addEventListener("submit", () => {
  const b = f.querySelector("button"); b.disabled = true; b.textContent = "Signing up…";
}));

