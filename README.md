<h1 align="center">Hi, I'm Nikhil Obuleni 👋</h1>

<p align="center">
  <b>AI Research Engineer • Data Scientist • Healthcare & Global Health AI • LLM Agents & RAG</b>
</p>

<p align="center">
  Building LLM systems that have to be right: grounded retrieval, agent pipelines, and the evaluation harnesses that catch them when they are wrong.
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=nik-hill-323&style=flat-square&color=blue" alt="Profile views" />
  <a href="https://github.com/nik-hill-323?tab=followers"><img src="https://img.shields.io/github/followers/nik-hill-323?style=flat-square&color=blue" alt="GitHub followers" /></a>
</p>

---

## 👨‍💻 About Me

I'm Nikhil Obuleni, an AI Research Engineer at the **Center for Global Mental Health Equity** at George Washington University and an M.S. Data Science candidate at GWU (Dec 2026), based in Washington, DC.

My work sits where LLMs meet clinical and humanitarian data. At CGMHE I shipped an LLM agent pipeline that scores counselor competency across **26K+ multilingual clinical transcripts in 25 countries**, cutting per-session review from 45 minutes to 4, and built the RAG system that grounds those judgements in WHO EQUIP/ENACT rubrics with a hallucination-flagging layer. I run the evaluation experiments behind it, comparing GPT-4 and Claude against human annotation across 14 languages.

Before that I trained forecasting ensembles on 200K+ humanitarian records at **Data Science for Sustainable Development** and deployed drone vision and predictive-maintenance models at **Asteria Aerospace**.

I'm particularly interested in problems at the intersection of:

- 🤖 **LLM Agents & Multi-Agent Systems**
- 🏥 **Healthcare, Mental Health & Global Health AI**
- 🔎 **RAG, Retrieval & Citation Grounding**
- 📏 **LLM Evaluation & Hallucination Detection**
- 📊 **Machine Learning, Forecasting & Experimentation**
- ⚙️ **ML Infrastructure & Serving**

Open to AI Engineer and Data Scientist roles starting 2027. Always happy to talk to engineers, researchers, and founders working on AI for health.

---

## 🛠️ Technical Stack

