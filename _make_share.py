"""optexmodel.com share card (share.png): OPTEX wordmark over the How it works lines (stylized Oct 2008 - Sep 2009).
Run from this folder: python _make_share.py"""
import json, math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
H_ = json.load(open("data/history_daily.json"))
dates = H_["dates"]
i0 = next(i for i, d in enumerate(dates) if d >= "2008-10-01"); i1 = max(i for i, d in enumerate(dates) if d <= "2009-09-30")
g = 1.0; L = {"core": [0.0], "compass": [0.0]}; c = {"core": 0.0, "compass": 0.0}
for i in range(i0, i1 + 1):
    for k in c:
        c[k] += H_[k][i] / 100 * g; L[k].append(c[k] * 100)
    g *= 1 + H_["model"][i] / 100
n = len(L["core"]); T = lambda i: i / (n - 1)
def contra(i):
    t = T(i); r = min(t / 0.16, 1); u = max(t - 0.16, 0)
    return 27 * (1 - (1 - r) ** 2) + (4.5 * math.sin(2 * math.pi * u / 0.23) + 2 * math.sin(2 * math.pi * u / 0.09 + 1.3)) * math.exp(-u * 0.8) * min(u / 0.04, 1) + 3 * u
L["contrarian"] = [contra(i) for i in range(n)]
L["compass"] = [v - 7 * math.exp(-(((T(i) - 0.13) / 0.07) ** 2)) - 11 * T(i) ** 2.5 for i, v in enumerate(L["compass"])]
L["core"] = [v + 10 * T(i) ** 2 for i, v in enumerate(L["core"])]
L["model"] = [a + b + cc for a, b, cc in zip(L["core"], L["contrarian"], L["compass"])]
def sm(v, w=6):
    out = []
    for i in range(len(v)):
        k = min(w, i, len(v) - 1 - i); a = v[i - k:i + k + 1]; out.append(sum(a) / len(a))
    return out
fig = plt.figure(figsize=(12, 6.3), dpi=100); fig.patch.set_facecolor("white")
ax = fig.add_axes([0.05, 0.06, 0.9, 0.52]); ax.axis("off"); ax.set_xlim(0, n - 1); ax.set_ylim(-20, 80)
ax.axhline(0, color="#1b1a17", alpha=.12, lw=1.2)
for k, col, a, w in [("compass", "#9a5cc6", .6, 3.2), ("core", "#2b5c9e", .6, 3.2), ("contrarian", "#a8861f", .85, 3.2), ("model", "#1b1a17", .92, 8)]:
    ax.plot(range(n), sm(L[k]), color=col, alpha=a, lw=w, solid_capstyle="round", solid_joinstyle="round")
serif = fm.FontProperties(fname="C:/Windows/Fonts/georgiab.ttf")
sans = fm.FontProperties(fname="C:/Windows/Fonts/arial.ttf")
fig.text(0.5, 0.80, "OPTEX", ha="center", va="center", fontproperties=serif, fontsize=56, color="#1b1a17")
fig.text(0.5, 0.67, "All-weather stock portfolio", ha="center", va="center", fontproperties=sans, fontsize=22, color="#6e6b64")
fig.savefig("share.png", dpi=100, facecolor="white")
print("ok")
