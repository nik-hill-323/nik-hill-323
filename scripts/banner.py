"""Render banner-dark.svg and banner-light.svg: an animated medrag + ragcheck run.

A question is typed into a terminal, three sources are retrieved, the answer
streams in with citations, one unsupported sentence is struck out and dropped,
and ragcheck gates the result. The pipeline on the right lights up in step.

Pure SVG with SMIL animation, so it plays inside a GitHub README with no
script and no third-party service. Renderers that don't animate show the
finished run. Regenerate with `python scripts/banner.py` after editing.
"""

from __future__ import annotations

import re
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 440
LOOP = 15.0  # seconds
HOLD = 13.6  # everything fades out from here, then the loop restarts
CH = 7.8  # approximate width of one 13px monospace character

THEMES = {
    "dark": dict(bg="#0d1117", panel="#161b22", grid="#21262d", border="#30363d", text="#e6edf3",
                 muted="#8b949e", blue="#58a6ff", green="#3fb950", red="#f85149", amber="#d29922",
                 blue_bg="#0d2342", green_bg="#0f2d18"),
    "light": dict(bg="#ffffff", panel="#f6f8fa", grid="#eaeef2", border="#d0d7de", text="#1f2328",
                  muted="#57606a", blue="#0969da", green="#1a7f37", red="#cf222e", amber="#9a6700",
                  blue_bg="#ddf4ff", green_bg="#dafbe1"),
}

# terminal lines: (start second, label, text, colour key, typed?)
TX, TY = 60, 150  # terminal origin
COL1, COL2 = TX + 22, TX + 22 + 11 * CH
LINE0, LH = TY + 58, 22
LINES = [
    (0.3, "$", 'medrag ask "max daily acetaminophen dose for adults?"', "text", True),
    (2.6, "retrieve", "openfda/acetaminophen-label §dosage      0.91", "muted", False),
    (3.0, "", "pubmed/hepatotoxicity-review              0.84", "muted", False),
    (3.4, "", "rxnorm/acetaminophen                      0.77", "muted", False),
    (4.4, "answer", "Adults: at most 4,000 mg in 24 hours. [1]", "text", True),
    (5.8, "", "Liver risk rises above that, and with heavy alcohol use. [1][2]", "text", True),
    (7.2, "", "It is the most prescribed drug in the U.S.", "text", True),
    (9.4, "ragcheck", "faithfulness 1.00 · citations 2/2 · 1 claim dropped", "green", False),
    (10.8, "gate", "✓ pass (threshold 0.95) → ship", "green", False),
]
DROP_AT = 8.4  # the uncited sentence is flagged and struck out
TYPE_CPS = 30  # typed characters per second

# pipeline stages on the right: (label, detail, colour key, lit from, lit until)
STAGES = [
    ("retrieve", "PubMed · FDA labels · RxNorm", "blue", 2.4, 4.3),
    ("ground", "cite every sentence, or abstain", "blue", 4.3, 9.3),
    ("evaluate", "faithfulness · citation coverage", "green", 9.3, 10.7),
    ("decide", "gate the release on the score", "green", 10.7, HOLD),
]


def kt(*pairs: tuple[float, float]) -> str:
    """SMIL values/keyTimes attributes from (second, value) pairs over one loop."""
    pts = [(0.0, pairs[0][1])] + list(pairs) + [(LOOP, pairs[-1][1])]
    times = ";".join(f"{min(max(t / LOOP, 0), 1):.4f}" for t, _ in pts)
    values = ";".join(f"{v:g}" for _, v in pts)
    return f'values="{values}" keyTimes="{times}" dur="{LOOP}s" repeatCount="indefinite"'


def appear(start: float, until: float = HOLD, fade: float = 0.2) -> str:
    return f'<animate attributeName="opacity" {kt((start, 0), (start + fade, 1), (until, 1), (until + 0.4, 0))}/>'


def text(x: float, y: float, s: str, fill: str, size: int = 13, extra: str = "") -> str:
    return f'<text x="{x:g}" y="{y:g}" font-size="{size}" fill="{fill}" {extra}>{escape(s)}</text>'


