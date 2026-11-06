/* OPTEX Market Timing Model site. Reads data/latest.json, data/history.json and data/history_daily.json. Everything is % of the account.
   Chart, statistics and header code copied from the main site (website/assets/app.js, 2026-11-04). */
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
// pages under /pro/ set <html data-base="../"> so they read the same data files as the main site
const BASE = document.documentElement.dataset.base || "", PRO = document.documentElement.dataset.site === "pro";
async function loadJSON(u) { const r = await fetch(/^(https?:|\/)/.test(u) ? u : BASE + u, { cache: "no-cache" }); if (!r.ok) throw new Error(u + " " + r.status); return r.json(); }

const BENCH = { spx: ["S&P 500", "--ink-3"], qqq: ["QQQ", "--ink-2"] };
const benchOn = (sel = "#seg") => [...document.querySelectorAll(sel + " button")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.b);
/* first shared publicly on X: marked on every chart, "Since 10/10/23" range, home-page numbers start here */
const SHARED = "2023-10-10";
const X_URL = "https://x.com/OptexSignals";
const xLink = (t) => `<a href="${X_URL}" target="_blank" rel="noopener">${t}</a>`;
const sharedLong = () => day(SHARED, { day: "numeric", month: "long", year: "numeric" });
/* long/short (the model) or long only (shorts held as cash), chosen once and kept across pages */
const MODE = (() => { try { return localStorage.getItem("optex-mode") === "lo" ? "lo" : "ls"; } catch (e) { return "ls"; } })();
const LO = MODE === "lo";
function modeBar() {
  return `<div class="seg mode" role="group" aria-label="Version"><button aria-pressed="${!LO}" data-m="ls">Long/short</button><button aria-pressed="${LO}" data-m="lo">Long only</button></div>`;
}
document.addEventListener("click", (ev) => {
  const b = ev.target.closest(".seg.mode button"); if (!b) return;
  try { localStorage.setItem("optex-mode", b.dataset.m); } catch (e) {}
  location.reload();
});
function windowStart(dates, r) {
  if (r === "X") return Math.max(0, dates.findIndex((d) => d >= SHARED));
  const last = dates[dates.length - 1], end = new Date(last + "T12:00:00Z");
  if (r === "YTD") return Math.max(0, dates.findIndex((d) => d >= last.slice(0, 4) + "-01-01") - 1);
  const from = new Date(end - RANGES.find(([k]) => k === r)[1] * 864e5).toISOString().slice(0, 10);
  return Math.max(0, dates.findIndex((d) => d >= from) - 1);
}
const RANGE_NAME = { X: "Since 10 Oct 2023, live on X", "1W": "Last week", "1M": "Last month", "3M": "Last 3 months", "6M": "Last 6 months", YTD: "Year to date", "12M": "Last 12 months", "3Y": "Last 3 years", "5Y": "Last 5 years", "10Y": "Last 10 years" };
const RANGES = [["1W", 7], ["1M", 31], ["3M", 92], ["6M", 183], ["YTD", 0], ["12M", 366], ["3Y", 1096], ["5Y", 1827], ["10Y", 3653], ["X", 0], ["ALL", 1e6]];
const RANGE_LABEL = { X: "Since Oct 23" };

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
  const sub = (f) => { const ix = b._r.map((x, i) => (f(x) ? i : -1)).filter((i) => i >= 0); return ix.length > 20 ? lin(ix.map((i) => a._r[i]), ix.map((i) => b._r[i])).beta : null; };
  return { betaUp: sub((x) => x > 0), betaDn: sub((x) => x < 0), betaD: D.beta, corrD: D.corr, betaM: M.beta, corrM: M.corr, alpha: (D.mx - D.beta * D.my) * 252,
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
  "Beta on up days": "Daily beta measured only on days the benchmark rose: how much of its gains it took part in.",
  "Beta on down days": "Daily beta measured only on days the benchmark fell: how much of its losses it took part in. Below 0 means it tended to rise on those days.",
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
  "Beta (daily)": "How much it moves with the benchmark day to day. 1 = in step, 0 = unrelated, negative = opposite.",
  "Correlation (daily)": "How closely daily moves line up with the benchmark, from −1 to 1.",
  "Beta (monthly)": "As daily beta, measured on monthly returns.",
  "Correlation (monthly)": "As daily correlation, measured on monthly returns.",
  "Upside capture": "Share of the benchmark's gains captured in the benchmark's up months.",
  "Downside capture": "Share of the benchmark's losses taken in its down months. Below 0% means it made money on average when the benchmark fell.",
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
    + row("Best month", (s) => P(s.bestMo)) + row("Worst month", (s) => P(s.worstMo)) + row("Positive months", (s) => U(s.posMo, 0));
  h += sec("Risk") + row("Annualized volatility", (s) => U(s.vol)) + row("Sharpe ratio", (s) => N(s.sharpe)) + row("Sortino ratio", (s) => N(s.sortino)) + row("Calmar ratio", (s) => N(s.calmar))
    + row("Skew", (s) => N(s.skew)) + row("Excess kurtosis", (s) => N(s.kurt)) + row("Daily value at risk (95%)", (s) => P(s.var95, 2)) + row("Expected shortfall (95%)", (s) => P(s.cvar, 2));
  h += sec("Drawdowns") + row("Max drawdown", (s) => P(s.mdd)) + row("Longest drawdown", (s) => dur(s.longest))
    + row("Average drawdown", (s) => P(s.avgDd)) + row("Time in drawdown deeper than 5%", (s) => U(s.in5, 0)) + row("Time in drawdown deeper than 10%", (s) => U(s.in10, 0)) + row("Time in drawdown deeper than 20%", (s) => U(s.in20, 0));
  refs.forEach((b) => {
    const R = S.map((c) => relStats(c.s, b.s));
    const rr = (l, f) => `<tr>${lab(l)}${R.map((x, j) => `<td>${j ? f(x) : `<b>${f(x)}</b>`}</td>`).join("")}</tr>`;
    h += sec(`Relative to the ${b.name.replace("&", "&amp;")}`) + rr("Beta (daily)", (x) => N(x.betaD)) + rr("Beta on up days", (x) => N(x.betaUp)) + rr("Beta on down days", (x) => N(x.betaDn)) + rr("Correlation (daily)", (x) => N(x.corrD))
      + rr("Beta (monthly)", (x) => N(x.betaM)) + rr("Correlation (monthly)", (x) => N(x.corrM))
      + rr("Upside capture", (x) => U(x.up, 0)) + rr("Downside capture", (x) => (x.down == null ? "–" : `${Math.round(x.down * 100)}%`.replace("-", "−")));
  });
  return h + `</table>`;
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

/* ---------- performance page ---------- */
const rangeBtns = (id, def) => `<div class="seg ranges" id="${id}">${RANGES.map(([k]) => `<button aria-pressed="${k === def}" data-r="${k}"${k === "X" ? ' class="xr"' : ""}>${RANGE_LABEL[k] || k}</button>`).join("")}</div>`;
const benchBtns = (id) => `<div class="seg bench" id="${id}"><span class="seg-l">Compare with</span><button aria-pressed="true" data-b="qqq">QQQ</button><button aria-pressed="false" data-b="spx">S&amp;P 500</button></div>`;
// one date window for the whole performance page: both range bars and a drag-zoom on the chart set it
const PERF = { r: "X", zoom: null, subs: [] };
function perfSet(o) {
  Object.assign(PERF, o);
  document.querySelectorAll("#ranges button, #kn-ranges button").forEach((b) => b.setAttribute("aria-pressed", !PERF.zoom && b.dataset.r === PERF.r));
  document.querySelectorAll(".zoom-reset").forEach((b) => (b.hidden = !PERF.zoom));
  PERF.subs.forEach((f) => f());
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
/* ================= OPTEX Market Timing Model: one QQQ position, long or short ================= */
const NAME = "OPTEX";   // short label in charts and tables; the brand is "OPTEX Market Timing Model"
const side = (x) => Math.abs(x) < 0.5 ? "On the sidelines" : x < 0 ? "Short" : "Long";
const sideLong = (x) => Math.abs(x) < 0.5 ? "On the sidelines" : x < 0 ? "Short QQQ" : "Long QQQ";

/* ---------- the day's position ---------- */
function positionChange(now, next) {          // now = position held into the close, next = position from the close
  const d = next - now;
  if (Math.abs(d) < 0.5) return Math.abs(next) < 0.5 ? "None. Stay on the sidelines" : `None. Hold the ${next < 0 ? "short" : "long"} at ${pct(next)}`;
  if (Math.abs(next) < 0.5) return `Close the ${now < 0 ? "short" : "long"}`;
  if (Math.abs(now) < 0.5) return `Open a ${next < 0 ? "short" : "long"} of ${pct(Math.abs(next), 0, false)}`;
  if (Math.sign(now) !== Math.sign(next)) return `Flip from ${pct(now)} to ${pct(next)}`;
  return `${Math.abs(next) > Math.abs(now) ? "Increase" : "Reduce"} the ${next < 0 ? "short" : "long"} from ${pct(now)} to ${pct(next)}`;
}
function renderPosition(s, root, { archived = false } = {}) {
  if (LO && s.position_lo != null) s = { ...s, position: s.position_lo, previous: s.previous_lo, previous_since: s.previous_since_lo ?? s.previous_since, last_change: s.last_change_lo ?? s.last_change, parts: { ...s.parts, short: 0 }, day: { ...s.day, model: s.day.model_lo ?? s.day.model }, loShort: s.parts.short < -0.5 };
  const P = s.parts, x = s.position;
  const when = s.published_utc ? `Published ${new Date(s.published_utc).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ET`
    : s.provisional ? "Preview · provisional: today's NYSE breadth arrives later, final check this evening" : "Preview · final close data · not published live";
  const len = Math.max(...[pct(P.lt, 0, false), pct(P.st, 0, false), pct(Math.abs(P.short), 0, false), pct(x)].map((t) => t.length));
  root.innerHTML = `
  <div class="dateline">
    <p class="kicker">${archived ? "Archived · " : ""}Position at the close</p>
    <h1 class="when">${day(s.asof)}</h1>
    <p class="kicker pub">${when}</p>
    <div class="pos-mode">${modeBar()}</div>
    ${archived ? `<a class="banner" href="position.html">This is an archived day. See the current position →</a>` : ""}
  </div>

  <div class="ix-head">
    <div class="ix-big">
      <p class="alloc-cap">QQQ position, as a percentage of the account</p>
      <div class="ix-n">${pct(x)}</div>
      <div class="ix-side">${sideLong(x)}${Math.abs(x) >= 0.5 ? `, ${pct(Math.abs(x), 0, false)} of the account` : ""}</div>
    </div>
    <div class="ix-chg">
      <p class="kicker">Last change</p>
      ${s.last_change ? `<b>From ${pct(s.last_change.from)} to ${pct(s.last_change.to)}</b>
      <p class="ix-was">At the close on ${day(s.last_change.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${s.last_change.date === s.asof ? " (today)" : ""}</p>` : `<b>${positionChange(s.previous, x)}</b>`}
    </div>
  </div>

  <p class="alloc-cap" style="margin-top:48px">How the position is made up</p>
  <div class="eq" style="--len:${len}">
    <div class="term"><div class="l"><i class="chip wave"></i>Long-term</div><div class="n">${pct(P.lt, 0, false)}</div></div>
    <div class="op">+</div>
    <div class="term"><div class="l"><i class="chip opp"></i>Tactical</div><div class="n">${pct(P.st, 0, false)}</div></div>
    <div class="op">−</div>
    <div class="term"><div class="l"><i class="chip fut"></i>Short side</div><div class="n">${pct(Math.abs(P.short), 0, false)}</div></div>
    <div class="op">=</div>
    <div class="term net"><div class="l">Position</div><div class="n">${pct(x)}</div></div>
  </div>

  <div class="ix-facts">
    <div><p class="kicker">QQQ on the day</p><b class="${tone(s.day.qqq)}">${pct(s.day.qqq, 2)}</b></div>
    <div><p class="kicker">${NAME} on the day</p><b class="${tone(s.day.model)}">${pct(s.day.model, 2)}</b></div>
  </div>
  <p class="note">Following it with QQQ: a position of ${pct(x)} on a $100,000 account means ${Math.abs(x) < 0.5 ? "holding no QQQ" : `${x < 0 ? "short" : "holding"} $${Math.round(Math.abs(x) * 1000).toLocaleString("en-US")} of QQQ`}. Positions above 100% use borrowing, and short positions need a margin account.</p>
  <p class="more" style="margin-top:44px"><a href="performance.html">Performance →</a> &nbsp; <a href="archive.html">Archive →</a></p>`;
}

/* ---------- shared: full daily record ---------- */
async function fullDaily() {
  const D = await loadJSON("data/history_daily.json");
  if (LO) { D.model = D.model_lo; D.net = D.net_lo; if (D.net_close_lo) D.net_close = D.net_close_lo; }
  return D;
}

/* ---------- performance chart: growth, drawdown, position ---------- */
async function record() {
  const D = await fullDaily(), st = Object.assign(PERF, { bs: ["qqq"] });
  const zr = document.getElementById("zoom-reset");
  const draw = () => {
    const last = D.dates[D.dates.length - 1], end = new Date(last + "T12:00:00Z");
    let i0 = 0, i1 = D.dates.length;
    if (st.zoom) { i0 = Math.max(0, D.dates.indexOf(st.zoom[0]) - 1); i1 = D.dates.indexOf(st.zoom[1]) + 1; }
    else if (st.r === "YTD") { const y = last.slice(0, 4); i0 = Math.max(0, D.dates.findIndex((d) => d >= y + "-01-01") - 1); }
    else if (st.r === "X") { i0 = windowStart(D.dates, "X"); }
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
      : st.r === "ALL" ? "since " + dates[0].slice(0, 4) : st.r === "X" ? "since 10 Oct 2023" : st.r;
    document.getElementById("row").innerHTML = cell(`Return, ${span}`, ret(m), ret) + (ann(m) != null ? cell("Per year", ann(m), ann) : "");
    const yrs = dates.length / 252, log = yrs > 4, lw = yrs > 4 ? 0.5 : 1.4, pf = (v) => pct(v, 1);
    timeChart(document.getElementById("chart"), dates, [
      { h: 340, log, title: "Growth of 100", fmt: log ? (v) => Math.round(10 ** v).toLocaleString() : (v) => v.toFixed(0), series: bms.map((x) => ({ name: x.name, v: x.g, color: x.color, w: 1.5, tipFmt: (v) => pct(v - 100, 1) })).concat([
        { name: NAME, v: m, color: css("--wave"), w: 2.4, tipFmt: (v) => pct(v - 100, 1) }]) },
      { h: 130, title: "Drawdown", fmt: (v) => v.toFixed(0).replace("-", "−") + "%", zero: true, max: 0, series: bms.map((x) => ({ name: x.name + " drawdown", v: ddOf(x.g), color: x.color, w: 1.2, tipFmt: pf })).concat([
        { name: NAME + " drawdown", v: ddOf(m), color: css("--wave"), w: 1.6, area: true, tipFmt: pf }]) },
      { h: 190, title: "Exposure, % of account equity", fmt: (v) => v.toFixed(0).replace("-", "−") + "%", zero: true, min: LO ? 0 : -100, max: 150, tickStep: 50, series: [
        { name: "Exposure", v: sl(D.net_close ? "net_close" : "net"), color: css("--wave"), w: lw * 1.6, step: true, area: true, tipFmt: (v) => pct(v) }] },
    ], { yearTicks: yrs > 2.5, yearEvery: yrs > 14 ? 4 : yrs > 7 ? 2 : 1, dayTicks: dates.length <= 30, axisAfter: 1, label: [NAME].concat(bms.map((x) => x.name)).join(" vs "),
      live: dates[0] < SHARED ? SHARED : null, markLabels: ["Live on X (long only)", ""],
      onBrush: (a, b) => perfSet({ zoom: [dates[a], dates[b]] }) });
  };
  draw();
  PERF.subs.push(draw);
  document.querySelectorAll(".zoom-reset").forEach((b) => b.addEventListener("click", () => perfSet({ zoom: null })));
  document.querySelectorAll("#seg button").forEach((bt) => bt.addEventListener("click", () => {
    bt.setAttribute("aria-pressed", bt.getAttribute("aria-pressed") !== "true"); st.bs = benchOn("#seg"); draw();
  }));
  document.querySelectorAll("#ranges button").forEach((bt) => bt.addEventListener("click", () => perfSet({ r: bt.dataset.r, zoom: null })));
}

function renderPerformance(root) {
  root.innerHTML = `
  <div class="record perf-top">
    <div class="bar-head"><h1 class="h2 perf-h1">Performance</h1><div class="bar-tools">${modeBar()}${benchBtns("seg")}</div></div>
    <p class="note x-note">${LO ? `Long only: the version shared on ${xLink("X")} since ${sharedLong()}, with every short signal held in cash.` : `Long/short: the full model. Its long-only version has been shared on ${xLink("X")} since ${sharedLong()}.`}</p>
    <div class="range-bar">${rangeBtns("ranges", "X")}
      <span class="zoom-hint">Drag across the chart to zoom in</span><button class="zoom-reset" id="zoom-reset" hidden>Reset zoom</button></div>
    <div class="row" id="row"></div>
    <div class="chart" id="chart"></div>
    
  </div>
  <div class="record keynums">
    <div class="bar-head"><h2 class="h2">Key numbers</h2>${benchBtns("kn-seg")}</div>
    <div class="range-bar">${rangeBtns("kn-ranges", "X")}<button class="zoom-reset" id="kn-zoom-reset" hidden>Reset zoom</button></div>
    <div class="scroll" id="keynums" style="margin-top:18px"></div>
  </div>
  <div class="record" style="margin-top:56px">
    <div class="bar-head"><div><p class="kicker">Every year</p><h2 class="h2">Year by year</h2></div>${benchBtns("yr-seg")}</div>
    <div class="scroll" id="years" style="margin-top:18px"></div>
  </div>
  <p class="note" id="costs-note"></p>
  <p class="more" style="margin-top:44px"><a href="archive.html">Archive →</a> &nbsp; <a href="data/optex_history.csv" download>Download the full history (CSV) →</a></p>`;
  record();
  keySection();
  document.getElementById("costs-note").textContent = "Returns are QQQ's total return, dividends included, times the position held, with no trading costs, borrowing costs or interest on cash. The S&P 500 includes dividends.";
}
async function keySection() {
  const D = await fullDaily(), st = PERF;
  const draw = () => {
    let i0 = st.r === "ALL" ? 0 : windowStart(D.dates, st.r), i1 = D.dates.length;
    if (st.zoom) { i0 = Math.max(0, D.dates.indexOf(st.zoom[0]) - 1); i1 = D.dates.indexOf(st.zoom[1]) + 1; }
    const bs = benchOn("#kn-seg"), sl = (a) => a.slice(i0 + 1, i1);
    const d = sl(D.dates), cols = [{ name: NAME, r: sl(D.model) }].concat(bs.map((b) => ({ name: BENCH[b][0], r: sl(D[b]) })));
    document.getElementById("keynums").innerHTML = keyTable(d, cols);
  };
  draw();
  PERF.subs.push(draw);
  document.querySelectorAll("#kn-seg button").forEach((bt) => bt.addEventListener("click", () => { bt.setAttribute("aria-pressed", bt.getAttribute("aria-pressed") !== "true"); draw(); }));
  document.querySelectorAll("#kn-ranges button").forEach((bt) => bt.addEventListener("click", () => perfSet({ r: bt.dataset.r, zoom: null })));
  const Y = {}, F = ["model", "spx", "qqq"];
  D.dates.forEach((dt, i) => {
    const y = dt.slice(0, 4), o = (Y[y] = Y[y] || Object.fromEntries(F.map((f) => [f, [1, 1, 0]])));
    F.forEach((f) => { const a = o[f]; a[0] *= 1 + D[f][i] / 100; a[1] = Math.max(a[1], a[0]); a[2] = Math.min(a[2], a[0] / a[1] - 1); });
  });
  const ly = D.dates[D.dates.length - 1].slice(0, 4), P = (x) => pct(x * 100, 1);
  const years = () => {
    const bs = benchOn("#yr-seg"), nm = (b) => BENCH[b][0].replace("&", "&amp;");
    document.getElementById("years").innerHTML = `<table class="quant yrs-t"><tr><th class="l">Year</th><th>${NAME}</th>${bs.map((b) => `<th>${nm(b)}</th>`).join("")}<th title="Largest fall from a high within the year">${NAME} max drawdown</th>${bs.map((b) => `<th>${nm(b)} max drawdown</th>`).join("")}</tr>`
      + Object.keys(Y).sort().reverse().map((y) => { const o = Y[y];
        return `<tr><td class="l">${y}${y === ly ? " (YTD)" : ""}</td><td class="${tone(o.model[0] - 1)}"><b>${P(o.model[0] - 1)}</b></td>${bs.map((b) => `<td class="${tone(o[b][0] - 1)}">${P(o[b][0] - 1)}</td>`).join("")}<td>${P(o.model[2])}</td>${bs.map((b) => `<td>${P(o[b][2])}</td>`).join("")}</tr>`; }).join("") + `</table>`;
  };
  years();
  document.querySelectorAll("#yr-seg button").forEach((bt) => bt.addEventListener("click", () => { bt.setAttribute("aria-pressed", bt.getAttribute("aria-pressed") !== "true"); years(); }));
}

/* ---------- landing page ---------- */
async function renderLanding() {
  try { await landing(); } finally { const el = location.hash && document.querySelector(location.hash); if (el) el.scrollIntoView(); }
}
async function landing() {
  const [h, D, s] = await Promise.all([loadJSON("data/history.json"), fullDaily(), loadJSON("data/latest.json").catch(() => null)]);
  const years = calendarYears(D);
  // headline numbers: since the model was first shared on X
  const k0 = D.dates.findIndex((d) => d >= SHARED), yrsX = (D.dates.length - 1 - k0) / 252;
  const run = (f) => { let g = 1, pk = 1, m = 0; for (let i = k0 + 1; i < D.dates.length; i++) { g *= 1 + D[f][i] / 100; pk = Math.max(pk, g); m = Math.min(m, g / pk - 1); } return { g, ann: (g ** (1 / yrsX) - 1) * 100, dd: m * 100 }; };
  const M = run("model"), Q = run("qqq"), usd = (g) => "$" + Math.round(10000 * g).toLocaleString("en-US");
  const since = day(SHARED, { day: "numeric", month: "short", year: "numeric" });
  document.getElementById("stats").innerHTML = [
    [pct(M.ann, 1, false), "annual return", `QQQ ${pct(Q.ann, 1, false)}`],
    [pct(M.dd, 1), "worst fall, peak to trough", `QQQ ${pct(Q.dd, 1)}`],
    [usd(M.g), "growth of $10,000", `QQQ ${usd(Q.g)}`],
  ].map(([v, l, b]) => `<div><div class="v">${v}</div><div class="l">${l}</div><div class="b">${b}</div></div>`).join("");
  document.getElementById("stats-note").innerHTML = `${LO ? `Long only, as shared on ${xLink("X")} since ${sharedLong()}.` : `Long/short, since ${sharedLong()}, when the long-only signals were first posted live on ${xLink("X")}.`} To the close on ${day(D.dates[D.dates.length - 1], { day: "numeric", month: "long", year: "numeric" })}.`;
  const e = LO ? h.exposure_lo : h.exposure;
  const mixEl = document.getElementById("mix");
  if (mixEl) mixEl.innerHTML = [
    [e.days_long, "of days long", "the default: QQQ rises more often than it falls"],
    ...(LO ? [] : [[e.days_short, "of days short", "only when the market is weak and volatile"]]),
    [e.days_flat, "of days on the sidelines", LO ? "including every day the long/short version is short" : "when there is no edge either way"],
  ].map(([v, l, b]) => `<div><div class="v">${Math.round(v)}%</div><div class="l">${l}</div><div class="b">${b}</div></div>`).join("");
  document.querySelectorAll(".mode-slot").forEach((el) => (el.innerHTML = modeBar()));

  document.getElementById("crash").innerHTML = `<div class="crash-head"><span></span><span>QQQ</span><span>${NAME}</span><span>Its deepest dip</span></div>` +
    h.crashes.map((c) => {
      const a = D.dates.findIndex((d) => d >= c.from), b = D.dates.findLastIndex((d) => d <= c.to);
      let g = 1, pk = 1, dip = 0; for (let i = a + 1; i <= b; i++) { g *= 1 + D.model[i] / 100; pk = Math.max(pk, g); dip = Math.min(dip, g / pk - 1, g - 1); }
      return { ...c, model: (g - 1) * 100, dip: dip * 100 }; }).map((c) => `<div class="crash-row">
      <div class="crash-name"><b>${c.name}</b><span>${day(c.from, { month: "short", year: "numeric" })} – ${day(c.to, { month: "short", year: "numeric" })}</span></div>
      <div class="crash-v down" data-l="QQQ">${pct(c.qqq, 0)}</div>
      <div class="crash-v ${tone(c.model)}" data-l="${NAME}">${pct(c.model, 0)}</div>
      <div class="crash-dip" data-l="Deepest dip">${pct(c.dip, 0)}</div></div>`).join("");

  const ly = +D.dates[D.dates.length - 1].slice(0, 4);
  document.getElementById("years").innerHTML = years.map((y) => `<div><div class="y">${y.year}${y.year === ly ? " YTD" : ""}</div><div class="m ${tone(y.model)}">${pct(y.model)}</div><div class="b ${y.qqq < 0 ? "down" : ""}">QQQ ${pct(y.qqq)}</div></div>`).join("");

  const k = D.dates.findIndex((d) => d >= SHARED);
  const grow = (r) => { let g = 100; return r.slice(k).map((x, i) => (i ? (g *= 1 + x / 100) : g)); };
  const heroChart = () => timeChart(document.getElementById("hero-chart"), D.dates.slice(k), [
    { h: 370, fmt: (v) => v.toFixed(0), series: [
      { name: "QQQ", v: grow(D.qqq), color: css("--ink-3"), w: 1.6, tipFmt: (v) => pct(v - 100, 0) },
      { name: NAME, v: grow(D.model), color: css("--wave"), w: 2.6, wash: 0.1, tipFmt: (v) => pct(v - 100, 0) }] },
  ], { yearTicks: true, yearEvery: 1, label: NAME + " vs QQQ since 10 October 2023" });
  heroChart();
  let narrow = innerWidth < 600;
  addEventListener("resize", () => { if ((innerWidth < 600) !== narrow) { narrow = innerWidth < 600; heroChart(); } });
}


/* ---------- how it works: three markets, fixed snapshots (always the long/short model) ---------- */
// Each strategy's figure is its gain or loss as a share of the whole model, weighted by the model's value on the day,
// so the three add up exactly to the model's return over the period.
const EXAMPLES = [
  { lead: "lt", name: "Bull markets", eg: "October 2023 to July 2024", from: "2023-10-10", to: "2024-07-10",
    text: "Long, steady advances are where QQQ makes most of its gains, and the long-term strategy is built to ride them, holding long exposure to capture the market's upward drift. The tactical strategy scales extra exposure in and out with the natural ebb and flow of prices, while the short side strategy stays out of the way." },
  { lead: "short", name: "Bear markets", eg: "the 2022 bear market", from: "2022-01-03", to: "2022-10-13",
    text: "Slow, grinding bear markets wear investors down with sharp rallies and renewed sell-offs. Once the market turns fragile, the long-term strategy steps aside and stays out until conditions improve. The short side strategy fades the rallies that fail, while the tactical strategy trades the sharp bounces in between, so the model can make money in both directions while buy-and-hold investors sit through the losses." },
  { lead: "short", name: "Crashes", eg: "the 2020 Covid crash", from: "2020-02-19", to: "2020-03-23",
    text: "Crashes happen in fragile markets, with prices falling faster than most investors can react. By design, the spike in volatility shifts the model's focus to its two faster strategies. The short side strategy profits from the collapse, while the tactical strategy trades the sharp relief rallies along the way." },

];
async function renderExamples(root) {
  const D = await loadJSON("data/history_daily.json");
  const B = [["lt", "Long-term", "--wave"], ["st", "Tactical", "--opp"], ["short", "Short side", "--kairos"]];
  const E = EXAMPLES.map((x) => {
    const i0 = D.dates.findIndex((d) => d >= x.from), i1 = D.dates.findLastIndex((d) => d <= x.to);
    let g = 1, q = 1; const c = { lt: 0, st: 0, short: 0 }, L = { model: [0], qqq: [0], lt: [0], st: [0], short: [0] };
    const dates = [D.dates[i0 - 1]];
    for (let i = i0; i <= i1; i++) {
      B.forEach(([k]) => (c[k] += (D[k][i] / 100) * (D.qqq[i] / 100) * g));
      g *= 1 + D.model[i] / 100; q *= 1 + D.qqq[i] / 100;
      dates.push(D.dates[i]); L.model.push((g - 1) * 100); L.qqq.push((q - 1) * 100); B.forEach(([k]) => L[k].push(c[k] * 100));
    }
    return { ...x, dates, L, port: (g - 1) * 100, qqq: (q - 1) * 100, c: Object.fromEntries(B.map(([k]) => [k, c[k] * 100])) };
  });
  const top = Math.max(...E.flatMap((e) => B.map(([k]) => Math.abs(e.c[k]))));
  root.innerHTML = E.map((e, j) => `<div class="ex"><div class="ex-head">
    <div><h3>${e.name}</h3><p class="ex-when">Example: ${e.eg}</p><p class="ex-text">${e.text}</p></div>
    <div><div class="ex-top"><div><div class="v ${tone(e.port)}">${pct(e.port, 1)}</div><div class="l">${NAME}, long/short</div></div>
      <div><div class="v sp">${pct(e.qqq, 1)}</div><div class="l">QQQ</div></div></div>
    <p class="ex-bars-h">Share of the model's return</p>
    <div class="ex-bars">${B.map(([k, n, col]) => { const v = e.c[k], w = (Math.abs(v) / top) * 50;
      return `<div class="ex-row${k === e.lead ? " lead" : ""}"><span class="n">${n}</span><span class="track"><i style="background:var(${col});width:${w}%;${v < 0 ? "right:50%" : "left:50%"}"></i></span><span class="pv ${tone(v)}">${pct(v, 1)}</span></div>`; }).join("")}</div></div></div>
    <div class="chart ex-chart" id="ex-chart-${j}"></div></div>`).join("");
  const f = (v) => pct(v, 1);
  E.forEach((e, j) => timeChart(document.getElementById(`ex-chart-${j}`), e.dates, [
    { h: 330, zero: true, fmt: (v) => v.toFixed(0).replace("-", "−") + "%", series: [
      { name: "QQQ", endLabel: "QQQ", v: e.L.qqq, color: css("--ink-3"), w: 2, tipFmt: f },
      ...B.map(([k, n, col]) => ({ name: n, endLabel: n, v: e.L[k], color: css(col), w: 2, tipFmt: f })),
      { name: NAME, endLabel: NAME, v: e.L.model, color: css("--ink"), w: 3, tipFmt: f }] },
  ], { padRight: 110, dayTicks: e.dates.length < 80, label: `${e.name}: model, QQQ and each strategy's share of the return` }));
}
