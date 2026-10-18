import { buildIndex, ask, docSimilarity } from "./rag.js"

const REPO = "nik-hill-323/nik-hill-323"
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`
const $ = (s) => document.querySelector(s)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const KIND_COLOR = { role: "var(--blue)", project: "var(--green)", about: "var(--purple)", education: "var(--amber)", skills: "var(--teal)", contact: "var(--pink)" }

// Live files change on every guess (the Action commits them); the bundled copy is the fallback.
async function load(name, { live = false } = {}) {
  if (live) {
    try {
      const r = await fetch(RAW + "game/" + name, { cache: "no-store" })
      if (r.ok) return await r.json()
    } catch {}
  }
  const r = await fetch("data/" + name)
  return r.ok ? r.json() : null
}

const corpus = await load("corpus.json")
const rounds = await load("rounds.json")
const index = buildIndex(corpus)
const byId = new Map(corpus.map((d) => [d.id, d]))

// ================================================================ retrieval panel

const CHIPS = [
  ["what do you work on right now?"],
  ["have you shipped RAG in production?"],
  ["which languages did the evaluation cover?"],
  ["computer vision experience?"],
  ["are you open to work?"],
  ["what's your favorite pizza?", true],
  ["do you know kubernetes?", true],
]
$("#chips").innerHTML = CHIPS.map(([q, trap]) => `<button class="chip${trap ? " trap" : ""}" data-q="${esc(q)}" title="${trap ? "this one should abstain" : ""}">${esc(q)}</button>`).join("")
$("#chips").addEventListener("click", (e) => {
  const q = e.target.closest(".chip")?.dataset.q
  if (q) {
    $("#ask-input").value = q
    showRetrieval(ask(index, q))
  }
})
$("#ask-form").addEventListener("submit", (e) => {
  e.preventDefault()
  const q = $("#ask-input").value.trim()
  if (q) showRetrieval(ask(index, q))
})

function highlight(text, terms) {
  let html = esc(text)
  for (const t of terms) html = html.replace(new RegExp(`\\b(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*)`, "gi"), "<mark>$1</mark>")
  return html
}

let lastResult = null

function showRetrieval(r) {
  lastResult = r
  const top = r.ranked.slice(0, 7)
  const scale = Math.max(r.tau * 1.25, ...top.map((h) => h.score), 1)
  const dropped = r.question.toLowerCase().match(/[a-z0-9']+/g)?.filter((w) => !r.terms.some((t) => w.replace(/'/g, "").startsWith(t))) || []
  const best = r.ranked[0]
  const stages = [
    `<div class="stage"><h3><b>1</b> · query</h3>
      <div class="terms">${r.terms.map((t) => `<span class="term-chip${r.known.includes(t) ? "" : " unk"}" title="${r.known.includes(t) ? "in the sources" : "never appears in the sources"}">${esc(t)}</span>`).join("") || '<span class="muted">no content words</span>'}</div>
      <p class="small">${dropped.length ? `dropped as filler: ${esc(dropped.slice(0, 8).join(", "))}` : ""}${r.unknown.length ? `<br>struck out: never appears in my sources` : ""}</p></div>`,
    `<div class="stage w3"><h3><b>2</b> · retrieve <span class="muted">· BM25 over ${index.units.length} sentences, top ${top.length}</span></h3>
      <div class="hits">${top.map((h) => `<div class="hit${h.used ? " used" : ""}">
        <div class="meta"><span class="sc">${h.score.toFixed(2)}</span><span class="meter"><span style="width:${(100 * h.score) / scale}%"></span><em style="left:${(100 * r.tau) / scale}%" title="abstain threshold"></em></span><span>${esc(h.unit.doc.title)}</span>${h.used ? '<span class="ok">· quoted</span>' : ""}</div>
        ${highlight(h.unit.text, h.matched)}</div>`).join("") || '<p class="muted">Nothing matched.</p>'}</div>
      <p class="small">Amber tick = abstain threshold (${r.tau.toFixed(1)}). Green = quoted in the answer.</p></div>`,
    r.abstain
      ? `<div class="stage w3 fail"><h3><b>3</b> · ground</h3><p class="abstain">Abstained.</p><p>${esc(r.reason)}</p>
         <p class="small">A system for clinicians has to be able to say "I don't know". This one does.</p></div>`
      : `<div class="stage w3 pass"><h3><b>3</b> · ground <span class="muted">· every sentence quoted from a source</span></h3>
         <div class="answer">${r.answer.map((a) => `<p>${esc(a.text)} <sup><a href="${esc(a.doc.url)}" target="_blank" rel="noopener">[${a.cite}]</a></sup></p>`).join("")}</div>
         <ol class="sources">${r.sources.map((d, i) => `<li>[${i + 1}] <a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.title)}</a></li>`).join("")}</ol></div>`,
    `<div class="stage ${r.abstain ? "fail" : "pass"}"><h3><b>4</b> · verdict</h3>
      <div class="verdict ${r.abstain ? "bad" : "ok"}">${r.abstain ? "✗ abstain" : "✓ answer"}</div>
      <div class="metric"><span>best score</span><span>${best ? best.score.toFixed(2) : "–"} / ${r.tau.toFixed(1)}</span></div>
      <div class="metric"><span>coverage</span><span>${best ? Math.round(best.coverage * 100) : 0}% / ${Math.round(r.minCoverage * 100)}%</span></div>
      <div class="metric"><span>quoted</span><span>${r.answer.length} sentence${r.answer.length === 1 ? "" : "s"}</span></div>
      <div class="metric"><span>faithfulness</span><span>${r.abstain ? "n/a" : "1.00 (extractive)"}</span></div></div>`,
  ]
  $("#stages").innerHTML = stages.join("")
  ;[...$("#stages").children].forEach((el, i) => setTimeout(() => el.classList.add("show"), 120 + i * 260))
  map.highlight(r)
}

// ======================================================================= terminal

const out = $("#term-out")
const input = $("#term-input")
const history = []
let hpos = 0
let demo = true // the boot demo stops as soon as the visitor touches the keyboard

function print(html = "", cls = "") {
  const div = document.createElement("div")
  div.className = "ln " + cls
  div.innerHTML = html
  out.appendChild(div)
  out.scrollTop = out.scrollHeight
}
const row = (k, v) => print(`<span class="k">${esc(k)}</span>${v}`)
const link = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`

