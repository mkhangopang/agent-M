-- Comprehensive SQLite Schema for PLIA Local Backend

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

CREATE TABLE IF NOT EXISTS spaced_reviews (
    id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    concept TEXT NOT NULL,
    domain TEXT NOT NULL,
    interval_days INTEGER DEFAULT 1,
    repetition_count INTEGER DEFAULT 0,
    next_review_date TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vector_documents (
    id TEXT PRIMARY KEY,
    learner_id TEXT DEFAULT 'default',
    subject TEXT NOT NULL,
    domain TEXT NOT NULL,
    topic TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding_json TEXT,
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_learner ON pathway_snapshots(learner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_learner ON spaced_reviews(learner_id);
CREATE INDEX IF NOT EXISTS idx_vector_learner ON vector_documents(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON diagnostic_sessions(learner_id);
