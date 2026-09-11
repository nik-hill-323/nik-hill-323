# Nikhil Obuleni

AI Research Engineer at the Center for Global Mental Health Equity (GWU), and M.S. Data Science candidate at the George Washington University, Washington, DC.

I build LLM systems that have to be right: retrieval pipelines grounded in clinical guidelines, agents that score counselor competency across 26K+ multilingual transcripts, and the evaluation harnesses that tell us when they are wrong. Before that I trained forecasting ensembles on humanitarian data at DSSD and deployed drone vision models at Asteria Aerospace.

[Portfolio](https://nik-hill-323.github.io/Nikhil_Obuleni/) · [LinkedIn](https://www.linkedin.com/in/nikhil-obuleni) · [Resume](https://nik-hill-323.github.io/Nikhil_Obuleni/Nikhil_Obuleni_AI_Engineer.pdf) · nikhil.obuleni@gwu.edu

## Featured work

| Project | What it is | Stack |
|---|---|---|
| [medrag-toolkit](https://github.com/nik-hill-323/medrag-toolkit) | Cited medical question answering over PubMed, OpenFDA and RxNorm. Every sentence is checked against its source; ungrounded claims are dropped and the system abstains rather than guessing. | LangChain, FAISS, BM25, FastAPI, Docker |
| [planmoe](https://github.com/nik-hill-323/planmoe) | Mixture-of-Experts floor plan generation from room-constraint graphs: GCN encoder, learned gating, per-room-type decoders, INT8-quantized inference. | PyTorch, FastAPI, HF Spaces |
| [sepsis-prediction](https://github.com/nik-hill-323/sepsis-prediction) | Bidirectional LSTM that flags ICU patients at risk of sepsis 6 to 12 hours before clinical diagnosis. | PyTorch, FastAPI, Docker |
| [skiavox](https://github.com/nik-hill-323/skiavox) | Chest X-ray analysis with a three-model ensemble, Grad-CAM explainability, DICOM ingestion and automated report drafts. Research prototype. | PyTorch, Gradio |
| [mindscope](https://github.com/nik-hill-323/mindscope) | Multi-task mental health NLP benchmark extending MindSET with intent, crisis and comorbidity tasks, BERT and Claude baselines, and a REST API. | Transformers, Anthropic API, FastAPI, Streamlit |
| [ragcheck](https://github.com/nik-hill-323/ragcheck) | Evaluation for RAG systems: retrieval precision/recall/MRR, sentence-level faithfulness that names the unsupported claims, answer relevance, citation coverage, and a CLI gate for CI. | scikit-learn, Anthropic and OpenAI judges, pytest |
| [abtest-kit](https://github.com/nik-hill-323/abtest-kit) | A/B test design and analysis: power analysis, z and Welch tests, Bayesian expected loss, always-valid sequential testing (mSPRT), CUPED. Every method tested against an independent reference. | NumPy, SciPy, pytest |
| [Retail-Demand-Forecasting](https://github.com/nik-hill-323/Retail-Demand-Forecasting) | End-to-end demand forecasting with gradient boosting on PySpark-prepared features. | XGBoost, PySpark |

## What I work with

- **LLM systems:** OpenAI and Anthropic APIs, LangChain, LangGraph, RAG, multi-agent pipelines, prompt injection guardrails
- **Retrieval and evaluation:** FAISS, Pinecone, pgvector, Qdrant, BM25, RAGAS, DeepEval, LangSmith
- **ML:** PyTorch, TensorFlow, scikit-learn, XGBoost, LightGBM, Hugging Face, spaCy
- **Serving and infra:** FastAPI, Docker, AWS (Lambda, EC2, S3, SageMaker), GitHub Actions, MLflow
- **Data:** PostgreSQL, BigQuery, MongoDB, PySpark, Airflow, SQL, R

## Currently

- Running LLM evaluation experiments across 14 languages for clinical competency scoring, with findings feeding a joint deployment study with OpenAI
- Extending medrag-toolkit's hallucination-detection layer and benchmarking it on MedQA and MedMCQA
- Open to AI Engineer and Data Scientist roles starting 2027
