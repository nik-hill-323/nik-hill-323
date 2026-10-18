// Things a visitor can see and use without leaving the profile page.
//
// GitHub strips scripts from READMEs, so interaction there means animation
// that plays by itself and <details> that open in place. This renders both
// from the real retrieval in site/rag.js:
//
//   ask-demo-dark.svg / ask-demo-light.svg  an animated terminal that asks my
//                                           profile questions and shows the
//                                           cited answers (and one abstention)
//   README <!--faq:start--> block           questions that expand to their
//                                           real cited answers
//
// Run `node scripts/readme_live.mjs` after editing game/corpus.json.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildIndex, ask } from "../site/rag.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const index = buildIndex(JSON.parse(fs.readFileSync(path.join(ROOT, "game/corpus.json"), "utf8")))

const DEMO = [
  "what do you work on right now?",
  "have you shipped RAG in production?",
  "what's your favorite pizza?",
  "which languages did the evaluation cover?",
]
const FAQ = [
  "what do you work on right now?",
  "have you shipped RAG in production?",
  "which languages did the evaluation cover?",
  "have you used Airflow?",
  "computer vision experience?",
  "are you open to work?",
  "what's your favorite pizza?",
]

const THEMES = {
  dark: { bg: "#0d1117", panel: "#161b22", border: "#30363d", text: "#e6edf3", muted: "#8b949e", blue: "#58a6ff", green: "#3fb950", red: "#f85149", amber: "#d29922" },
  light: { bg: "#ffffff", panel: "#f6f8fa", border: "#d0d7de", text: "#1f2328", muted: "#57606a", blue: "#0969da", green: "#1a7f37", red: "#cf222e", amber: "#9a6700" },
}

const W = 1200
const SCENE = 8 // seconds per question
const LOOP = SCENE * DEMO.length
const CH = 8.4 // width of one 14px monospace character
const X0 = 28, COL = X0 + 10 * CH, LINE0 = 82, LH = 24, WRAP = 112
const H = LINE0 + 8 * LH

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function wrap(text, width = WRAP) {
  const out = [""]
  for (const word of text.split(" ")) {
    const cur = out[out.length - 1]
    if (cur && cur.length + word.length + 1 > width) out.push(word)
    else out[out.length - 1] = cur ? `${cur} ${word}` : word
  }
  return out
}

// SMIL values/keyTimes from (second, value) pairs over the whole loop
function kt(pairs) {
  const pts = [[0, pairs[0][1]], ...pairs, [LOOP, pairs[pairs.length - 1][1]]]
  return `values="${pts.map((p) => p[1]).join(";")}" keyTimes="${pts.map((p) => (Math.min(Math.max(p[0] / LOOP, 0), 1)).toFixed(4)).join(";")}" dur="${LOOP}s" repeatCount="indefinite"`
}

function sceneLines(q) {
  const r = ask(index, q)
  const best = r.ranked[0]
  const lines = [{ label: "retrieve", text: `${index.units.length} sentences scored · best ${best ? best.score.toFixed(2) : "0"} (abstain below ${r.tau.toFixed(1)}) · coverage ${best ? Math.round(best.coverage * 100) : 0}%`, col: "muted" }]
  if (r.abstain) {
    wrap(r.reason).forEach((t, i) => lines.push({ label: i ? "" : "abstain", text: t, col: "red" }))
    lines.push({ label: "", text: "nothing in my sources supports an answer, so it says so instead of guessing", col: "muted" })
  } else {
    const shown = r.answer.slice(0, 2)
    for (const a of shown) wrap(`${a.text} [${a.cite}]`).forEach((t, i) => lines.push({ label: lines.length === 1 && !i ? "answer" : "", text: t, col: "text" }))
    // list only the sources the shown sentences cite
    r.sources.forEach((d, i) => { if (shown.some((a) => a.cite === i + 1)) lines.push({ label: lines.at(-1).col === "blue" ? "" : "sources", text: `[${i + 1}] ${d.title}`, col: "blue" }) })
  }
  return lines.slice(0, 8)
}

