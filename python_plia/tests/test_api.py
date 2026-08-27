"""
Unit & Integration Tests for PLIA FastAPI Backend
"""

import pytest
from fastapi.testclient import TestClient
import os

# Use an in-memory or isolated test database
os.environ["PLIA_DATABASE"] = "test_plia.db"

from app import app
from database import db

@pytest.fixture(autouse=True)
def run_around_tests():
    db.init_db()
    yield
    if os.path.exists("test_plia.db"):
        try:
            os.remove("test_plia.db")
        except:
            pass

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert "learner_count" in data

def test_learner_crud_and_profile_flow():
    # 1. Create Learner
    learner_payload = {
        "learner_id": "test-learner-1",
        "name": "Ada Lovelace",
        "subject": "Computer Science",
        "goal": "Master Distributed Systems",
        "experience_level": "intermediate",
        "available_learning_time": "45 mins / day"
    }
    create_res = client.post("/api/learners", json=learner_payload)
    assert create_res.status_code == 200
    assert create_res.json()["learner_id"] == "test-learner-1"

    # 2. List learners
    list_res = client.get("/api/learners")
    assert list_res.status_code == 200
    learners = list_res.json()
    assert any(l["learner_id"] == "test-learner-1" for l in learners)

    # 3. Save profile
    profile_payload = {
        "learnerId": "test-learner-1",
        "learningStage": 3,
        "stageName": "Competent Applicator",
        "bloom": {
            "remember": {"score": 85, "confidence": "high", "evidenceCount": 3},
            "understand": {"score": 80, "confidence": "high", "evidenceCount": 3},
            "apply": {"score": 75, "confidence": "moderate", "evidenceCount": 2},
            "analyze": {"score": 60, "confidence": "low", "evidenceCount": 1},
            "evaluate": {"score": 50, "confidence": "low", "evidenceCount": 0},
            "create": {"score": 40, "confidence": "low", "evidenceCount": 0}
        }
    }
    prof_res = client.put("/api/learners/test-learner-1/profile", json=profile_payload)
    assert prof_res.status_code == 200

    # 4. Get profile
    get_prof = client.get("/api/learners/test-learner-1/profile")
    assert get_prof.status_code == 200
    assert get_prof.json()["learningStage"] == 3

    # 5. Snapshots
    snap_payload = {
        "id": "snap-123",
        "learnerId": "test-learner-1",
        "subject": "Computer Science",
        "name": "Baseline Snapshot",
        "timestamp": "2026-08-27T00:00:00Z"
    }
    snap_res = client.post("/api/learners/test-learner-1/snapshots", json=snap_payload)
    assert snap_res.status_code == 200

    list_snaps = client.get("/api/learners/test-learner-1/snapshots")
    assert len(list_snaps.json()) >= 1

    # 6. Full Export
    export_res = client.get("/api/export")
    assert export_res.status_code == 200
    dump = export_res.json()
    assert "learners" in dump["data"]
