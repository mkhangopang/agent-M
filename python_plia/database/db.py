"""
SQLite Database Layer for PLIA
"""

import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from config.settings import settings

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    schema_path = Path(__file__).parent / "schema.sql"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = f.read()
    with get_connection() as conn:
        conn.executescript(schema)
        conn.commit()

def save_learner_profile(profile: Dict[str, Any]):
    init_db()
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO learner_profiles (
                learner_id, subject, goal, experience_level, available_learning_time,
                learning_stage, stage_confidence, bloom_profile, subject_mastery,
                strengths, knowledge_gaps, misconceptions, metacognition,
                confidence_calibration, calibration_score, learning_preferences,
                recommended_strategy, profile_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            profile["learner_id"],
            profile["subject"],
            profile.get("goal"),
            profile.get("experience_level"),
            profile.get("available_learning_time"),
            profile["learning_stage"],
            profile.get("stage_confidence"),
            json.dumps(profile.get("bloom", {})),
            json.dumps(profile.get("subject_mastery", {})),
            json.dumps(profile.get("strengths", [])),
            json.dumps(profile.get("knowledge_gaps", [])),
            json.dumps(profile.get("misconceptions", [])),
            json.dumps(profile.get("metacognition", {})),
            profile.get("confidence_calibration"),
            profile.get("calibration_score", 0.0),
            json.dumps(profile.get("learning_preferences", [])),
            profile.get("recommended_strategy"),
            profile.get("profile_version", 1)
        ))
        conn.commit()

def get_learner_profile(learner_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM learner_profiles WHERE learner_id = ?", (learner_id,)).fetchone()
        if not row:
            return None
        d = dict(row)
        for key in ["bloom_profile", "subject_mastery", "strengths", "knowledge_gaps", "misconceptions", "metacognition", "learning_preferences"]:
            if d.get(key):
                d[key] = json.loads(d[key])
        return d