def render(c: dict) -> str:
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
        'font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">',
        f'<rect width="{W}" height="{H}" rx="16" fill="{c["bg"]}"/>',
        f'<g stroke="{c["grid"]}" stroke-width="1" opacity="0.5">'
        + "".join(f'<path d="M{x} 0V{H}"/>' for x in range(40, W, 40))
        + "".join(f'<path d="M0 {y}H{W}"/>' for y in range(40, H, 40))
        + "</g>",
        text(60, 84, "Nikhil Obuleni", c["text"], 44,
             'font-weight="700" font-family="-apple-system, \'Segoe UI\', Helvetica, Arial, sans-serif"'),
        text(60, 118, "AI research engineer · clinical and global-health LLM systems · Washington, DC", c["muted"], 17),
    ]

    # terminal window
    tw, th = 700, 262
    out += [
        f'<rect x="{TX}" y="{TY}" width="{tw}" height="{th}" rx="10" fill="{c["panel"]}" stroke="{c["border"]}"/>',
        f'<path d="M{TX} {TY + 30}H{TX + tw}" stroke="{c["border"]}"/>',
        *(f'<circle cx="{TX + 18 + i * 16}" cy="{TY + 15}" r="5" fill="{col}"/>'
          for i, col in enumerate([c["red"], c["amber"], c["green"]])),
        text(TX + tw / 2, TY + 20, "medrag-toolkit · ragcheck", c["muted"], 12, 'text-anchor="middle"'),
    ]
    for i, (start, label, body, col, typed) in enumerate(LINES):
        y = LINE0 + i * LH
        fill = c["green"] if col == "green" else c[col]
        g = [f'<g opacity="1">{appear(start)}']
        if label:
            g.append(text(COL1, y, label, c["blue"] if label != "$" else c["green"], extra='font-weight="700"'))
        x = COL1 + 2 * CH if label == "$" else COL2
        if typed:
            done = start + len(body) / TYPE_CPS
            full = W - x
            g.append(
                f'<clipPath id="t{i}"><rect x="{x:g}" y="{y - 14}" width="{full:g}" height="20">'
                f'<animate attributeName="width" {kt((start, 0), (done, len(body) * CH), (done + 0.01, full))}/>'
                "</rect></clipPath>"
            )
            g.append(f'<g clip-path="url(#t{i})">{text(x, y, body, fill)}</g>')
            # block cursor that rides the end of the typed text, visible only while typing
            g.append(
                f'<rect x="{x:g}" y="{y - 12}" width="8" height="15" fill="{c["text"]}" opacity="0">'
                f'<animate attributeName="x" {kt((start, x), (done, x + len(body) * CH))}/>'
                f'<animate attributeName="opacity" {kt((start, 0), (start + 0.01, 0.8), (done, 0.8), (done + 0.01, 0))}/>'
                "</rect>"
            )
        elif score := re.search(r"\s{2,}(\S+)$", body):
            # retrieval hits: source left, similarity right-aligned (SVG collapses runs of spaces)
            g.append(text(x, y, body[: score.start()], fill))
            g.append(text(TX + tw - 24, y, score[1], fill, extra='text-anchor="end"'))
        else:
            g.append(text(x, y, body, fill))
        if body.startswith("It is the most prescribed"):
            # flag: red overlay, strike-through, and the verdict tag
            wpx = len(body) * CH
            g.append(f'<g opacity="0">{appear(DROP_AT)}{text(x, y, body, c["red"])}'
                     f'<path d="M{x:g} {y - 4}h{wpx:g}" stroke="{c["red"]}" stroke-width="1.5"/>'
                     f'{text(x + wpx + 14, y, "✗ no source · dropped", c["red"], 12, 'font-weight="700"')}</g>')
        g.append("</g>")
        out.append("".join(g))

    # pipeline stages
    sx, sw, sh, gap = 800, 340, 52, 18
    for i, (label, detail, col, on, off) in enumerate(STAGES):
        y = TY + i * (sh + gap)
        # dot is bright while its stage runs, dimmer once the run has moved on
        dot = [(on, 0.25), (on + 0.2, 1), (off, 1)]
        if off < HOLD:
            dot += [(off + 0.2, 0.45), (HOLD, 0.45)]
        dot.append((HOLD + 0.4, 0.25))
        out += [
            f'<rect x="{sx}" y="{y}" width="{sw}" height="{sh}" rx="10" fill="{c["panel"]}" stroke="{c["border"]}" stroke-width="1.5"/>',
            # lit state: tinted fill and coloured border, final frame shows all stages lit
            f'<rect x="{sx}" y="{y}" width="{sw}" height="{sh}" rx="10" fill="{c[col + "_bg"]}" stroke="{c[col]}" stroke-width="1.5" opacity="1">'
            f'<animate attributeName="opacity" {kt((on, 0), (on + 0.2, 1), (HOLD, 1), (HOLD + 0.4, 0))}/></rect>',
            f'<circle cx="{sx + 22}" cy="{y + sh / 2}" r="5" fill="{c[col]}" opacity="1">'
            f'<animate attributeName="opacity" {kt(*dot)}/></circle>',
            text(sx + 40, y + 22, label, c["text"], 15, 'font-weight="700"'),
            text(sx + 40, y + 40, detail, c["muted"], 12),
        ]
        if i < len(STAGES) - 1:
            out.append(f'<path d="M{sx + 22} {y + sh + 4}v{gap - 8}" stroke="{c["muted"]}" stroke-width="1.5"/>')

    out.append("</svg>")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    for name, theme in THEMES.items():
        (ROOT / f"banner-{name}.svg").write_text(render(theme))
