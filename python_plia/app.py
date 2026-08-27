"""
PLIA Local FastAPI Backend Application
Provides local-first SQLite persistence, Multi-Learner scoping,
Diagnostic State serialization, Spaced Review tracking, and Database Import/Export.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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

# --- Pydantic Request Models ---
class LearnerCreateUpdate(BaseModel):
    learner_id: str
    name: str
    subject: str
    goal: Optional[str] = ""
    experience_level: Optional[str] = "intermediate"
    available_learning_time: Optional[str] = "30 mins / day"

class GenericJsonPayload(BaseModel):
    data: Dict[str, Any]

# --- Health Check ---
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

# --- Multi-Learner Endpoints ---
@app.get("/api/learners")
def get_learners():
    return db.list_learners()

@app.post("/api/learners")
def create_or_update_learner(payload: LearnerCreateUpdate):
    db.save_learner(payload.model_dump())
    return {"status": "saved", "learner_id": payload.learner_id}

@app.get("/api/learners/{learner_id}")
def get_learner_by_id(learner_id: str):
    learner = db.get_learner(learner_id)
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
    return learner

@app.delete("/api/learners/{learner_id}")
def delete_learner(learner_id: str):
    success = db.delete_learner(learner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Learner not found")
    return {"status": "deleted", "learner_id": learner_id}

# --- Learner Profile ---
@app.get("/api/learners/{learner_id}/profile")
def get_profile(learner_id: str):
    profile = db.get_learner_profile(learner_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for learner")
    return profile

@app.put("/api/learners/{learner_id}/profile")
def put_profile(learner_id: str, payload: Dict[str, Any]):
    db.save_learner_profile(learner_id, payload)
    return {"status": "saved", "learner_id": learner_id}

# --- Learning Pathway ---
@app.get("/api/learners/{learner_id}/pathway")
def get_pathway(learner_id: str):
    pathway = db.get_learning_pathway(learner_id)
    if not pathway:
        raise HTTPException(status_code=404, detail="Pathway not found for learner")
    return pathway

@app.put("/api/learners/{learner_id}/pathway")
def put_pathway(learner_id: str, payload: Dict[str, Any]):
    db.save_learning_pathway(learner_id, payload)
    return {"status": "saved", "learner_id": learner_id}

# --- Diagnostic State ---
@app.get("/api/learners/{learner_id}/diagnostic-state")
def get_diagnostic_state(learner_id: str):
    session = db.get_diagnostic_session(learner_id)
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found for learner")
    return session

@app.put("/api/learners/{learner_id}/diagnostic-state")
def put_diagnostic_state(learner_id: str, payload: Dict[str, Any]):
    db.save_diagnostic_session(payload)
    return {"status": "saved", "learner_id": learner_id}

# --- Pathway Snapshots ---
@app.get("/api/learners/{learner_id}/snapshots")
def get_snapshots(learner_id: str):
    return db.list_snapshots(learner_id)

@app.post("/api/learners/{learner_id}/snapshots")
def post_snapshot(learner_id: str, payload: Dict[str, Any]):
    if not payload.get("learnerId"):
        payload["learnerId"] = learner_id
    db.save_snapshot(payload)
    return {"status": "saved", "snapshot_id": payload.get("id")}

@app.delete("/api/snapshots/{snapshot_id}")
def delete_snapshot_by_id(snapshot_id: str):
    success = db.delete_snapshot(snapshot_id)
    return {"status": "deleted" if success else "not_found", "snapshot_id": snapshot_id}

# --- Spaced Reviews ---
@app.get("/api/learners/{learner_id}/reviews")
def get_reviews(learner_id: str):
    return db.list_spaced_reviews(learner_id)

@app.post("/api/learners/{learner_id}/reviews")
def post_review(learner_id: str, payload: Dict[str, Any]):
    if not payload.get("learnerId"):
        payload["learnerId"] = learner_id
    db.save_spaced_review(payload)
    return {"status": "saved", "review_id": payload.get("id")}

# --- Vector Documents ---
@app.get("/api/learners/{learner_id}/vector-docs")
def get_vector_docs(learner_id: str):
    return db.list_vector_documents(learner_id)

@app.post("/api/learners/{learner_id}/vector-docs")
def post_vector_doc(learner_id: str, payload: Dict[str, Any]):
    if not payload.get("learnerId"):
        payload["learnerId"] = learner_id
    db.save_vector_document(payload)
    return {"status": "saved", "doc_id": payload.get("id")}

# --- Full Database Dump Export / Import ---
@app.get("/api/export")
def export_dump():
    return db.export_full_database()

@app.post("/api/import")
def import_dump(dump: Dict[str, Any]):
    success = db.import_full_database(dump)
    return {"status": "imported", "success": success}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
