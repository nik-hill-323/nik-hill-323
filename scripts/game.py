"""Two truths and a hallucination: the game in the profile README.

Each round shows three claims about me. Two are true and link to their source;
one is a hallucination of the kind RAG systems actually produce (a number that
drifted, a swapped entity, a flipped polarity). Visitors guess by opening an
issue titled `guess: r03 B`; .github/workflows/game.yml runs this script, which
replies with the answer and its sources, records the guess, closes the issue
and re-renders the README.

    python scripts/game.py judge     # handle the issue in $GITHUB_EVENT_PATH
    python scripts/game.py advance   # move to the next round (daily cron)
    python scripts/game.py render    # rewrite the README sections only

Everything is deterministic: no model is called and no API key is needed.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

REPO = "nik-hill-323/nik-hill-323"
ROOT = Path(__file__).resolve().parent.parent
ROUNDS = json.loads((ROOT / "game/rounds.json").read_text())
STATE = ROOT / "game/state.json"
SCORES = ROOT / "game/scores.json"
README = ROOT / "README.md"
LETTERS = "ABC"
TITLE = re.compile(r"^\s*guess:\s*r?(\d{1,3})\s+([abc])\s*$", re.I)


def load(path: Path, default):
    return json.loads(path.read_text()) if path.exists() else default


def save(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n")


def claims(n: int) -> list[dict]:
    """Round n's three claims in display order. The fake moves between rounds."""
    r = ROUNDS[n]
    out = [dict(c, fake=False) for c in r["true"]]
    out.insert((n * 2 + 1) % 3, dict(r["fake"], fake=True))
    return out


def fake_letter(n: int) -> str:
    return LETTERS[next(i for i, c in enumerate(claims(n)) if c["fake"])]


# ---------------------------------------------------------------- rendering


def guess_url(n: int, letter: str) -> str:
    body = (
        f"Click **Create** to lock in claim **{letter}** as the hallucination in round {n + 1}. "
        "A GitHub Action replies here in about 30 seconds with the answer and its sources, "
        "then closes the issue.\n\n_Only the title is read. Your first guess each round counts._"
    )
    q = urllib.parse.urlencode({"title": f"guess: r{n + 1:02d} {letter}", "body": body})
    return f"https://github.com/{REPO}/issues/new?{q}"


def badge(letter: str) -> str:
    return f"https://img.shields.io/badge/%E2%96%B6%20{letter}%20is%20made%20up-161b22?style=for-the-badge"


def render_game(state: dict, guesses: list[dict]) -> str:
    n = state["round"]
    this = [g for g in guesses if g["round"] == n]
    rows = "\n".join(
        f'| **{LETTERS[i]}** | {c["text"]} | <a href="{guess_url(n, LETTERS[i])}">'
        f'<img alt="guess {LETTERS[i]}" src="{badge(LETTERS[i])}"></a> |'
        for i, c in enumerate(claims(n))
    )
    if this:
        fooled = sum(not g["correct"] for g in this)
        tally = f"{len(this)} guess{'es' if len(this) != 1 else ''} this round · the hallucination has fooled **{round(100 * fooled / len(this))}%** so far."
    else:
        tally = "No guesses yet this round. Be the first."
    prev = ""
    if state.get("previous") is not None:
        p = state["previous"]
        f = ROUNDS[p]["fake"]
        prev = (
            f"\n\n<details>\n<summary><b>Yesterday's answer</b> · round {p + 1}</summary>\n\n"
            f"**{fake_letter(p)}** was made up ({f['kind']}): _{f['text']}_  \n"
            f"{f['truth']} [source]({f['source']})\n\n</details>"
        )
    return f"**Round {n + 1}** · started {state['started']}\n\n| | claim | |\n|:-:|:--|:-:|\n{rows}\n\n<sub>{tally}</sub>{prev}"


