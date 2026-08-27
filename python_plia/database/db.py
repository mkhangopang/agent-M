"""
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

# Ensure tables exist on load
init_db()

# --- Learners ---
def list_learners() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM learners ORDER BY updated_at DESC").fetchall()
        return [dict(r) for r in rows]

def get_learner(learner_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM learners WHERE learner_id = ?", (learner_id,)).fetchone()
        return dict(row) if row else None

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

def delete_learner(learner_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM learners WHERE learner_id = ?", (learner_id,))
        conn.commit()
        return cur.rowcount > 0

# --- Learner Profile ---
def save_learner_profile(learner_id: str, profile_data: Dict[str, Any]):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO learner_profiles (learner_id, profile_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (learner_id, json.dumps(profile_data)))
        conn.commit()

def get_learner_profile(learner_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT profile_json FROM learner_profiles WHERE learner_id = ?", (learner_id,)).fetchone()
        if row and row["profile_json"]:
            return json.loads(row["profile_json"])
        return None

# --- Learning Pathway ---
def save_learning_pathway(learner_id: str, pathway_data: Dict[str, Any]):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO learning_pathways (learner_id, pathway_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (learner_id, json.dumps(pathway_data)))
        conn.commit()

def get_learning_pathway(learner_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT pathway_json FROM learning_pathways WHERE learner_id = ?", (learner_id,)).fetchone()
        if row and row["pathway_json"]:
            return json.loads(row["pathway_json"])
        return None

# --- Diagnostic Sessions ---
def save_diagnostic_session(session_data: Dict[str, Any]):
    session_id = session_data.get("sessionId") or session_data.get("session_id", f"sess-{learner_id}")
    learner_id = session_data.get("learnerId") or session_data.get("learner_id", "default")
    subject = session_data.get("subject", "General")
    current_phase = session_data.get("currentPhase", "PHASE_A_INTAKE")
    current_index = session_data.get("currentQuestionIndex", 0)
    is_completed = 1 if session_data.get("isCompleted") else 0

    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO diagnostic_sessions (
                session_id, learner_id, subject, current_phase, current_index, is_completed, session_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (session_id, learner_id, subject, current_phase, current_index, is_completed, json.dumps(session_data)))
        conn.commit()

def get_diagnostic_session(learner_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT session_json FROM diagnostic_sessions WHERE learner_id = ? ORDER BY updated_at DESC LIMIT 1",
            (learner_id,)
        ).fetchone()
        if row and row["session_json"]:
            return json.loads(row["session_json"])
        return None

# --- Snapshots ---
def list_snapshots(learner_id: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM pathway_snapshots WHERE learner_id = ? ORDER BY timestamp DESC",
            (learner_id,)
        ).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            if d.get("snapshot_json"):
                d["snapshot"] = json.loads(d["snapshot_json"])
            results.append(d)
        return results

def save_snapshot(snapshot: Dict[str, Any]):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO pathway_snapshots (
                id, learner_id, subject, name, note, timestamp, snapshot_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            snapshot["id"],
            snapshot["learnerId"],
            snapshot.get("subject", ""),
            snapshot.get("name", "Snapshot"),
            snapshot.get("note", ""),
            snapshot.get("timestamp", ""),
            json.dumps(snapshot)
        ))
        conn.commit()

def delete_snapshot(snapshot_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM pathway_snapshots WHERE id = ?", (snapshot_id,))
        conn.commit()
        return cur.rowcount > 0

# --- Spaced Reviews ---
def list_spaced_reviews(learner_id: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM spaced_reviews WHERE learner_id = ? ORDER BY next_review_date ASC",
            (learner_id,)
        ).fetchall()
        return [dict(r) for r in rows]

def save_spaced_review(review: Dict[str, Any]):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO spaced_reviews (
                id, learner_id, concept, domain, interval_days, repetition_count, next_review_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            review["id"],
            review["learnerId"],
            review["concept"],
            review["domain"],
            review.get("intervalDays", 1),
            review.get("repetitionCount", 0),
            review.get("nextReviewDate", ""),
            review.get("status", "upcoming")
        ))
        conn.commit()

# --- Vector Documents ---
def list_vector_documents(learner_id: Optional[str] = None) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        if learner_id:
            rows = conn.execute("SELECT * FROM vector_documents WHERE learner_id = ? OR learner_id = 'default'", (learner_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM vector_documents").fetchall()
        results = []
        for r in rows:
            d = dict(r)
            if d.get("embedding_json"):
                d["embedding"] = json.loads(d["embedding_json"])
            if d.get("metadata_json"):
                d["metadata"] = json.loads(d["metadata_json"])
            results.append(d)
        return results

def save_vector_document(doc: Dict[str, Any]):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO vector_documents (
                id, learner_id, subject, domain, topic, category, content, embedding_json, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc["id"],
            doc.get("learnerId", "default"),
            doc.get("subject", "General"),
            doc.get("domain", "General"),
            doc.get("topic", "Topic"),
            doc.get("category", "user_note"),
            doc["content"],
            json.dumps(doc.get("embedding", [])),
            json.dumps(doc.get("metadata", {}))
        ))
        conn.commit()

# --- Full Database Export & Import ---
def export_full_database() -> Dict[str, Any]:
    with get_connection() as conn:
        learners = [dict(r) for r in conn.execute("SELECT * FROM learners").fetchall()]
        profiles = [dict(r) for r in conn.execute("SELECT * FROM learner_profiles").fetchall()]
        pathways = [dict(r) for r in conn.execute("SELECT * FROM learning_pathways").fetchall()]
        sessions = [dict(r) for r in conn.execute("SELECT * FROM diagnostic_sessions").fetchall()]
        snapshots = [dict(r) for r in conn.execute("SELECT * FROM pathway_snapshots").fetchall()]
        reviews = [dict(r) for r in conn.execute("SELECT * FROM spaced_reviews").fetchall()]
        vectors = [dict(r) for r in conn.execute("SELECT * FROM vector_documents").fetchall()]

        return {
            "version": "1.0.0",
            "exported_at": sqlite3.datetime.datetime.utcnow().isoformat(),
            "data": {
                "learners": learners,
                "profiles": profiles,
                "pathways": pathways,
                "sessions": sessions,
                "snapshots": snapshots,
                "reviews": reviews,
                "vector_documents": vectors
            }
        }

def import_full_database(dump: Dict[str, Any]) -> bool:
    data = dump.get("data", {})
    init_db()
    with get_connection() as conn:
        if "learners" in data:
            for l in data["learners"]:
                conn.execute("""
                    INSERT OR REPLACE INTO learners (learner_id, name, subject, goal, experience_level, available_learning_time)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (l["learner_id"], l["name"], l["subject"], l.get("goal"), l.get("experience_level"), l.get("available_learning_time")))

        if "profiles" in data:
            for p in data["profiles"]:
                conn.execute("INSERT OR REPLACE INTO learner_profiles (learner_id, profile_json) VALUES (?, ?)", (p["learner_id"], p["profile_json"]))

        if "pathways" in data:
            for pw in data["pathways"]:
                conn.execute("INSERT OR REPLACE INTO learning_pathways (learner_id, pathway_json) VALUES (?, ?)", (pw["learner_id"], pw["pathway_json"]))

        if "snapshots" in data:
            for s in data["snapshots"]:
                conn.execute("""
                    INSERT OR REPLACE INTO pathway_snapshots (id, learner_id, subject, name, note, timestamp, snapshot_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (s["id"], s["learner_id"], s["subject"], s["name"], s.get("note"), s["timestamp"], s["snapshot_json"]))

        conn.commit()
    return True