const COMMANDS = {
  help: () => {
    const cmds = [
      ["ask <question>", "answer from my sources, with citations (or just type a question)"],
      ["why", "show how the last answer was retrieved"],
      ["whoami", "who I am"],
      ["ls", "list everything the agent knows about"],
      ["cat <name>", "read one source, e.g. cat medrag-toolkit"],
      ["game", "two truths and a hallucination"],
      ["map", "the map of my work"],
      ["contact", "how to reach me"],
      ["resume", "link to my resume"],
      ["clear", "clear the screen"],
    ]
    cmds.forEach(([c, d]) => print(`  <span class="ok">${esc(c.padEnd(16))}</span><span class="dim">${esc(d)}</span>`))
    print(`<span class="dim">  tab completes, ↑/↓ walks history</span>`)
  },
  whoami: () => cat("whoami"),
  contact: () => cat("contact"),
  stack: () => cat("stack"),
  ls: () => {
    const groups = {}
    for (const d of corpus) (groups[d.kind] ??= []).push(d)
    for (const [kind, docs] of Object.entries(groups))
      print(`<span class="k">${esc(kind)}/</span>${docs.map((d) => `<span style="color:${KIND_COLOR[d.kind]}">${esc(d.id)}</span>`).join("  ")}`)
  },
  cat: (arg) => cat(arg),
  ask: (arg) => runAsk(arg),
  why: () => {
    if (!lastResult) return print(`<span class="dim">Ask something first.</span>`)
    lastResult.ranked.slice(0, 5).forEach((h) => {
      const n = Math.round((10 * h.score) / Math.max(lastResult.ranked[0].score, lastResult.tau))
      print(`  <span class="bar">${"█".repeat(n)}${"░".repeat(10 - n)}</span> ${h.score.toFixed(2)} <span class="${h.used ? "ok" : "dim"}">${esc(h.unit.text.slice(0, 64))}…</span>`)
    })
    print(`<span class="dim">  full trace ↓</span> <a href="#retrieval">retrieval, step by step</a>`)
  },
  game: () => { print(`<span class="dim">→ scrolling to the game</span>`); location.hash = "game" },
  map: () => { print(`<span class="dim">→ scrolling to the map</span>`); location.hash = "map" },
  resume: () => print(link("https://nik-hill-323.github.io/Nikhil_Obuleni/Nikhil_Obuleni_AI_Engineer.pdf", "Nikhil_Obuleni_AI_Engineer.pdf")),
  github: () => print(link("https://github.com/nik-hill-323", "github.com/nik-hill-323")),
  clear: () => { out.innerHTML = "" },
  sudo: (arg) => {
    if (/hire/.test(arg)) { print(`<span class="ok">[sudo] permission granted.</span>`); cat("contact") }
    else print(`<span class="bad">visitor is not in the sudoers file. This incident will be reported.</span>`)
  },
}

