use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::str::FromStr;
use std::path::PathBuf;

pub struct DbState {
    pub pool: SqlitePool,
}

pub async fn init_db(app_dir: PathBuf) -> Result<DbState, crate::error::AppError> {
    let db_path = app_dir.join("quizforge.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());

    let options = SqliteConnectOptions::from_str(&db_url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);

    let pool = SqlitePool::connect_with(options).await?;

    // Run schema setup directly here so we don't rely on unmaintained migration runners
    let schema = r#"
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settings_json TEXT NOT NULL DEFAULT '{}',
    result_settings_json TEXT NOT NULL DEFAULT '{}',
    information_json TEXT NOT NULL DEFAULT '{}',
    security_json TEXT NOT NULL DEFAULT '{}',
    theme_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    rich_text TEXT,
    media_id TEXT,
    points_correct INTEGER NOT NULL DEFAULT 10,
    points_incorrect INTEGER NOT NULL DEFAULT 0,
    feedback_correct TEXT NOT NULL DEFAULT 'Chính xác !',
    feedback_incorrect TEXT NOT NULL DEFAULT 'Không chính xác !',
    attempts INTEGER NOT NULL DEFAULT 1,
    branching TEXT,
    question_group TEXT,
    type_data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, order_index);

CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_lists (
    id TEXT PRIMARY KEY,
    quiz_id TEXT REFERENCES quizzes(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_student_lists (
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_list_id TEXT NOT NULL REFERENCES student_lists(id) ON DELETE CASCADE,
    PRIMARY KEY(quiz_id, student_list_id)
);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES student_lists(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    quiz_title TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME NOT NULL,
    total_points INTEGER NOT NULL,
    earned_points INTEGER NOT NULL,
    percentage REAL NOT NULL,
    passed INTEGER NOT NULL,
    question_results_json TEXT NOT NULL,
    machine_id TEXT,
    submitted_via TEXT NOT NULL DEFAULT 'local',
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES 
    ('result_server_url', ''),
    ('lan_receive_port', '41235'),
    ('heartbeat_port', '41236'),
    ('auto_update_enabled', 'true'),
    ('update_endpoint', ''),
    ('theme', 'light'),
    ('language', 'vi'),
    ('default_passing_rate', '95'),
    ('default_points_correct', '10'),
    ('default_points_incorrect', '0'),
    ('default_feedback_correct', 'Chính xác !'),
    ('default_feedback_incorrect', 'Không chính xác !'),
    ('media_max_size_mb', '50'),
    ('branding_org_name', ''),
    ('branding_website', ''),
    ('branding_app_name', 'QuizForge Creator'),
    ('branding_bg_color', '#eff6ff');
"#;

    sqlx::query(schema).execute(&pool).await?;

    // Pragma setup for foreign keys
    sqlx::query("PRAGMA foreign_keys = ON;").execute(&pool).await?;

    Ok(DbState { pool })
}
