use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use serde_json::Value;
use uuid::Uuid;
use sqlx::Row;

#[tauri::command]
pub async fn add_question(quiz_id: String, question: Value, db: State<'_, DbState>) -> Result<Value, AppError> {
    let q_id = question["id"].as_str().unwrap_or(&Uuid::new_v4().to_string()).to_string();
    let q_type = question["type"].as_str().unwrap_or("multiple_choice").to_string();
    let order_index = question["order"].as_i64().unwrap_or(0);
    let text = question["text"].as_str().unwrap_or("").to_string();
    let rich_text = question["richText"].as_str().map(|s| s.to_string());
    
    let points_correct = question["points"]["correct"].as_i64().unwrap_or(10);
    let points_incorrect = question["points"]["incorrect"].as_i64().unwrap_or(0);
    
    let feedback_correct = question["feedback"]["correct"].as_str().unwrap_or("Chính xác !").to_string();
    let feedback_incorrect = question["feedback"]["incorrect"].as_str().unwrap_or("Không chính xác !").to_string();
    
    let attempts = question["attempts"].as_i64().unwrap_or(1);
    let branching = question["branching"].as_str().map(|s| s.to_string());
    let question_group = question["group"].as_str().map(|s| s.to_string());

    // Extract type specific data (everything else)
    let mut type_data = question.clone();
    if let Some(obj) = type_data.as_object_mut() {
        obj.remove("id");
        obj.remove("type");
        obj.remove("order");
        obj.remove("text");
        obj.remove("richText");
        obj.remove("media");
        obj.remove("points");
        obj.remove("feedback");
        obj.remove("feedbackMode");
        obj.remove("attempts");
        obj.remove("branching");
        obj.remove("group");
    }
    let type_data_json = type_data.to_string();

    sqlx::query(
        r#"
        INSERT INTO questions (
            id, quiz_id, type, order_index, text, rich_text, 
            points_correct, points_incorrect, feedback_correct, feedback_incorrect,
            attempts, branching, question_group, type_data_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&q_id)
    .bind(&quiz_id)
    .bind(&q_type)
    .bind(order_index)
    .bind(&text)
    .bind(&rich_text)
    .bind(points_correct)
    .bind(points_incorrect)
    .bind(&feedback_correct)
    .bind(&feedback_incorrect)
    .bind(attempts)
    .bind(&branching)
    .bind(&question_group)
    .bind(&type_data_json)
    .execute(&db.pool)
    .await?;

    Ok(question)
}

#[tauri::command]
pub async fn update_question(id: String, question: Value, db: State<'_, DbState>) -> Result<Value, AppError> {
    let q_type = question["type"].as_str().unwrap_or("multiple_choice").to_string();
    let order_index = question["order"].as_i64().unwrap_or(0);
    let text = question["text"].as_str().unwrap_or("").to_string();
    let rich_text = question["richText"].as_str().map(|s| s.to_string());
    
    let points_correct = question["points"]["correct"].as_i64().unwrap_or(10);
    let points_incorrect = question["points"]["incorrect"].as_i64().unwrap_or(0);
    
    let feedback_correct = question["feedback"]["correct"].as_str().unwrap_or("Chính xác !").to_string();
    let feedback_incorrect = question["feedback"]["incorrect"].as_str().unwrap_or("Không chính xác !").to_string();
    
    let attempts = question["attempts"].as_i64().unwrap_or(1);
    let branching = question["branching"].as_str().map(|s| s.to_string());
    let question_group = question["group"].as_str().map(|s| s.to_string());

    // Extract type specific data
    let mut type_data = question.clone();
    if let Some(obj) = type_data.as_object_mut() {
        obj.remove("id");
        obj.remove("type");
        obj.remove("order");
        obj.remove("text");
        obj.remove("richText");
        obj.remove("media");
        obj.remove("points");
        obj.remove("feedback");
        obj.remove("feedbackMode");
        obj.remove("attempts");
        obj.remove("branching");
        obj.remove("group");
    }
    let type_data_json = type_data.to_string();

    sqlx::query(
        r#"
        UPDATE questions SET 
            type = ?, order_index = ?, text = ?, rich_text = ?, 
            points_correct = ?, points_incorrect = ?, 
            feedback_correct = ?, feedback_incorrect = ?,
            attempts = ?, branching = ?, question_group = ?, 
            type_data_json = ?
        WHERE id = ?
        "#
    )
    .bind(&q_type)
    .bind(order_index)
    .bind(&text)
    .bind(&rich_text)
    .bind(points_correct)
    .bind(points_incorrect)
    .bind(&feedback_correct)
    .bind(&feedback_incorrect)
    .bind(attempts)
    .bind(&branching)
    .bind(&question_group)
    .bind(&type_data_json)
    .bind(&id)
    .execute(&db.pool)
    .await?;

    Ok(question)
}

#[tauri::command]
pub async fn delete_question(id: String, db: State<'_, DbState>) -> Result<(), AppError> {
    sqlx::query("DELETE FROM questions WHERE id = ?")
        .bind(&id)
        .execute(&db.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn reorder_questions(quiz_id: String, order: Vec<String>, db: State<'_, DbState>) -> Result<(), AppError> {
    let mut tx = db.pool.begin().await?;
    for (index, id) in order.iter().enumerate() {
        sqlx::query("UPDATE questions SET order_index = ? WHERE id = ? AND quiz_id = ?")
            .bind(index as i64)
            .bind(id)
            .bind(&quiz_id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(())
}

#[tauri::command]
pub async fn duplicate_question(id: String, db: State<'_, DbState>) -> Result<Value, AppError> {
    let row = sqlx::query("SELECT * FROM questions WHERE id = ?")
        .bind(&id)
        .fetch_optional(&db.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Question {} not found", id)))?;

    let new_id = Uuid::new_v4().to_string();
    let quiz_id: String = row.get::<String, _>("quiz_id");
    let q_type: String = row.get::<String, _>("type");
    let order_index: i64 = row.get::<i64, _>("order_index") + 1; // Put it right after
    let text: String = row.get::<String, _>("text");
    let rich_text: Option<String> = row.get::<Option<String>, _>("rich_text");
    let points_correct: i64 = row.get::<i64, _>("points_correct");
    let points_incorrect: i64 = row.get::<i64, _>("points_incorrect");
    let feedback_correct: String = row.get::<String, _>("feedback_correct");
    let feedback_incorrect: String = row.get::<String, _>("feedback_incorrect");
    let attempts: i64 = row.get::<i64, _>("attempts");
    let branching: Option<String> = row.get::<Option<String>, _>("branching");
    let question_group: Option<String> = row.get::<Option<String>, _>("question_group");
    let type_data_json: String = row.get::<String, _>("type_data_json");

    // Reorder others to make space
    sqlx::query("UPDATE questions SET order_index = order_index + 1 WHERE quiz_id = ? AND order_index >= ?")
        .bind(&quiz_id)
        .bind(order_index)
        .execute(&db.pool)
        .await?;

    sqlx::query(
        r#"
        INSERT INTO questions (
            id, quiz_id, type, order_index, text, rich_text, 
            points_correct, points_incorrect, feedback_correct, feedback_incorrect,
            attempts, branching, question_group, type_data_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&new_id)
    .bind(&quiz_id)
    .bind(&q_type)
    .bind(order_index)
    .bind(&text)
    .bind(&rich_text)
    .bind(points_correct)
    .bind(points_incorrect)
    .bind(&feedback_correct)
    .bind(&feedback_incorrect)
    .bind(attempts)
    .bind(&branching)
    .bind(&question_group)
    .bind(&type_data_json)
    .execute(&db.pool)
    .await?;

    // Return the new question JSON (simplified return for now)
    Ok(serde_json::json!({ "id": new_id }))
}