def render_board(guesses: list[dict]) -> str:
    if not guesses:
        return "_The board is empty. Catch today's hallucination to get on it._"
    players: dict[str, list[int]] = {}
    for g in guesses:
        p = players.setdefault(g["user"], [0, 0])
        p[0] += g["correct"]
        p[1] += 1
    top = sorted(players.items(), key=lambda kv: (-kv[1][0], kv[1][1], kv[0].lower()))[:10]
    board = "\n".join(
        f"| {i + 1} | [@{u}](https://github.com/{u}) | {c} | {t} | {round(100 * c / t)}% |"
        for i, (u, (c, t)) in enumerate(top)
    )
    recent = " · ".join(
        f"[@{g['user']}](https://github.com/{g['user']}) {'caught it' if g['correct'] else 'was fooled'}"
        for g in reversed(guesses[-5:])
    )
    caught = sum(g["correct"] for g in guesses)
    return (
        f"**{len(guesses)} guesses** from **{len(players)} players**, "
        f"**{round(100 * caught / len(guesses))}%** caught the hallucination.\n\n"
        f"| # | player | caught | played | accuracy |\n|:-:|:--|--:|--:|--:|\n{board}\n\n"
        f"<sub>Latest: {recent}</sub>"
    )


def splice(text: str, name: str, body: str) -> str:
    pat = re.compile(rf"(<!--{name}:start-->).*?(<!--{name}:end-->)", re.S)
    if not pat.search(text):
        sys.exit(f"README is missing the <!--{name}:start--> / <!--{name}:end--> markers")
    return pat.sub(lambda m: f"{m[1]}\n{body}\n{m[2]}", text)


def render() -> None:
    state = load(STATE, {"round": 0, "started": dt.date.today().isoformat(), "previous": None})
    guesses = load(SCORES, [])
    text = README.read_text()
    text = splice(text, "game", render_game(state, guesses))
    text = splice(text, "board", render_board(guesses))
    README.write_text(text)


# ----------------------------------------------------------------- actions


def advance() -> None:
    state = load(STATE, {"round": -1, "previous": None})
    nxt = (state["round"] + 1) % len(ROUNDS)
    save(STATE, {"round": nxt, "started": dt.date.today().isoformat(), "previous": state["round"] if state["round"] >= 0 else None})
    render()


def github(method: str, path: str, payload: dict) -> None:
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}{path}",
        data=json.dumps(payload).encode(),
        method=method,
        headers={
            "Authorization": f"bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        },
    )
    urllib.request.urlopen(req, timeout=30).close()


def reply(issue: int, body: str) -> None:
    github("POST", f"/issues/{issue}/comments", {"body": body})
    github("PATCH", f"/issues/{issue}", {"state": "closed", "state_reason": "completed"})


def verdict(n: int, letter: str, correct: bool) -> str:
    lines = [
        f"### {'✅ Caught it.' if correct else '❌ Fooled.'} Round {n + 1}: the hallucination was **{fake_letter(n)}**"
        + ("" if correct else f" (you picked {letter})"),
        "",
        "| | claim | verdict |",
        "|:-:|:--|:--|",
    ]
    for i, c in enumerate(claims(n)):
        if c["fake"]:
            v = f"**made up** · {c['kind']}. {c['truth']} [source]({c['source']})"
        else:
            v = f"supported · [source]({c['source']})"
        lines.append(f"| **{LETTERS[i]}** | {c['text']} | {v} |")
    lines += [
        "",
        "These are the failure modes I grade RAG systems for at work: numbers that drift, "
        "entities that get swapped, claims turned backwards, details no source backs up. "
        "You're on the board in the [profile README](https://github.com/nik-hill-323). New round tomorrow.",
    ]
    return "\n".join(lines)


def judge() -> None:
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    issue = event["issue"]
    user = issue["user"]["login"]
    m = TITLE.match(issue["title"])
    if not m or not 1 <= int(m[1]) <= len(ROUNDS):
        reply(issue["number"], "I couldn't read that guess. Titles look like `guess: r03 B`; use the buttons on the [profile](https://github.com/nik-hill-323) to get one prefilled.")
        return
    n, letter = int(m[1]) - 1, m[2].upper()
    guesses = load(SCORES, [])
    if any(g["user"] == user and g["round"] == n for g in guesses):
        reply(issue["number"], f"You already played round {n + 1}; only the first guess counts.\n\n" + verdict(n, letter, letter == fake_letter(n)))
        return
    correct = letter == fake_letter(n)
    guesses.append({"user": user, "round": n, "choice": letter, "correct": correct, "at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")})
    save(SCORES, guesses)
    render()
    reply(issue["number"], verdict(n, letter, correct))


if __name__ == "__main__":
    {"judge": judge, "advance": advance, "render": render}[sys.argv[1] if len(sys.argv) > 1 else "render"]()
