<picture>
  <source media="(prefers-color-scheme: dark)" srcset="banner-dark.svg">
  <img alt="Nikhil Obuleni. AI research engineer. Retrieve, ground, evaluate, decide." src="banner-light.svg" width="100%">
</picture>

## two truths and a hallucination

One of these claims about me is made up, the way an LLM makes things up: a number that drifted, a name that got swapped, a claim turned backwards. Click the one you think is fake, then **Create**. A GitHub Action checks your answer in about 30 seconds, cites the sources, and puts you on the board. New round every day.

<!--game:start-->
**Round 1** · started 2026-10-18

| | claim | |
|:-:|:--|:-:|
| **A** | The counselor-scoring agent pipeline cut per-session review from 45 minutes to 4. | <a href="https://github.com/nik-hill-323/nik-hill-323/issues/new?title=guess%3A+r01+A&body=Click+%2A%2ACreate%2A%2A+to+lock+in+claim+%2A%2AA%2A%2A+as+the+hallucination+in+round+1.+A+GitHub+Action+replies+here+in+about+30+seconds+with+the+answer+and+its+sources%2C+then+closes+the+issue.%0A%0A_Only+the+title+is+read.+Your+first+guess+each+round+counts._"><img alt="guess A" src="https://img.shields.io/badge/%E2%96%B6%20A%20is%20made%20up-161b22?style=for-the-badge"></a> |
| **B** | `sepsis-prediction` flags ICU sepsis risk 24 to 48 hours early. | <a href="https://github.com/nik-hill-323/nik-hill-323/issues/new?title=guess%3A+r01+B&body=Click+%2A%2ACreate%2A%2A+to+lock+in+claim+%2A%2AB%2A%2A+as+the+hallucination+in+round+1.+A+GitHub+Action+replies+here+in+about+30+seconds+with+the+answer+and+its+sources%2C+then+closes+the+issue.%0A%0A_Only+the+title+is+read.+Your+first+guess+each+round+counts._"><img alt="guess B" src="https://img.shields.io/badge/%E2%96%B6%20B%20is%20made%20up-161b22?style=for-the-badge"></a> |
| **C** | `abtest-kit`'s peeking demo: a naive t-test gives 32% false positives, mSPRT gives 1.8%. | <a href="https://github.com/nik-hill-323/nik-hill-323/issues/new?title=guess%3A+r01+C&body=Click+%2A%2ACreate%2A%2A+to+lock+in+claim+%2A%2AC%2A%2A+as+the+hallucination+in+round+1.+A+GitHub+Action+replies+here+in+about+30+seconds+with+the+answer+and+its+sources%2C+then+closes+the+issue.%0A%0A_Only+the+title+is+read.+Your+first+guess+each+round+counts._"><img alt="guess C" src="https://img.shields.io/badge/%E2%96%B6%20C%20is%20made%20up-161b22?style=for-the-badge"></a> |

<sub>No guesses yet this round. Be the first.</sub>
<!--game:end-->

<details>
<summary><b>Leaderboard</b> · who catches hallucinations best</summary>

<br>

<!--board:start-->
_The board is empty. Catch today's hallucination to get on it._
<!--board:end-->

</details>

<sub>No model is called: the claim bank is <a href="game/rounds.json"><code>game/rounds.json</code></a> and the judge is <a href="scripts/game.py"><code>scripts/game.py</code></a>. Yes, you can read the answers there. Spotting a hallucination by checking the source is the right instinct.</sub>

I build LLM systems for people who cannot afford a wrong answer: clinicians, counselors, and field teams in low-resource settings. Most of my code falls into one of four stages, and I keep a repo for each.

<table>
<tr>
<th align="left" width="25%">retrieve &amp; ground</th>
<th align="left" width="25%">model</th>
<th align="left" width="25%">evaluate</th>
<th align="left" width="25%">decide</th>
</tr>
<tr valign="top">
<td>