function cat(id) {
  const doc = byId.get((id || "").trim().toLowerCase())
  if (!doc) return print(`<span class="bad">cat: ${esc(id || "")}: no such source.</span> <span class="dim">try</span> ls`)
  print(`<span style="color:${KIND_COLOR[doc.kind]};font-weight:700">${esc(doc.title)}</span>`)
  doc.sents.forEach((s) => print(`  ${esc(s)}`))
  print(`  ${link(doc.url, doc.url.replace(/^https?:\/\//, ""))}`)
}

function runAsk(q) {
  if (!q) return print(`<span class="dim">usage: ask &lt;question&gt;</span>`)
  const r = ask(index, q)
  const best = r.ranked[0]
  row("retrieve", `<span class="dim">${index.units.length} sentences scored · best ${best ? best.score.toFixed(2) : "0"} (threshold ${r.tau.toFixed(1)}) · coverage ${best ? Math.round(best.coverage * 100) : 0}%</span>`)
  if (r.abstain) {
    row("abstain", `<span class="bad">${esc(r.reason)}</span>`)
    print(`<span class="k"></span><span class="dim">try</span> ask what tools do you use? <span class="dim">or</span> ls`)
  } else {
    r.answer.forEach((a, i) => row(i ? "" : "answer", `${esc(a.text)} <span class="cite">[${a.cite}]</span>`))
    r.sources.forEach((d, i) => row(i ? "" : "sources", `<span class="cite">[${i + 1}]</span> ${link(d.url, d.title)}`))
    print(`<span class="k"></span><span class="dim">type</span> why <span class="dim">to see how this was retrieved</span>`)
  }
  showRetrieval(r)
}

function run(line) {
  print(`<b>visitor@nikhil:~$</b> ${esc(line)}`, "cmd")
  const [cmd, ...rest] = line.trim().split(/\s+/)
  const arg = rest.join(" ")
  if (!cmd) return
  const fn = COMMANDS[cmd.toLowerCase()]
  if (fn) return fn(arg)
  // anything else is a question
  runAsk(line)
}

