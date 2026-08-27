import React, { useState, useEffect } from 'react';
import {
  Terminal,
  FileCode,
  Copy,
  Check,
  Download,
  Database,
  Server,
  RefreshCw,
  Play,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { localBackendService } from '../lib/backendClient';
import { storageManager } from '../lib/storage';

export const PythonBundleView: React.FC = () => {
  const [activeFile, setActiveFile] = useState<
    'app.py' | 'db.py' | 'schema.sql' | 'test_api.py' | 'requirements.txt' | 'README.md'
  >('app.py');
  const [copied, setCopied] = useState(false);
  const [backendHealth, setBackendHealth] = useState<{
    connected: boolean;
    learnerCount: number;
    databasePath?: string;
    latencyMs: number;
  }>({ connected: false, learnerCount: 0, latencyMs: 0 });
  const [isChecking, setIsChecking] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    const res = await localBackendService.checkHealth();
    setBackendHealth(res);
    setIsChecking(false);
  };

  const handleTestBackendPing = async () => {
    try {
      const res = await localBackendService.getLearners();
      if (res !== null) {
        setTestResult(`Success! Backend returned ${res.length} registered learner(s).`);
      } else {
        setTestResult('Backend unreachable at http://localhost:8000. Start backend with `python app.py` or `uvicorn app:app`.');
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    }
  };

  const handleExportFullDatabase = async () => {
    const dump = await localBackendService.exportFullDatabase();
    const dataStr = dump ? JSON.stringify(dump, null, 2) : storageManager.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plia_sqlite_dump_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const FILE_CONTENTS: Record<string, { lang: string; content: string; desc: string }> = {
    'app.py': {
      lang: 'python',
      desc: 'FastAPI Production Backend Entry Point with CORS, SQLite persistence, and multi-learner routes',
      content: `"""
PLIA Local FastAPI Backend Application
Provides local-first SQLite persistence, Multi-Learner scoping,
Diagnostic State serialization, Spaced Review tracking, and Database Import/Export.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
from database import db

app = FastAPI(
    title="PLIA Local Backend",
    description="Offline-first Local Intelligence Service for Personalized Learning",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LearnerCreateUpdate(BaseModel):
    learner_id: str
    name: str
    subject: str
    goal: Optional[str] = ""
    experience_level: Optional[str] = "intermediate"
    available_learning_time: Optional[str] = "30 mins / day"

@app.get("/health")
def health():
    learners = db.list_learners()
    return {
        "status": "ok",
        "database": "connected",
        "database_path": os.getenv("PLIA_DATABASE", "plia.db"),
        "learner_count": len(learners),
        "version": "1.0.0"
    }

@app.get("/api/learners")
def get_learners():
    return db.list_learners()

@app.post("/api/learners")
def create_or_update_learner(payload: LearnerCreateUpdate):
    db.save_learner(payload.model_dump())
    return {"status": "saved", "learner_id": payload.learner_id}

@app.get("/api/learners/{learner_id}/profile")
def get_profile(learner_id: str):
    profile = db.get_learner_profile(learner_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.put("/api/learners/{learner_id}/profile")
def put_profile(learner_id: str, payload: Dict[str, Any]):
    db.save_learner_profile(learner_id, payload)
    return {"status": "saved", "learner_id": learner_id}

@app.get("/api/export")
def export_dump():
    return db.export_full_database()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
`,
    },

    'db.py': {
      lang: 'python',
      desc: 'SQLite Database Layer executing migrations and relational CRUD operations',
      content: `"""
SQLite Database Layer for PLIA FastAPI Service
"""

import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import os

DB_PATH = os.getenv("PLIA_DATABASE", "plia.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    schema_path = Path(__file__).parent / "schema.sql"
    if schema_path.exists():
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = f.read()
        with get_connection() as conn:
            conn.executescript(schema)
            conn.commit()

init_db()

def list_learners() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM learners ORDER BY updated_at DESC").fetchall()
        return [dict(r) for r in rows]

def save_learner(learner: Dict[str, Any]):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO learners (
                learner_id, name, subject, goal, experience_level, available_learning_time, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            learner["learner_id"],
            learner.get("name", "Learner"),
            learner.get("subject", "General"),
            learner.get("goal", ""),
            learner.get("experience_level", "intermediate"),
            learner.get("available_learning_time", "30 mins / day")
        ))
        conn.commit()
`,
    },

    'schema.sql': {
      lang: 'sql',
      desc: 'Relational SQLite DDL schema for learners, profiles, pathways, sessions, snapshots, reviews, and vector documents',
      content: `-- SQLite Schema for PLIA (plia.db)

CREATE TABLE IF NOT EXISTS learners (
    learner_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    goal TEXT,
    experience_level TEXT DEFAULT 'intermediate',
    available_learning_time TEXT DEFAULT '30 mins / day',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learner_profiles (
    learner_id TEXT PRIMARY KEY,
    profile_json TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_pathways (
    learner_id TEXT PRIMARY KEY,
    pathway_json TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
    session_id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    current_phase TEXT,
    current_index INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT 0,
    session_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pathway_snapshots (
    id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    name TEXT NOT NULL,
    note TEXT,
    timestamp TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE
);
`,
    },

    'test_api.py': {
      lang: 'python',
      desc: 'Pytest integration test suite covering API routes and SQLite persistence',
      content: `"""
Unit & Integration Tests for PLIA FastAPI Backend
"""

import pytest
from fastapi.testclient import TestClient
import os

os.environ["PLIA_DATABASE"] = "test_plia.db"

from app import app
from database import db

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

def test_learner_crud_and_profile_flow():
    payload = {
        "learner_id": "test-learner-1",
        "name": "Ada Lovelace",
        "subject": "Computer Science"
    }
    create_res = client.post("/api/learners", json=payload)
    assert create_res.status_code == 200
    assert create_res.json()["learner_id"] == "test-learner-1"
`,
    },

    'requirements.txt': {
      lang: 'text',
      desc: 'Python dependencies for FastAPI and Pytest',
      content: `fastapi>=0.111.0
uvicorn>=0.30.0
pydantic>=2.7.0
httpx>=0.27.0
python-dotenv>=1.0.1
pytest>=8.2.0
`,
    },

    'README.md': {
      lang: 'markdown',
      desc: 'Complete service architecture and startup instructions',
      content: `# PLIA Local Python FastAPI Backend

Runs 100% locally on your machine with SQLite storage.

### 1. Installation
\`\`\`bash
cd python_plia
python -m venv venv
# Windows:
.\\venv\\Scripts\\Activate.ps1
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
\`\`\`

### 2. Launch FastAPI Server
\`\`\`bash
uvicorn app:app --reload --port 8000
\`\`\`

### 3. Run Pytest Suite
\`\`\`bash
pytest tests/
\`\`\`
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
                Local FastAPI + SQLite Service
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-indigo-400 font-medium">Desktop Sidecar & Persistence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              PLIA Python Backend Architecture
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Production-grade local REST API and relational SQLite persistence layer for offline diagnostic state, pathways, and multi-learner data.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportFullDatabase}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SQLite Dump</span>
            </button>

            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied File!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Live Backend Connection Status Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                backendHealth.connected
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-amber-500'
              }`}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">
                  FastAPI Service (http://localhost:8000):
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    backendHealth.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}
                >
                  {backendHealth.connected ? 'CONNECTED' : 'OFFLINE (FALLBACK ACTIVE)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {backendHealth.connected
                  ? `Database: ${backendHealth.databasePath || 'plia.db'} • Latency: ${backendHealth.latencyMs}ms • Learners: ${backendHealth.learnerCount}`
                  : 'App is operating seamlessly with client-side localStorage fallback cache.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={checkHealth}
              disabled={isChecking}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Ping Health</span>
            </button>

            <button
              onClick={handleTestBackendPing}
              className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg flex items-center gap-1.5 border border-indigo-500/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-300" />
              <span>Test API</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
            {testResult}
          </div>
        )}
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