function renderDemo(c) {
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14">`,
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${c.panel}" stroke="${c.border}"/>`,
    `<path d="M0 40H${W}" stroke="${c.border}"/>`,
    ...[c.red, c.amber, c.green].map((f, i) => `<circle cx="${22 + i * 18}" cy="20" r="6" fill="${f}"/>`),
    `<text x="${W / 2}" y="25" text-anchor="middle" font-size="12" fill="${c.muted}">ask my profile · live answers, quoted from my work with citations</text>`,
  ]
  // progress dots, one per question
  DEMO.forEach((_, s) => {
    const on = s * SCENE, off = on + SCENE
    out.push(`<circle cx="${W - 30 - (DEMO.length - 1 - s) * 16}" cy="20" r="4" fill="${c.blue}" opacity="${s ? 0.25 : 1}"><animate attributeName="opacity" ${kt([[on, 0.25], [on + 0.01, 1], [off - 0.01, 1], [off, 0.25]])}/></circle>`)
  })
  DEMO.forEach((q, s) => {
    const t0 = s * SCENE
    const end = t0 + SCENE - 0.5
    const show = (t) => `<animate attributeName="opacity" ${kt([[t, 0], [t + 0.15, 1], [end, 1], [end + 0.3, 0]])}/>`
    const base = s === 0 ? 1 : 0 // still renderers show the first question, answered
    const g = [`<g opacity="${base}">${show(t0)}`]
    // the question, typed
    const cmd = `ask "${q}"`
    const typed = t0 + 0.3 + cmd.length / 26
    const x = X0 + 2 * CH
    g.push(`<text x="${X0}" y="${LINE0}" fill="${c.green}">$</text>`)
    g.push(`<clipPath id="q${s}"><rect x="${x}" y="${LINE0 - 16}" width="${W}" height="22"><animate attributeName="width" ${kt([[t0 + 0.3, 0], [typed, cmd.length * CH], [typed + 0.01, W]])}/></rect></clipPath>`)
    g.push(`<text x="${x}" y="${LINE0}" fill="${c.text}" clip-path="url(#q${s})">${esc(cmd)}</text>`)
    g.push(`<rect x="${x}" y="${LINE0 - 13}" width="8" height="16" fill="${c.text}" opacity="0"><animate attributeName="x" ${kt([[t0 + 0.3, x], [typed, x + cmd.length * CH]])}/><animate attributeName="opacity" ${kt([[t0 + 0.3, 0], [t0 + 0.31, 0.8], [typed, 0.8], [typed + 0.01, 0]])}/></rect>`)
    sceneLines(q).forEach((l, i) => {
      const t = typed + 0.5 + i * 0.3
      const y = LINE0 + (i + 1) * LH + 6
      g.push(`<g opacity="${base}">${show(t)}`)
      if (l.label) g.push(`<text x="${X0}" y="${y}" fill="${l.col === "red" ? c.red : c.blue}" font-weight="700">${l.label}</text>`)
      g.push(`<text x="${COL}" y="${y}" fill="${c[l.col]}">${esc(l.text)}</text></g>`)
    })
    g.push("</g>")
    out.push(g.join(""))
  })
  out.push("</svg>")
  return out.join("\n") + "\n"
}

function renderFaq() {
  return FAQ.map((q) => {
    const r = ask(index, q)
    const best = r.ranked[0]
    const score = `BM25 ${best ? best.score.toFixed(2) : "0"} · coverage ${best ? Math.round(best.coverage * 100) : 0}%`
    const body = r.abstain
      ? `**🤷 Abstained.** ${r.reason}\n\n<sub>${score}. A system for clinicians has to be able to say "I don't know".</sub>`
      : r.answer.map((a) => `> ${a.text} **[${a.cite}]**`).join("\n>\n") +
        `\n\n<sub>${r.sources.map((d, i) => `[${i + 1}] <a href="${d.url}">${d.title}</a>`).join(" · ")} · ${score}</sub>`
    return `<details>\n<summary><b>${esc(q)}</b></summary>\n\n${body}\n\n</details>`
  }).join("\n")
}

for (const [name, theme] of Object.entries(THEMES)) fs.writeFileSync(path.join(ROOT, `ask-demo-${name}.svg`), renderDemo(theme))

const readme = path.join(ROOT, "README.md")
const text = fs.readFileSync(readme, "utf8")
const re = /(<!--faq:start-->)[\s\S]*?(<!--faq:end-->)/
if (!re.test(text)) throw new Error("README is missing the <!--faq:start--> / <!--faq:end--> markers")
fs.writeFileSync(readme, text.replace(re, (_, a, b) => `${a}\n${renderFaq()}\n${b}`))