**[medrag-toolkit](https://github.com/nik-hill-323/medrag-toolkit)**
Medical question answering over PubMed, OpenFDA and RxNorm. Hybrid dense + BM25 retrieval. Every sentence is checked against its source; anything unsupported is dropped, and it abstains rather than guesses.

</td>
<td>

**[PlanMoE](https://github.com/nik-hill-323/planmoe)** Mixture of experts over room-constraint graphs, INT8 quantized, on HF Spaces.

**[sepsis-prediction](https://github.com/nik-hill-323/sepsis-prediction)** BiLSTM that flags ICU sepsis risk 6 to 12 hours early.

**[skiavox](https://github.com/nik-hill-323/skiavox)** Chest X-ray ensemble with Grad-CAM and DICOM in.

**[mindscope](https://github.com/nik-hill-323/mindscope)** Mental health NLP benchmark, 15+ conditions, BERT and Claude baselines.

</td>
<td>

**[ragcheck](https://github.com/nik-hill-323/ragcheck)**
Scores retrieval, faithfulness, relevance and citation coverage separately, and prints the exact sentences a RAG answer made up. Offline judge for CI, LLM judge for depth, a `gate` command that fails the build.

</td>
<td>

**[abtest-kit](https://github.com/nik-hill-323/abtest-kit)**
Power analysis, z and Welch tests, Bayesian expected loss, always-valid sequential tests, CUPED. Each method is tested against an independent reference. The peeking demo: naive t-test 32% false positives, mSPRT 1.8%.

</td>
</tr>
</table>

## model card

<table>
<tr><td width="24%"><b>model</b></td><td><code>nik-hill-323</code> · AI research engineer · revision <code>2026.10</code></td></tr>
<tr><td><b>intended use</b></td><td>LLM systems where a wrong answer costs something: clinical scoring, counseling quality, humanitarian forecasting.</td></tr>
<tr><td><b>training data</b></td><td>M.S. Data Science, GWU (GPA 3.75, Dec 2026) · CGMHE · Data Science for Sustainable Development · Asteria Aerospace</td></tr>
<tr><td><b>eval results</b></td><td>26K+ transcripts scored in 25 countries · review time 45 min → 4 · factual error rate −40% · 78% weighted F1 on disaster forecasting</td></tr>
<tr><td><b>known biases</b></td><td>Prefers abstaining to guessing. Will ask what your held-out set looks like before writing any code.</td></tr>
<tr><td><b>out of scope</b></td><td>Leaderboard chasing without a held-out set.</td></tr>
<tr><td><b>deployment</b></td><td>Available for January 2027 starts · <a href="mailto:nikhil.obuleni@gwu.edu">nikhil.obuleni@gwu.edu</a></td></tr>
</table>

## log

| when | what |
|---|---|
| **Sep 2026** | Published `ragcheck` and `abtest-kit`. Both green on CI across Python 3.10 to 3.12. |
| **Aug 2026** | `medrag-toolkit` and `PlanMoE` went public. Rebuilt the portfolio site on Next.js. |
| **Mar 2026** | Joined the Center for Global Mental Health Equity at GWU as an AI research engineer. The agent pipeline I shipped scores counselor competency across 26K+ transcripts in 25 countries and cut per-session review from 45 minutes to 4. |
| **2025 – 2026** | ML engineer at Data Science for Sustainable Development: NLP extraction over sustainability reports and ARIMA/LSTM/XGBoost forecasting on 200K+ humanitarian records across 18 countries. |
| **Jan 2025** | Started the M.S. in Data Science at George Washington University. GPA 3.75, finishing Dec 2026. |
| **2023** | Drone object detection and predictive maintenance at Asteria Aerospace, Bangalore. |

## what the evaluation work found

Comparing GPT-4 and Claude against human-annotated ground truth across 14 languages turned up a **23% calibration gap on low-resource languages**. A RAG layer grounded in WHO EQUIP/ENACT rubrics, with reranking and hallucination flagging, brought the factual error rate down by about 40% on held-out multilingual benchmarks. Those findings feed a joint study with OpenAI on clinical LLM deployment. `ragcheck` is the open-source distillation of that measurement work.

## toolbox

<a href="https://skillicons.dev"><img src="https://skillicons.dev/icons?i=python,r,pytorch,tensorflow,sklearn,fastapi,docker,aws,gcp,postgres,mongodb,githubactions,git,linux&perline=14" alt="Python, R, PyTorch, TensorFlow, scikit-learn, FastAPI, Docker, AWS, GCP, PostgreSQL, MongoDB, GitHub Actions, git, Linux" /></a>

Plus the parts without icons: LangChain and LangGraph, the OpenAI and Anthropic APIs, FAISS, Pinecone, Qdrant and pgvector, RAGAS, DeepEval and LangSmith, Hugging Face, spaCy, XGBoost and LightGBM, PySpark, Airflow, BigQuery, MLflow, Streamlit.

## activity

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="stats-dark.svg">
  <img alt="Contributions, commits, repos, languages and a 26-week sparkline, regenerated daily" src="stats-light.svg" width="100%">
</picture>

<sub>These cards are rendered by [`scripts/build_stats.py`](scripts/build_stats.py) in this repo, refreshed every morning by a GitHub Action. No third-party widget service.</sub>

## elsewhere

[portfolio](https://nik-hill-323.github.io/Nikhil_Obuleni/) · [resume](https://nik-hill-323.github.io/Nikhil_Obuleni/Nikhil_Obuleni_AI_Engineer.pdf) · [linkedin](https://www.linkedin.com/in/nikhil-obuleni) · nikhil.obuleni@gwu.edu

Open now for January 2027 starts, AI engineer and data scientist roles. If you work on AI for health and want a second pair of eyes on an evaluation setup, my inbox is open.
