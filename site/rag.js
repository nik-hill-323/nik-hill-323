// Extractive, citation-grounded QA over game/corpus.json.
//
// One file, two callers: the browser (site/app.js) and the GitHub issue agent
// (scripts/agent.mjs). Sentences are ranked with BM25; the answer is made of
// retrieved sentences quoted verbatim, each with a citation, so nothing in it
// can be made up. When the best match is weak, or too much of the question
// has no support in the sources, it abstains instead of guessing.

const STOP = new Set(
  `a an the is are was were be been being am of in on at to for from by with and or but not no do does did
  have has had having i you he she it we they me my your his her its our their this that these those what
  which who whom whose when where why how can could would should will shall may might must about into over
  than then there here so if as any some all just also very much many more most tell show give know like
  please nikhil nikhils obuleni him himself use used uses using work worked working build built building
  ever really kind sort thing things something anything get got make made one ok okay hey hi hello right
  handle handled deal approach doing done experience experienced familiar comfortable worked
  cover covered include included`.split(/\s+/),
)

export const TAU = 2.0 // minimum BM25 score of the best sentence
export const MIN_COVERAGE = 0.5 // share of the question's weight the best sentence must cover
const K1 = 1.2
const B = 0.75
const TAG_WEIGHT = 0.8 // a document's title and tags count, but less than the sentence itself

// Common phrasings with no content words of their own.
const ALIASES = [
  [/\bwho (are|is) (you|he|nikhil)\b|\babout (you|yourself|him)\b|\bintroduce\b/i, " about yourself background"],
  [/\bwhat (do|does) (you|he) do\b|\bright now\b|\bcurrently\b|\bthese days\b/i, " now current role"],
  [/\b(hire|hiring|available|availability)\b/i, " open roles contact"],
]

export function expand(question) {
  return ALIASES.reduce((q, [re, add]) => (re.test(question) ? q + add : q), question)
}

export function tokenize(s) {
  const raw = s.toLowerCase().replace(/[’']/g, "").replace(/\ba\/b\b/g, "ab").match(/[a-z0-9][a-z0-9+#]*/g) || []
  return raw.map(stem)
}

function stem(w) {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y"
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) return w.slice(0, -1)
  return w
}

function counts(toks) {
  const m = new Map()
  for (const t of toks) m.set(t, (m.get(t) || 0) + 1)
  return m
}

export function buildIndex(corpus) {
  const units = []
  for (const doc of corpus) {
    const tags = counts(tokenize(`${doc.title} ${doc.tags || ""}`))
    doc.sents.forEach((text, i) => {
      const toks = tokenize(text)
      units.push({ doc, i, text, toks, own: counts(toks), tags })
    })
  }
  const df = new Map()
  for (const u of units) {
    u.tf = new Map(u.own)
    for (const [t, n] of u.tags) u.tf.set(t, (u.tf.get(t) || 0) + n)
    for (const t of u.tf.keys()) df.set(t, (df.get(t) || 0) + 1)
  }
  const N = units.length
  const idf = new Map([...df].map(([t, n]) => [t, Math.log(1 + (N - n + 0.5) / (n + 0.5))]))
  const avgdl = units.reduce((s, u) => s + u.toks.length, 0) / N
  const maxIdf = Math.max(...idf.values())
  return { corpus, units, idf, avgdl, maxIdf }
}

function bm25(index, terms, u) {
  let score = 0
  const matched = []
  const own = []
  const norm = K1 * (1 - B + (B * u.toks.length) / index.avgdl)
  for (const t of terms) {
    const tf = u.own.get(t)
    if (!tf) continue
    score += (index.idf.get(t) * tf * (K1 + 1)) / (tf + norm)
    own.push(t)
  }
  // Tags describe the whole document. They score its opening sentence (the
  // summary), or any sentence that already matches the question on its own.
  for (const t of terms) {
    if (!u.tags.has(t) || (u.i > 0 && !own.length)) continue
    score += TAG_WEIGHT * index.idf.get(t)
    matched.push(t)
  }
  return { score, matched: [...new Set([...own, ...matched])], own }
}

/** Answer a question. Returns everything the UI needs to show its work. */
export function ask(index, question, { maxSents = 3, perDoc = 2 } = {}) {
  const terms = [...new Set(tokenize(expand(question)))].filter((t) => !STOP.has(t))
  const known = terms.filter((t) => index.idf.has(t))
  const unknown = terms.filter((t) => !index.idf.has(t))
  // unknown words weigh as much as the rarest known word: a question about
  // something the sources never mention should not be answered from the rest
  const weight = (t) => index.idf.get(t) ?? index.maxIdf
  const total = terms.reduce((s, t) => s + weight(t), 0) || 1

  const ranked = index.units
    .map((u) => {
      const { score, matched, own } = bm25(index, known, u)
      const coverage = matched.reduce((s, t) => s + weight(t), 0) / total
      return { unit: u, score, matched, own, coverage }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  const result = { question, terms, known, unknown, ranked, answer: [], sources: [], tau: TAU, minCoverage: MIN_COVERAGE }
  const top = ranked[0]
  if (!terms.length) return { ...result, abstain: true, reason: "There's no question to look up. Try asking about a role, a project, or a tool." }
  if (!top) return { ...result, abstain: true, reason: `None of the words in your question (${terms.join(", ")}) appear in my sources, so I won't guess.` }
  if (top.coverage < MIN_COVERAGE) {
    const miss = unknown.length ? ` (${unknown.join(", ")} never appear)` : ""
    return { ...result, abstain: true, reason: `The best source covers only ${Math.round(top.coverage * 100)}% of your question${miss}. I'd rather abstain than guess the rest.` }
  }
  if (top.score < TAU) return { ...result, abstain: true, reason: `The best match scores ${top.score.toFixed(2)}, under the ${TAU.toFixed(1)} threshold. Nothing in my sources answers this well enough.` }

  const perDocCount = new Map()
  for (const r of ranked) {
    if (result.answer.length >= maxSents || r.score < top.score * 0.55 || r.coverage < MIN_COVERAGE * 0.8) continue
    // beyond the best sentence, a sentence has to match the question in its own words, not only via its document's tags
    if (r !== top && !r.own.length) continue
    const n = perDocCount.get(r.unit.doc.id) || 0
    if (n >= perDoc) continue
    perDocCount.set(r.unit.doc.id, n + 1)
    r.used = true
    let cite = result.sources.indexOf(r.unit.doc) + 1
    if (!cite) cite = result.sources.push(r.unit.doc)
    result.answer.push({ text: r.unit.text, cite, doc: r.unit.doc })
  }
  return { ...result, abstain: false }
}

/** TF-IDF cosine similarity between documents, for the project map. */
export function docSimilarity(index) {
  const docs = index.corpus
  const vecs = docs.map((doc) => {
    const v = new Map()
    for (const u of index.units.filter((u) => u.doc === doc))
      for (const [t, tf] of u.tf) if (!STOP.has(t)) v.set(t, (v.get(t) || 0) + tf * index.idf.get(t))
    const norm = Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0)) || 1
    for (const [t, x] of v) v.set(t, x / norm)
    return v
  })
  return vecs.map((a) =>
    vecs.map((b) => {
      let s = 0
      for (const [t, x] of a) if (b.has(t)) s += x * b.get(t)
      return s
    }),
  )
}