$("#term-form").addEventListener("submit", (e) => {
  e.preventDefault()
  demo = false
  const line = input.value
  input.value = ""
  if (line.trim()) history.push(line)
  hpos = history.length
  run(line)
})
input.addEventListener("keydown", (e) => {
  demo = false
  if (e.key === "ArrowUp" && hpos > 0) { input.value = history[--hpos]; e.preventDefault() }
  else if (e.key === "ArrowDown") { hpos = Math.min(history.length, hpos + 1); input.value = history[hpos] || ""; e.preventDefault() }
  else if (e.key === "Tab") {
    e.preventDefault()
    const v = input.value
    const pool = v.includes(" ") ? corpus.map((d) => v.split(" ")[0] + " " + d.id) : Object.keys(COMMANDS)
    const hits = pool.filter((c) => c.startsWith(v))
    if (hits.length === 1) input.value = hits[0] + (v.includes(" ") ? "" : " ")
    else if (hits.length > 1) print(`<span class="dim">${esc(hits.map((h) => h.split(" ").pop()).join("  "))}</span>`)
  }
})
$("#term").addEventListener("click", (e) => { if (!e.target.closest("a") && !getSelection().toString()) input.focus({ preventScroll: true }) })

async function boot() {
  const lines = [
    `<span class="dim">loading corpus.json · ${corpus.length} sources · ${index.units.length} sentences</span>`,
    `<span class="dim">building BM25 index · ${index.idf.size} terms</span> <span class="ok">ok</span>`,
    `<span class="dim">policy: quote sources verbatim, cite every sentence, abstain below threshold</span>`,
    ``,
    `Hi, I'm <b>Nikhil</b>. Ask this terminal about my work. Type <span class="ok">help</span> for commands.`,
  ]
  for (const l of lines) { print(l); await sleep(220) }
  await sleep(500)
  const q = "ask what do you work on right now?"
  for (let i = 1; i <= q.length && demo; i++) { input.value = q.slice(0, i); await sleep(32) }
  if (demo) { input.value = ""; history.push(q); hpos = history.length; run(q) }
}

// =========================================================================== game

function claims(n) {
  const r = rounds[n]
  const list = r.true.map((c) => ({ ...c, fake: false }))
  list.splice((n * 2 + 1) % 3, 0, { ...r.fake, fake: true })
  return list
}

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null")
    localStorage.setItem(key, JSON.stringify(val))
  } catch { return null }
}

const game = { n: 0, today: 0, played: store("halluc-played") || {} }

