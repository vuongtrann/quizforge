use tauri::State;
use crate::database::DbState;
use crate::models::{Quiz, QuizSummary, CreateQuizDto, UpdateQuizDto};
use crate::error::AppError;
use uuid::Uuid;
use chrono::Utc;
use sqlx::Row;
use serde_json::Value;

#[tauri::command]
pub async fn get_all_quizzes(db: State<'_, DbState>) -> Result<Vec<QuizSummary>, AppError> {
    let rows = sqlx::query(
        r#"
        SELECT id, title, author,
               (SELECT COUNT(*) FROM questions WHERE quiz_id = quizzes.id AND type != 'blank_page') as question_count,
               (SELECT COALESCE(SUM(points_correct), 0) FROM questions WHERE quiz_id = quizzes.id AND type != 'blank_page') as total_points,
               created_at, updated_at
        FROM quizzes
        ORDER BY updated_at DESC
        "#
    )
    .fetch_all(&db.pool)
    .await?;

    let mut quizzes = Vec::new();
    for row in rows {
        let question_count: i64 = row.get("question_count");
        let total_points: i64 = row.get("total_points");
        
        quizzes.push(QuizSummary {
            id: row.get("id"),
            title: row.get("title"),
            author: row.get("author"),
            question_count,
            total_points,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }

    Ok(quizzes)
}

#[tauri::command]
pub async fn get_quiz(id: String, db: State<'_, DbState>) -> Result<Quiz, AppError> {
    let row = sqlx::query(
        r#"
        SELECT * FROM quizzes WHERE id = ?
        "#
    )
    .bind(&id)
    .fetch_optional(&db.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Quiz {} not found", id)))?;

    let questions_rows = sqlx::query(
        r#"SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC"#
    )
    .bind(&id)
    .fetch_all(&db.pool)
    .await?;

    let mut questions = Vec::new();
    for q_row in questions_rows {
        let q_id: String = q_row.get("id");
        let q_type: String = q_row.get("type");
        let order_index: i64 = q_row.get("order_index");
        let text: String = q_row.get("text");
        let rich_text: Option<String> = q_row.get("rich_text");
        let points_correct: i64 = q_row.get("points_correct");
        let points_incorrect: i64 = q_row.get("points_incorrect");
        let feedback_correct: String = q_row.get("feedback_correct");
        let feedback_incorrect: String = q_row.get("feedback_incorrect");
        let attempts: i64 = q_row.get("attempts");
        let branching: Option<String> = q_row.get("branching");
        let question_group: Option<String> = q_row.get("question_group");
        let type_data_json: String = q_row.get("type_data_json");

        let mut q_json = serde_json::json!({
            "id": q_id,
            "type": q_type,
            "order": order_index,
            "text": text,
            "richText": rich_text,
            "media": null,
            "points": {
                "correct": points_correct,
                "incorrect": points_incorrect
            },
            "feedback": {
                "correct": feedback_correct,
                "incorrect": feedback_incorrect
            },
            "attempts": attempts,
            "branching": branching,
            "group": question_group
        });

        if let Ok(mut parsed_type_data) = serde_json::from_str::<serde_json::Value>(&type_data_json) {
            if let Some(obj) = q_json.as_object_mut() {
                if let Some(type_data_obj) = parsed_type_data.as_object_mut() {
                    obj.append(type_data_obj);
                }
            }
        }
        
        questions.push(q_json);
    }

    let info_str: String = row.get("information_json");
    let settings_str: String = row.get("settings_json");
    let result_str: String = row.get("result_settings_json");
    let security_str: String = row.get("security_json");
    let theme_str: String = row.get("theme_json");

    Ok(Quiz {
        id: row.get("id"),
        schema_version: row.get("schema_version"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        information: serde_json::from_str(&info_str).unwrap_or_default(),
        settings: serde_json::from_str(&settings_str).unwrap_or_default(),
        result: serde_json::from_str(&result_str).unwrap_or_default(),
        security: serde_json::from_str(&security_str).unwrap_or_default(),
        theme: serde_json::from_str(&theme_str).unwrap_or_default(),
        questions,
    })
}

#[tauri::command]
pub async fn create_quiz(dto: CreateQuizDto, db: State<'_, DbState>) -> Result<Quiz, AppError> {
    let new_id = Uuid::new_v4().to_string();
    let theme_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let info = serde_json::json!({
        "title": dto.title,
        "author": dto.author.clone().unwrap_or_default(),
        "description": "",
        "introduction": { "enabled": true, "content": "" },
        "showStatistics": true,
        "collectParticipantData": { "enabled": false, "fields": [] }
    });

    let settings = serde_json::json!({
        "passingRate": 95,
        "timeLimit": { "enabled": false, "durationSeconds": 3600, "warningAtPercent": 20 },
        "randomization": { "randomizeQuestions": false, "randomizeOptions": false },
        "submission": { "mode": "per_question", "showCorrectAfterSubmit": true, "allowReview": true, "oneAttemptOnly": false, "promptResume": true },
        "lockdown": { "enabled": false, "exitCondition": "both" }
    });

    let result = serde_json::json!({
        "feedbackMode": "by_result",
        "passMessage": "Chúc mừng, bạn đã đạt !",
        "failMessage": "Bạn chưa đạt, cố gắng hơn nhé !",
        "showStatisticsOnResult": true,
        "finishButton": { "show": false, "passUrl": "", "failUrl": "", "openInCurrentWindow": true }
    });

    let security = serde_json::json!({
        "protection": "none",
        "users": [],
        "domainRestriction": { "enabled": false }
    });

    let theme = serde_json::json!({
        "id": theme_id,
        "name": "Default",
        "primaryColor": "#ef4444",
        "backgroundColor": "#ffffff",
        "textColor": "#1f2937",
        "progressStyle": "bar",
        "navigationStyle": "buttons",
        "fontFamily": "Inter",
        "fontSize": 16,
        "showTimer": true,
        "roundedCorners": true
    });

    let author_str = dto.author;

    sqlx::query(
        r#"
        INSERT INTO quizzes (id, title, author, created_at, updated_at,
            information_json, settings_json, result_settings_json, security_json, theme_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&new_id)
    .bind(&dto.title)
    .bind(&author_str)
    .bind(&now)
    .bind(&now)
    .bind(info.to_string())
    .bind(settings.to_string())
    .bind(result.to_string())
    .bind(security.to_string())
    .bind(theme.to_string())
    .execute(&db.pool)
    .await?;

    get_quiz(new_id, db).await
}

#[tauri::command]
pub async fn update_quiz(id: String, dto: UpdateQuizDto, db: State<'_, DbState>) -> Result<Quiz, AppError> {
    let now = Utc::now().to_rfc3339();
    
    let row = sqlx::query("SELECT * FROM quizzes WHERE id = ?")
        .bind(&id)
        .fetch_optional(&db.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(String::from("Quiz not found")))?;

    let mut info_json: String = row.get("information_json");
    let mut settings_json: String = row.get("settings_json");
    let mut result_json: String = row.get("result_settings_json");
    let mut security_json: String = row.get("security_json");
    let mut theme_json: String = row.get("theme_json");
    let mut title: String = row.get("title");

    if let Some(i) = dto.information {
        info_json = i.to_string();
        if let Some(t) = i.get("title").and_then(|v| v.as_str()) {
            title = t.to_string();
        }
    }
    if let Some(s) = dto.settings { settings_json = s.to_string(); }
    if let Some(r) = dto.result { result_json = r.to_string(); }
    if let Some(s) = dto.security { security_json = s.to_string(); }
    if let Some(t) = dto.theme { theme_json = t.to_string(); }

    sqlx::query(
        r#"
        UPDATE quizzes SET 
            updated_at = ?,
            title = ?,
            information_json = ?,
            settings_json = ?,
            result_settings_json = ?,
            security_json = ?,
            theme_json = ?
        WHERE id = ?
        "#
    )
    .bind(&now)
    .bind(&title)
    .bind(&info_json)
    .bind(&settings_json)
    .bind(&result_json)
    .bind(&security_json)
    .bind(&theme_json)
    .bind(&id)
    .execute(&db.pool)
    .await?;

    get_quiz(id, db).await
}

#[tauri::command]
pub async fn delete_quiz(id: String, db: State<'_, DbState>) -> Result<(), AppError> {
    sqlx::query("DELETE FROM quizzes WHERE id = ?")
        .bind(&id)
        .execute(&db.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn duplicate_quiz(id: String, db: State<'_, DbState>) -> Result<Quiz, AppError> {
    let mut quiz = get_quiz(id.clone(), db.clone()).await?;
    let new_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    if let Some(info_obj) = quiz.information.as_object_mut() {
        if let Some(title) = info_obj.get("title").and_then(|t| t.as_str()) {
            info_obj.insert("title".to_string(), serde_json::json!(format!("{} (Copy)", title)));
        }
    }
    let new_title = quiz.information.get("title").and_then(|v| v.as_str()).unwrap_or("Untitled Copy").to_string();
    let info_str = quiz.information.to_string();
    let settings_str = quiz.settings.to_string();
    let result_str = quiz.result.to_string();
    let security_str = quiz.security.to_string();
    let theme_str = quiz.theme.to_string();

    sqlx::query(
        r#"
        INSERT INTO quizzes (
            id, schema_version, title, created_at, updated_at, 
            information_json, settings_json, result_settings_json, security_json, theme_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&new_id)
    .bind(&quiz.schema_version)
    .bind(&new_title)
    .bind(&now)
    .bind(&now)
    .bind(&info_str)
    .bind(&settings_str)
    .bind(&result_str)
    .bind(&security_str)
    .bind(&theme_str)
    .execute(&db.pool)
    .await?;

    // Copy questions
    sqlx::query(
        r#"
        INSERT INTO questions (
            id, quiz_id, type, order_index, text, rich_text, media_id,
            points_correct, points_incorrect, feedback_correct, feedback_incorrect,
            attempts, branching, question_group, type_data_json
        )
        SELECT 
            hex(randomblob(16)), ? as quiz_id, type, order_index, text, rich_text, media_id,
            points_correct, points_incorrect, feedback_correct, feedback_incorrect,
            attempts, branching, question_group, type_data_json
        FROM questions
        WHERE quiz_id = ?
        "#
    )
    .bind(&new_id)
    .bind(&id)
    .execute(&db.pool)
    .await?;

    get_quiz(new_id, db).await
}

pub async fn save_quiz_object_to_db(quiz: Value, db_pool: &sqlx::SqlitePool) -> Result<String, AppError> {
    let new_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let schema_version = quiz["schemaVersion"].as_str().unwrap_or("1.0.0").to_string();
    let title = quiz["information"]["title"].as_str().unwrap_or("Imported Quiz").to_string();
    
    let info_str = quiz["information"].to_string();
    let settings_str = quiz["settings"].to_string();
    let result_str = quiz["result"].to_string();
    let security_str = quiz["security"].to_string();
    let theme_str = quiz["theme"].to_string();

    sqlx::query(
        r#"
        INSERT INTO quizzes (
            id, schema_version, title, created_at, updated_at, 
            information_json, settings_json, result_settings_json, security_json, theme_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&new_id)
    .bind(&schema_version)
    .bind(&title)
    .bind(&now)
    .bind(&now)
    .bind(&info_str)
    .bind(&settings_str)
    .bind(&result_str)
    .bind(&security_str)
    .bind(&theme_str)
    .execute(db_pool)
    .await?;

    // Save questions
    if let Some(questions) = quiz["questions"].as_array() {
        for (index, q) in questions.iter().enumerate() {
            let q_id = Uuid::new_v4().to_string();
            let q_type = q["type"].as_str().unwrap_or("multiple_choice");
            let text = q["text"].as_str().unwrap_or("");
            let rich_text = q["richText"].as_str();
            let points_correct = q["points"]["correct"].as_i64().unwrap_or(10);
            let points_incorrect = q["points"]["incorrect"].as_i64().unwrap_or(0);
            let feedback_correct = q["feedback"]["correct"].as_str().unwrap_or("Chính xác !");
            let feedback_incorrect = q["feedback"]["incorrect"].as_str().unwrap_or("Không chính xác !");
            
            // Type specific data
            let mut type_data = q.clone();
            if let Some(obj) = type_data.as_object_mut() {
                let _ = obj.remove("id");
                let _ = obj.remove("type");
                let _ = obj.remove("order");
                let _ = obj.remove("text");
                let _ = obj.remove("richText");
                let _ = obj.remove("media");
                let _ = obj.remove("points");
                let _ = obj.remove("feedback");
            }

            sqlx::query(
                r#"
                INSERT INTO questions (
                    id, quiz_id, type, order_index, text, rich_text, 
                    points_correct, points_incorrect, feedback_correct, feedback_incorrect,
                    type_data_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#
            )
            .bind(&q_id)
            .bind(&new_id)
            .bind(q_type)
            .bind(index as i64)
            .bind(text)
            .bind(rich_text)
            .bind(points_correct)
            .bind(points_incorrect)
            .bind(feedback_correct)
            .bind(feedback_incorrect)
            .bind(type_data.to_string())
            .execute(db_pool)
            .await?;
        }
    }

    Ok(new_id)
}
