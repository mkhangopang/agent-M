-- Schema for PLIA SQLite database
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
    bloom_profile TEXT,
    subject_mastery TEXT,
    strengths TEXT,
    knowledge_gaps TEXT,
    misconceptions TEXT,
    metacognition TEXT,
    confidence_calibration TEXT,
    calibration_score REAL,
    learning_preferences TEXT,
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
    questions_json TEXT,
    evaluations_json TEXT,
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
    embedding TEXT,
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
