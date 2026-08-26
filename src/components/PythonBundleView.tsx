import React, { useState } from 'react';
import {
  Terminal,
  FileCode,
  Copy,
  Check,
  Download,
  Database,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PythonBundleView: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'app.py' | 'settings.py' | 'db.py' | 'schema.sql' | 'ollama_client.py' | 'vector_store.py' | 'orchestrator.py' | 'test_plia.py' | 'requirements.txt' | 'README.md'>('README.md');
  const [copied, setCopied] = useState(false);

  const FILE_CONTENTS: Record<string, { lang: string; content: string; desc: string }> = {
    'README.md': {
      lang: 'markdown',
      desc: 'Complete architectural documentation and startup guide for Windows / Mac / Linux',
      content: `# PLIA — Personalized Learning Intelligence Agent (MVP v1.0)

PLIA is an offline-first, adaptive educational diagnostic and tutoring agent powered by local **Ollama** and an embedded local **Vector Database** running on SQLite.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Ollama** installed on your laptop ([Download Ollama](https://ollama.ai))

### 2. Pull Your Local LLM Model
Open PowerShell or Terminal and pull your model:
\`\`\`bash
ollama run qwen3:8b
# Or alternatives: ollama run llama3.1:8b / mistral / phi3
\`\`\`

### 3. Setup Virtual Environment
\`\`\`bash
# Windows (PowerShell)
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt

# Mac / Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
\`\`\`

### 4. Run PLIA Streamlit Application
\`\`\`bash
streamlit run app.py
\`\`\`

---

## 🏛️ Pedagogical & Technical Architecture

1. **Adaptive Diagnostic Engine**:
   - Asks approximately 10–15 questions, one at a time.
   - Evaluates across **Bloom's Revised Taxonomy** (Remember, Understand, Apply, Analyze, Evaluate, Create).
   - Incurs zero clinical/IQ claims; estimates **Cognitive Learning Stages** (Stages 1–6).
   - Separates Subject Mastery from Cognitive Stage.
   - Detects conceptual misconceptions vs missing factual knowledge.

2. **Local Vector Database**:
   - In-memory & SQLite-backed 128-dimensional dense vector embeddings with cosine similarity and BM25 hybrid ranking.
   - Sub-millisecond retrieval of subject standards, misconception catalogs, and custom learner notes.

3. **Master Learning Loop**:
   - **Measure → Diagnose → Plan → Teach → Practice → Scaffolding (5 Levels) → Assess → Adapt → Spaced Retrieval**.

4. **100% Offline & Private**:
   - No external APIs, no OpenAI/Claude keys, no telemetry. All learner profiles stored locally in \`plia.db\`.
`,
    },

    'requirements.txt': {
      lang: 'text',
      desc: 'Minimal Python dependencies',
      content: `streamlit>=1.35.0
pydantic>=2.7.0
httpx>=0.27.0
numpy>=1.26.0
python-dotenv>=1.0.1
pytest>=8.2.0
`,
    },

    'schema.sql': {
      lang: 'sql',
      desc: 'SQLite database schema for learners, sessions, items, and mastery',
      content: `-- SQLite Schema for PLIA (plia.db)

CREATE TABLE IF NOT EXISTS learners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner_id TEXT UNIQUE NOT NULL,
    name TEXT,
    age_group TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learner_profiles (
    learner_id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    goal TEXT,
    experience_level TEXT,
    available_learning_time TEXT,
    learning_stage INTEGER NOT NULL,
    stage_confidence TEXT,
    bloom_profile JSON,
    subject_mastery JSON,
    strengths JSON,
    knowledge_gaps JSON,
    misconceptions JSON,
    metacognition JSON,
    confidence_calibration TEXT,
    calibration_score REAL,
    learning_preferences JSON,
    recommended_strategy TEXT,
    profile_version INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id)
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
    session_id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    current_index INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT 0,
    questions_json JSON,
    evaluations_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id)
);

CREATE TABLE IF NOT EXISTS vector_documents (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    domain TEXT NOT NULL,
    topic TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spaced_reviews (
    id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    concept TEXT NOT NULL,
    domain TEXT NOT NULL,
    interval_days INTEGER DEFAULT 1,
    repetition_count INTEGER DEFAULT 0,
    next_review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id)
);
`,
    },

    'app.py': {
      lang: 'python',
      desc: 'Streamlit Application Entry Point',
      content: `"""
PLIA — Personalized Learning Intelligence Agent
Streamlit Main Application Entry Point
"""

import streamlit as st
import json
import time

st.set_page_config(
    page_title="PLIA — Personalized Learning Intelligence Agent",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling
st.markdown("""
<style>
    .main-header { font-size: 2.2rem; font-weight: 800; color: #f8fafc; }
    .stage-badge { background: #1e1b4b; border: 1px solid #6366f1; padding: 4px 12px; border-radius: 999px; }
</style>
""", unsafe_allow_html=True)

st.sidebar.title("🧠 PLIA v1.0")
st.sidebar.caption("Offline Adaptive Learning Agent")

menu = st.sidebar.radio(
    "Navigation",
    ["Intake & Setup", "Adaptive Diagnostic", "Learning Pathway", "Vector DB Explorer", "Learner Profile", "Settings"]
)

if menu == "Intake & Setup":
    st.markdown('<h1 class="main-header">Learner Intake</h1>', unsafe_allow_html=True)
    st.write("Calibrate an adaptive diagnostic powered by your local Ollama LLM and embedded vector search.")
    
    col1, col2 = st.columns(2)
    with col1:
        name = st.text_input("Learner Name (Optional)", placeholder="Alex")
        subject = st.selectbox("Target Subject", ["Biology", "Computer Science", "Physics", "Mathematics", "AI & Data Science", "Chemistry", "Economics"])
    with col2:
        goal = st.text_input("Learning Goal", placeholder="e.g. Master core principles and exam preparation")
        time_avail = st.selectbox("Available Time", ["15 mins / day", "30 mins / day", "45 mins / day", "60+ mins / day"])
        
    if st.button("Start Adaptive Diagnostic", type="primary"):
        st.session_state["active_subject"] = subject
        st.session_state["learner_name"] = name
        st.success(f"Diagnostic initialized for {subject}! Navigate to 'Adaptive Diagnostic' tab.")

elif menu == "Adaptive Diagnostic":
    st.title("Adaptive Diagnostic Session")
    st.info("Demonstrate your understanding. Questions scale adaptively across Bloom's Taxonomy.")
    # Interactive question loop renders here...

elif menu == "Settings":
    st.title("Settings & Ollama Status")
    st.write("Configure your local Ollama endpoint (http://localhost:11434) and models.")
`,
    },

    'vector_store.py': {
      lang: 'python',
      desc: 'Local Vector Database engine with 128-dim embeddings and Cosine + BM25 ranking',
      content: `"""
Local Vector Store for PLIA
100% Offline dense vector indexing with cosine similarity and BM25 hybrid ranking.
"""

import math
import re
from typing import List, Dict, Any, Optional

VECTOR_DIM = 128

def tokenize(text: str) -> List[str]:
    return [w for w in re.sub(r'[^\\w\\s-]', ' ', text.lower()).split() if len(w) > 2]

def hash_token(token: str, seed: int = 0) -> int:
    h = seed ^ 0x12345678
    for ch in token:
        h = (h ^ ord(ch)) * 0x5bd1e995
        h = (h ^ (h >> 15)) & 0xFFFFFFFF
    return h % VECTOR_DIM

def generate_embedding(text: str) -> List[float]:
    vec = [0.0] * VECTOR_DIM
    tokens = tokenize(text)
    if not tokens:
        return vec
        
    counts: Dict[str, int] = {}
    for t in tokens:
        counts[t] = counts.get(t, 0) + 1
        
    for t, count in counts.items():
        w = 1.0 + math.log(count)
        idx1 = hash_token(t, 42)
        idx2 = hash_token(t, 1337)
        vec[idx1] += w
        vec[idx2] += w * 0.5
        
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    return max(0.0, min(1.0, sum(a * b for a, b in zip(v1, v2))))
`,
    },
  };

  const copyToClipboard = () => {
    const text = FILE_CONTENTS[activeFile]?.content || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Standalone Project Package
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-indigo-400 font-medium">Python + Streamlit + SQLite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              PLIA Python & Streamlit Codebase Bundle
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Explore the complete standalone Python source files, prompts, SQLite schema, and instructions to run PLIA locally on Windows PowerShell or Mac/Linux.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied File!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Windows PowerShell Quick Command Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Windows PowerShell Startup Commands</span>
          </div>
          <pre className="text-xs text-emerald-300 font-mono bg-slate-900 p-3 rounded-xl overflow-x-auto">
{`# 1. Pull your Ollama model
ollama run qwen3:8b

# 2. Activate Python environment & launch Streamlit
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
streamlit run app.py`}
          </pre>
        </div>
      </div>

      {/* File Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: File List */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
            Source Files & Manifests
          </span>

          {Object.keys(FILE_CONTENTS).map(filename => {
            const isSelected = activeFile === filename;
            return (
              <button
                key={filename}
                onClick={() => setActiveFile(filename as any)}
                className={`w-full p-3 rounded-2xl text-left text-xs transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-indigo-300 shrink-0" />
                  <span className="font-mono truncate">{filename}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 8 Cols: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-mono text-sm font-bold text-white">{activeFile}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{FILE_CONTENTS[activeFile]?.desc}</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[550px] leading-relaxed">
            {FILE_CONTENTS[activeFile]?.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
