"""Render stats-dark.svg and stats-light.svg from the GitHub GraphQL API.

Runs in GitHub Actions once a day (see .github/workflows/stats.yml) and can be
run locally with `GITHUB_TOKEN=$(gh auth token) python scripts/build_stats.py`.
No third-party widget service involved, so nothing here rate-limits or 503s.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import sys
import urllib.request

LOGIN = "nik-hill-323"
QUERY = """
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}
"""


def fetch(token: str) -> dict:
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": QUERY, "variables": {"login": LOGIN}}).encode(),
        headers={"Authorization": f"bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        payload = json.load(r)
    if "errors" in payload:
        sys.exit(payload["errors"])
    return payload["data"]["user"]


def summarise(user: dict) -> dict:
    cc = user["contributionsCollection"]
    weeks = cc["contributionCalendar"]["weeks"]
    weekly = [sum(d["contributionCount"] for d in w["contributionDays"]) for w in weeks][-26:]
    days = [d for w in weeks for d in w["contributionDays"]]
    # current streak, counting back from today (or yesterday, if today is empty so far)
    streak = 0
    for d in reversed(days):
        if d["contributionCount"] > 0:
            streak += 1
        elif streak or d["date"] != days[-1]["date"]:
            break
    langs: dict[str, tuple[int, str]] = {}
    stars = 0
    skip = {"HTML", "Jupyter Notebook", "CSS"}
    for repo in user["repositories"]["nodes"]:
        stars += repo["stargazerCount"]
        for e in repo["languages"]["edges"]:
            name = e["node"]["name"]
            if name in skip:
                continue
            size, color = langs.get(name, (0, e["node"]["color"] or "#8b949e"))
            langs[name] = (size + e["size"], color)
    top = sorted(langs.items(), key=lambda kv: -kv[1][0])[:6]
    total = sum(s for _, (s, _) in top) or 1
    return {
        "contributions": cc["contributionCalendar"]["totalContributions"] + cc["restrictedContributionsCount"],
        "commits": cc["totalCommitContributions"],
        "repos": user["repositories"]["totalCount"],
        "stars": stars,
        "streak": streak,
        "weekly": weekly,
        "langs": [(n, s / total, c) for n, (s, c) in top],
        "updated": dt.date.today().isoformat(),
    }


def render(s: dict, bg: str, fg: str, muted: str, line: str, accent: str) -> str:
    w, h = 900, 230
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
        'font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">',
        f'<rect width="{w}" height="{h}" rx="14" fill="{bg}"/>',
        f'<text x="28" y="36" font-size="13" fill="{muted}">$ github stats · last 12 months · updated {s["updated"]}</text>',
    ]
    # numbers
    numbers = [
        ("contributions", s["contributions"]),
        ("commits", s["commits"]),
        ("public repos", s["repos"]),
        ("stars", s["stars"]),
        ("day streak", s["streak"]),
    ]
    for i, (label, value) in enumerate(numbers):
        y = 78 + i * 30
        out.append(f'<text x="28" y="{y}" font-size="22" font-weight="700" fill="{fg}">{value:,}</text>')
        out.append(f'<text x="110" y="{y}" font-size="13" fill="{muted}">{label}</text>')
    # languages
    out.append(f'<text x="300" y="66" font-size="13" fill="{muted}">languages, by bytes in public repos</text>')
    for i, (name, frac, color) in enumerate(s["langs"]):
        y = 84 + i * 24
        out.append(f'<text x="300" y="{y + 11}" font-size="13" fill="{fg}">{name}</text>')
        out.append(f'<rect x="420" y="{y}" width="160" height="12" rx="6" fill="{line}"/>')
        out.append(f'<rect x="420" y="{y}" width="{max(4, int(160 * frac))}" height="12" rx="6" fill="{color}"/>')
        out.append(f'<text x="590" y="{y + 11}" font-size="12" fill="{muted}">{frac:.0%}</text>')
    # sparkline of weekly contributions
    out.append(f'<text x="660" y="66" font-size="13" fill="{muted}">contributions per week, last 26</text>')
    weekly = s["weekly"]
    peak = max(weekly) or 1
    x0, base, bw, hmax = 660, 200, 8, 100
    for i, v in enumerate(weekly):
        bh = max(2, int(hmax * v / peak))
        fill = accent if v else line
        out.append(f'<rect x="{x0 + i * (bw + 1)}" y="{base - bh}" width="{bw}" height="{bh}" rx="2" fill="{fill}"/>')
    out.append(f'<text x="660" y="220" font-size="11" fill="{muted}">peak week: {peak}</text>')
    out.append("</svg>")
    return "\n".join(out)


def main() -> None:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        sys.exit("set GITHUB_TOKEN")
    s = summarise(fetch(token))
    open("stats-dark.svg", "w").write(render(s, "#0d1117", "#e6edf3", "#8b949e", "#21262d", "#3fb950"))
    open("stats-light.svg", "w").write(render(s, "#ffffff", "#1f2328", "#57606a", "#eaeef2", "#1a7f37"))
    print(json.dumps({k: v for k, v in s.items() if k != "weekly"}, indent=2))


if __name__ == "__main__":
    main()