function renderGame() {
  const n = game.n
  const pick = game.played[n]
  const list = claims(n)
  const letters = "ABC"
  const score = Object.entries(game.played).filter(([k, v]) => claims(+k)[letters.indexOf(v)]?.fake).length
  const issue = (L) => `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(`guess: r${String(n + 1).padStart(2, "0")} ${L}`)}&body=${encodeURIComponent("Click **Create** to lock in this guess. A GitHub Action replies in about 30 seconds and adds you to the leaderboard.")}`
  $("#game-card").innerHTML = `
    <div class="round"><span>round ${n + 1} of ${rounds.length}${n === game.today ? " · today's round" : ""}</span><span>your score: ${score} / ${Object.keys(game.played).length}</span></div>
    ${list.map((c, i) => {
      const L = letters[i]
      const cls = pick ? (c.fake ? " fake" : " true") : ""
      const why = pick
        ? c.fake ? `<span class="why"><b>made up · ${esc(c.kind)}.</b> ${esc(c.truth)} <a href="${esc(c.source)}" target="_blank" rel="noopener">source</a></span>`
                 : `<span class="why"><b>supported.</b> <a href="${esc(c.source)}" target="_blank" rel="noopener">source</a></span>`
        : ""
      return `<button class="claim${cls}" data-l="${L}" ${pick ? "disabled" : ""}><span class="L">${L}${pick === L ? "•" : ""}</span><span>${esc(c.text).replace(/`([^`]+)`/g, "<code>$1</code>")}${why}</span></button>`
    }).join("")}
    ${pick ? `<p class="result ${list[letters.indexOf(pick)].fake ? "ok" : "bad"}">${list[letters.indexOf(pick)].fake ? "✓ Caught it." : "✗ Fooled. It reads just like the true ones, which is the problem."}</p>` : `<p class="small">Pick the claim you think is made up.</p>`}
    <div class="actions">
      <button class="btn ghost" data-act="prev">← round</button>
      <button class="btn ghost" data-act="next">round →</button>
      ${pick ? `<a class="btn go" href="${issue(pick)}" target="_blank" rel="noopener">put this guess on the GitHub leaderboard ↗</a>` : ""}
    </div>`
}

$("#game-card").addEventListener("click", (e) => {
  const c = e.target.closest(".claim")
  const act = e.target.closest("[data-act]")?.dataset.act
  if (c && !c.disabled) {
    game.played[game.n] = c.dataset.l
    store("halluc-played", game.played)
    renderGame()
  } else if (act) {
    game.n = (game.n + (act === "next" ? 1 : rounds.length - 1)) % rounds.length
    renderGame()
  }
})

async function renderBoard() {
  const scores = (await load("scores.json", { live: true })) || []
  const players = {}
  for (const g of scores) {
    const p = (players[g.user] ??= [0, 0])
    p[0] += g.correct ? 1 : 0
    p[1] += 1
  }
  const top = Object.entries(players).sort((a, b) => b[1][0] - a[1][0] || a[1][1] - b[1][1]).slice(0, 8)
  $("#board").innerHTML = `<h3>GitHub leaderboard</h3>
    ${top.length ? `<table>${top.map(([u, [c, t]], i) => `<tr><td>${i + 1}. <a href="https://github.com/${esc(u)}" target="_blank" rel="noopener">@${esc(u)}</a></td><td>${c}/${t}</td></tr>`).join("")}</table>` : `<p class="muted">Nobody yet. Guess, then put it on the board.</p>`}
    <p class="small">${scores.length} guesses so far. Guesses made through GitHub issues count here; the Action checks them and replies with sources.</p>`
}

// ============================================================================ map

const map = (() => {
  const svg = $("#map-svg")
  const NS = "http://www.w3.org/2000/svg"
  const sim = docSimilarity(index)
  const nodes = corpus.map((doc, i) => {
    const a = (i / corpus.length) * Math.PI * 2
    return { doc, i, x: Math.cos(a) * 160, y: Math.sin(a) * 120, vx: 0, vy: 0, r: 8 + doc.sents.length * 1.6 }
  })
  const links = []
  nodes.forEach((a) => {
    sim[a.i].map((s, j) => [s, j]).filter(([, j]) => j !== a.i).sort((x, y) => y[0] - x[0]).slice(0, 2)
      .forEach(([s, j]) => { if (s > 0.04 && !links.some((l) => (l.a === j && l.b === a.i) || (l.a === a.i && l.b === j))) links.push({ a: a.i, b: j, s }) })
  })

  const kinds = [...new Set(corpus.map((d) => d.kind))]
  $("#map-legend").innerHTML = kinds.map((k) => `<span><i style="background:${KIND_COLOR[k]}"></i>${k}</span>`).join("")

  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag)
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
    parent?.appendChild(e)
    return e
  }
  const gEdges = el("g", {}, svg)
  const gNodes = el("g", {}, svg)
  links.forEach((l) => (l.el = el("line", { class: "edge", "stroke-width": 1 + l.s * 4 }, gEdges)))
  nodes.forEach((n) => {
    n.g = el("g", { class: "node", tabindex: 0 }, gNodes)
    n.glow = el("circle", { class: "glow", r: n.r + 6, stroke: "var(--green)" }, n.g)
    el("circle", { class: "core", r: n.r, fill: KIND_COLOR[n.doc.kind] }, n.g)
    el("text", { y: n.r + 15, "text-anchor": "middle" }, n.g).textContent = n.doc.id
    n.g.addEventListener("keydown", (e) => { if (e.key === "Enter") select(n) })
  })

  let W = 800, H = 520, alpha = 1, drag = null, moved = false, selected = null
  const resize = () => { W = svg.clientWidth || 800; H = svg.clientHeight || 520; svg.setAttribute("viewBox", `${-W / 2} ${-H / 2} ${W} ${H}`); alpha = Math.max(alpha, 0.3) }
  addEventListener("resize", resize)
  resize()

  function tick() {
    if (alpha > 0.005 || drag) {
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          let dx = b.x - a.x, dy = b.y - a.y
          const d2 = dx * dx + dy * dy || 1, d = Math.sqrt(d2)
          const f = (5200 / d2) * alpha
          dx /= d; dy /= d
          a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f
        }
      for (const l of links) {
        const a = nodes[l.a], b = nodes[l.b]
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
        const f = ((d - (90 + 200 * (1 - l.s))) * 0.03 * alpha) / d
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f
      }
      for (const n of nodes) {
        if (n === drag) continue
        n.vx = (n.vx - n.x * 0.006 * alpha) * 0.82
        n.vy = (n.vy - n.y * 0.012 * alpha) * 0.82
        n.x = Math.max(-W / 2 + n.r + 10, Math.min(W / 2 - n.r - 10, n.x + n.vx))
        n.y = Math.max(-H / 2 + n.r + 30, Math.min(H / 2 - n.r - 24, n.y + n.vy))
      }
      alpha *= 0.99
      draw()
    }
    requestAnimationFrame(tick)
  }
  function draw() {
    for (const l of links) {
      const a = nodes[l.a], b = nodes[l.b]
      l.el.setAttribute("x1", a.x); l.el.setAttribute("y1", a.y); l.el.setAttribute("x2", b.x); l.el.setAttribute("y2", b.y)
    }
    for (const n of nodes) n.g.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`)
  }

  const point = (e) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse())
    return p
  }
  svg.addEventListener("pointerdown", (e) => {
    const n = nodes.find((n) => n.g.contains(e.target))
    if (!n) return
    drag = n; moved = false
    svg.setPointerCapture(e.pointerId)
  })
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return
    const p = point(e)
    if (Math.hypot(p.x - drag.x, p.y - drag.y) > 2) moved = true
    drag.x = p.x; drag.y = p.y; drag.vx = drag.vy = 0
    alpha = Math.max(alpha, 0.5)
  })
  svg.addEventListener("pointerup", () => {
    if (drag && !moved) select(drag)
    drag = null
  })

  function select(n) {
    selected?.g.classList.remove("sel")
    selected = n
    n.g.classList.add("sel")
    const near = sim[n.i].map((s, j) => [s, j]).filter(([, j]) => j !== n.i).sort((a, b) => b[0] - a[0]).slice(0, 3)
    $("#map-detail").innerHTML = `<h4 style="color:${KIND_COLOR[n.doc.kind]}">${esc(n.doc.title)}</h4>
      <p>${esc(n.doc.sents[0])}</p>
      <p class="small">closest: ${near.map(([s, j]) => `${esc(corpus[j].id)} (${s.toFixed(2)})`).join(" · ")} · <a href="${esc(n.doc.url)}" target="_blank" rel="noopener">open ↗</a></p>`
  }

  function highlight(r) {
    const best = new Map()
    for (const h of r.ranked.slice(0, 7)) best.set(h.unit.doc.id, Math.max(best.get(h.unit.doc.id) || 0, h.score))
    const top = Math.max(...best.values(), 1)
    for (const n of nodes) {
      const s = best.get(n.doc.id) || 0
      const used = r.answer.some((a) => a.doc === n.doc)
      n.glow.setAttribute("stroke", used ? "var(--green)" : "var(--blue)")
      n.glow.style.opacity = s ? (used ? 1 : 0.25 + (0.5 * s) / top) : 0
      n.glow.setAttribute("r", n.r + (used ? 8 : 5))
    }
  }

  requestAnimationFrame(tick)
  return { highlight }
})()

// ========================================================================== start

renderGame()
renderBoard()
load("state.json", { live: true }).then((s) => {
  if (s && rounds[s.round]) { game.n = game.today = s.round; renderGame() }
})
boot()
