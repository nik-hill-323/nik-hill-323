// Answer an `ask: <question>` issue with the same retrieval the live site runs
// (site/rag.js), reply with citations or an abstention, log the run, close the
// issue, and refresh the README's visitor log.
//
// Runs from .github/workflows/game.yml. Visitors' question text is never
// written to the README: the log shows who asked and which source answered.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildIndex, ask } from "../site/rag.js"

const REPO = "nik-hill-323/nik-hill-323"
const SITE = "https://nik-hill-323.github.io/nik-hill-323/"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const LOG = path.join(ROOT, "game/asks.json")
const README = path.join(ROOT, "README.md")
const DAILY_LIMIT = 5

const readJSON = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback)

async function github(method, url, body) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${url}`, {
    method,
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`${method} ${url}: ${r.status} ${await r.text()}`)
}

async function reply(issue, body) {
  await github("POST", `/issues/${issue}/comments`, { body })
  await github("PATCH", `/issues/${issue}`, { state: "closed", state_reason: "completed" })
}

function answerMarkdown(r) {
  const trace = r.ranked.slice(0, 5).map((h) => `| ${h.score.toFixed(2)} | ${h.unit.text.replace(/\|/g, "\\|")} | ${h.used ? "✅ quoted" : ""} |`)
  const best = r.ranked[0]
  const details = [
    "<details><summary>How this was retrieved</summary>",
    "",
    `Query terms: ${r.terms.map((t) => `\`${t}\``).join(" ") || "none"}${r.unknown.length ? ` · not in my sources: ${r.unknown.map((t) => `\`${t}\``).join(" ")}` : ""}`,
    "",
    trace.length ? ["| BM25 | sentence | |", "| --: | :-- | :-- |", ...trace].join("\n") : "_No sentence matched._",
    "",
    `Best score ${best ? best.score.toFixed(2) : "0"} (abstain below ${r.tau.toFixed(1)}) · coverage ${best ? Math.round(best.coverage * 100) : 0}% (abstain below ${Math.round(r.minCoverage * 100)}%)`,
    "",
    "</details>",
  ].join("\n")
  if (r.abstain) {
    return [
      "### 🤷 Abstained",
      "",
      r.reason,
      "",
      "A system for clinicians has to be able to say \"I don't know\", so this one does. Try a role, a project, or a tool: `ask: have you used Airflow?`",
      "",
      details,
    ].join("\n")
  }
  return [
    "### 💬 Answer",
    "",
    ...r.answer.map((a) => `> ${a.text} **[${a.cite}]**\n>`),
    "",
    "**Sources**",
    ...r.sources.map((d, i) => `${i + 1}. [${d.title}](${d.url})`),
    "",
    "Every sentence above is quoted verbatim from a source, so there's nothing in it to hallucinate.",
    "",
    details,
  ].join("\n")
}

function renderLog(log) {
  if (!log.length) return "_No questions yet. Be the first._"
  const visitors = new Set(log.map((e) => e.user)).size
  const answered = log.filter((e) => !e.abstain).length
  const rows = log.slice(-5).reverse().map((e) => {
    const when = e.at.slice(0, 16).replace("T", " ") + " UTC"
    const result = e.abstain ? "🤷 abstained" : `💬 answered from ${e.sources.map((s) => `**${s}**`).join(", ")}`
    return `| [@${e.user}](https://github.com/${e.user}) | ${result} | ${when} |`
  })
  return [
    `**${log.length} questions** from **${visitors} visitors**: ${answered} answered with citations, ${log.length - answered} abstained.`,
    "",
    "| visitor | result | when |",
    "| :-- | :-- | :-- |",
    ...rows,
  ].join("\n")
}

function writeReadme(log) {
  const text = fs.readFileSync(README, "utf8")
  const re = /(<!--asks:start-->)[\s\S]*?(<!--asks:end-->)/
  if (!re.test(text)) throw new Error("README is missing the <!--asks:start--> / <!--asks:end--> markers")
  fs.writeFileSync(README, text.replace(re, (_, a, b) => `${a}\n${renderLog(log)}\n${b}`))
}

async function main() {
  if (process.argv[2] === "render") return writeReadme(readJSON(LOG, []))
  const event = readJSON(process.env.GITHUB_EVENT_PATH, {})
  const issue = event.issue
  const user = issue.user.login
  const question = issue.title.replace(/^\s*ask\s*:\s*/i, "").trim().slice(0, 200)
  const log = readJSON(LOG, [])
  const today = new Date().toISOString().slice(0, 10)

  if (!question) {
    return reply(issue.number, `Put your question in the title after \`ask:\`, for example \`ask: have you used Airflow?\`, or try the [live terminal](${SITE}#terminal).`)
  }
  if (log.filter((e) => e.user === user && e.at.startsWith(today)).length >= DAILY_LIMIT) {
    return reply(issue.number, `That's ${DAILY_LIMIT} questions today, the daily limit. The [live terminal](${SITE}#terminal) runs the same retrieval with no limit.`)
  }

  const index = buildIndex(readJSON(path.join(ROOT, "game/corpus.json"), []))
  const r = ask(index, question)
  log.push({ user, at: new Date().toISOString().slice(0, 19) + "Z", abstain: r.abstain, sources: r.sources.map((d) => d.id) })
  fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n")
  writeReadme(log)
  await reply(issue.number, answerMarkdown(r) + `\n\nWant to see each step? The [live version](${SITE}#retrieval) shows the whole pipeline.`)
}

await main()