**Languages & Backend**

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![SQL](https://img.shields.io/badge/SQL-4479A1?style=flat&logo=postgresql&logoColor=white)
![R](https://img.shields.io/badge/R-276DC3?style=flat&logo=r&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)

**AI / Machine Learning**

![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat&logo=pytorch&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=flat&logo=tensorflow&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat&logo=scikitlearn&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-189AB4?style=flat)
![Hugging Face](https://img.shields.io/badge/Hugging_Face-FFD21E?style=flat&logo=huggingface&logoColor=black)
![spaCy](https://img.shields.io/badge/spaCy-09A3D5?style=flat&logo=spacy&logoColor=white)

**LLMs & Agents**

![OpenAI](https://img.shields.io/badge/OpenAI_API-412991?style=flat&logo=openai&logoColor=white)
![Anthropic](https://img.shields.io/badge/Claude_API-D97757?style=flat&logo=anthropic&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat&logo=langchain&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=flat&logo=langchain&logoColor=white)
![RAGAS](https://img.shields.io/badge/RAGAS-5C2D91?style=flat)
![LangSmith](https://img.shields.io/badge/LangSmith-1C3C3C?style=flat)

**Data & Retrieval**

![FAISS](https://img.shields.io/badge/FAISS-0467DF?style=flat&logo=meta&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat)
![Qdrant](https://img.shields.io/badge/Qdrant-DC244C?style=flat)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![BigQuery](https://img.shields.io/badge/BigQuery-669DF6?style=flat&logo=googlebigquery&logoColor=white)
![PySpark](https://img.shields.io/badge/PySpark-E25A1C?style=flat&logo=apachespark&logoColor=white)
![Airflow](https://img.shields.io/badge/Airflow-017CEE?style=flat&logo=apacheairflow&logoColor=white)

**Cloud & MLOps**

![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonwebservices&logoColor=white)
![SageMaker](https://img.shields.io/badge/SageMaker-232F3E?style=flat&logo=amazonwebservices&logoColor=white)
![MLflow](https://img.shields.io/badge/MLflow-0194E2?style=flat&logo=mlflow&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=flat&logo=streamlit&logoColor=white)
![HF Spaces](https://img.shields.io/badge/HF_Spaces-FFD21E?style=flat&logo=huggingface&logoColor=black)

---

## 🚀 Selected Projects

### 🩺 [medrag-toolkit](https://github.com/nik-hill-323/medrag-toolkit)
**Cited medical question answering over PubMed, OpenFDA and RxNorm**
- Hybrid retrieval (dense FAISS + sparse BM25 over Qdrant) with iterative query refinement across 36M+ PubMed abstracts, FDA drug labels and RxNorm.
- Every sentence is checked against its source; ungrounded claims are dropped and the system abstains rather than guessing.
- Streaming FastAPI layer with local (Ollama, vLLM) and cloud LLM backends, shipped via Docker.

### 📏 [ragcheck](https://github.com/nik-hill-323/ragcheck)
**Evaluation harness for retrieval-augmented generation**
- Scores retrieval (precision, recall, MRR), sentence-level faithfulness, answer relevance and citation coverage separately, so you know which part of the pipeline to fix.
- Names the exact unsupported sentences instead of just reporting a number.
- Offline deterministic judge for CI, Anthropic or OpenAI judge for depth, and a `ragcheck gate` command that fails a build on regression.

### 🏗️ [PlanMoE](https://github.com/nik-hill-323/planmoe)
**Mixture-of-Experts floor plan generation from room-constraint graphs**
- Custom MoE with a 3-layer GCN encoder, a learned gating network and per-room-type transposed-convolution decoders.
- INT8 post-training quantization cut inference latency by 52%, enabling real-time generation on a single GPU.
- Deployed as a Hugging Face Space with a FastAPI backend.

### 🧠 [mindscope](https://github.com/nik-hill-323/mindscope)
**Multi-task mental health NLP benchmark**
- Extends the MindSET benchmark from 7 to 15+ conditions and adds intent, crisis-severity and comorbidity tasks.
- BERT, RoBERTa and Claude (zero- and few-shot) baselines with a leaderboard, REST API and Streamlit dashboard.

### 🧪 [abtest-kit](https://github.com/nik-hill-323/abtest-kit)
**Design and analysis of online experiments**
- Power analysis, two-proportion z and Welch t-tests, Bayesian posteriors with expected loss, always-valid sequential testing (mSPRT) and CUPED variance reduction.
- Every method is tested against an independent reference; the peeking simulation shows a naive t-test at ~30% false positives while the mSPRT stays under 5%.

### 🏥 Clinical ML: [sepsis-prediction](https://github.com/nik-hill-323/sepsis-prediction) · [skiavox](https://github.com/nik-hill-323/skiavox)
- Bidirectional LSTM that flags ICU patients at risk of sepsis 6 to 12 hours before clinical diagnosis, served through FastAPI and Docker.
- Chest X-ray analysis with a three-model ensemble, Grad-CAM explainability, DICOM ingestion and automated report drafts. Research prototype.

🔗 **Explore all projects:** [github.com/nik-hill-323?tab=repositories](https://github.com/nik-hill-323?tab=repositories)

---

## 🎯 Areas of Interest

```
LLM Agents & RAG         ████████████████████
Healthcare & Global AI   ████████████████████
LLM Evaluation           ███████████████████░
Machine Learning         ██████████████████░░
Experimentation & Stats  █████████████████░░░
Data Engineering         ████████████████░░░░
```

---

## 🎓 Education & Recognition

- 🎓 **M.S. Data Science, George Washington University** — Jan 2025 to Dec 2026, GPA 3.75
- 🧑‍🔬 **AI Research Engineer, Center for Global Mental Health Equity (GWU)** — findings feeding a joint OpenAI collaboration on clinical LLM deployment
- 📄 **Resume:** [Nikhil_Obuleni_AI_Engineer.pdf](https://nik-hill-323.github.io/Nikhil_Obuleni/Nikhil_Obuleni_AI_Engineer.pdf)

---

## 🤝 Connect

<p>
  <a href="https://www.linkedin.com/in/nikhil-obuleni"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="https://nik-hill-323.github.io/Nikhil_Obuleni/"><img src="https://img.shields.io/badge/Portfolio-111111?style=flat&logo=githubpages&logoColor=white" alt="Portfolio" /></a>
  <a href="mailto:nikhil.obuleni@gwu.edu"><img src="https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white" alt="Email" /></a>
</p>

<p align="center"><i>Building AI systems that turn clinical and humanitarian data into decisions people can trust.</i></p>
