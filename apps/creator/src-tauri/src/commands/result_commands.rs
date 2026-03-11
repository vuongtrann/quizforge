use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use flate2::read::GzDecoder;
use std::fs::File;
use std::io::Read;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizResult {
    pub id: String,
    pub quiz_id: String,
    pub quiz_title: String,
    pub student_id: String,
    pub student_name: String,
    pub started_at: String,
    pub completed_at: String,
    pub total_points: i64,
    pub earned_points: i64,
    pub percentage: f64,
    pub passed: bool,
    pub question_results: serde_json::Value,
    pub machine_id: String,
    pub submitted_via: String,
    pub received_at: String,
}

#[tauri::command]
pub async fn get_quiz_results(quiz_id: String, db: State<'_, DbState>) -> Result<Vec<QuizResult>, AppError> {
    let rows = sqlx::query("SELECT * FROM quiz_results WHERE quiz_id = ? ORDER BY received_at DESC")
        .bind(&quiz_id)
        .fetch_all(&db.pool)
        .await?;

    let mut results = Vec::new();
    for row in rows {
        results.push(QuizResult {
            id: row.get("id"),
            quiz_id: row.get("quiz_id"),
            quiz_title: row.get("quiz_title"),
            student_id: row.get("student_id"),
            student_name: row.get("student_name"),
            started_at: row.get("started_at"),
            completed_at: row.get("completed_at"),
            total_points: row.get("total_points"),
            earned_points: row.get("earned_points"),
            percentage: row.get("percentage"),
            passed: row.get("passed"),
            question_results: serde_json::from_str(row.get::<String, _>("question_results_json").as_str()).unwrap_or(serde_json::json!([])),
            machine_id: row.get("machine_id"),
            submitted_via: row.get("submitted_via"),
            received_at: row.get("received_at"),
        });
    }
    Ok(results)
}

#[tauri::command]
pub async fn delete_result(id: String, db: State<'_, DbState>) -> Result<(), AppError> {
    sqlx::query("DELETE FROM quiz_results WHERE id = ?")
        .bind(&id)
        .execute(&db.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn export_results_excel(quiz_id: String, output_path: String, db: State<'_, DbState>) -> Result<(), AppError> {
    let rows = sqlx::query("SELECT * FROM quiz_results WHERE quiz_id = ? ORDER BY received_at DESC")
        .bind(&quiz_id)
        .fetch_all(&db.pool)
        .await?;

    // Generate CSV (universally compatible, opens in Excel)
    let mut csv = String::from("STT,Họ và tên,Mã học sinh,Thời gian bắt đầu,Thời gian nộp,Điểm đạt,Tổng điểm,Phần trăm,Kết quả,Phương thức\n");

    for (i, row) in rows.iter().enumerate() {
        let student_name: String = row.get("student_name");
        let student_id: String = row.get("student_id");
        let started_at: String = row.get("started_at");
        let completed_at: String = row.get("completed_at");
        let earned: i64 = row.get("earned_points");
        let total: i64 = row.get("total_points");
        let pct: f64 = row.get("percentage");
        let passed: i64 = row.get("passed");
        let via: String = row.get("submitted_via");

        let result_label = if passed != 0 { "Đạt" } else { "Không đạt" };
        let name_escaped = student_name.replace('"', "\"\"");

        csv.push_str(&format!(
            "{},\"{}\",{},{},{},{},{},{:.1}%,{},{}\n",
            i + 1, name_escaped, student_id, started_at, completed_at,
            earned, total, pct, result_label, via
        ));
    }

    // Write UTF-8 BOM so Excel opens correctly on Windows
    let bom = b"\xEF\xBB\xBF";
    let mut file = std::fs::File::create(&output_path)?;
    use std::io::Write;
    file.write_all(bom)?;
    file.write_all(csv.as_bytes())?;

    Ok(())
}

#[tauri::command]
pub async fn import_result_from_qfr(path: String, db: State<'_, DbState>) -> Result<(), AppError> {
    let file = File::open(&path).map_err(|e| AppError::Internal(e.to_string()))?;
    let mut gz = GzDecoder::new(file);
    let mut json_str = String::new();
    gz.read_to_string(&mut json_str).map_err(|e| AppError::Internal(e.to_string()))?;

    let result: serde_json::Value = serde_json::from_str(&json_str).map_err(|e| AppError::Internal(e.to_string()))?;

    // Map fields from resultPayload (apps/player/src/store/playerStore.ts)
    // resultPayload has: quiz_id, student_id, student_name, student_class, start_time, end_time, answers, results, score, max_score, passed, etc.
    
    let id = uuid::Uuid::new_v4().to_string();
    let quiz_id = result["quiz_id"].as_str().unwrap_or("");
    let student_id = result["student_id"].as_str().unwrap_or("");
    let student_name = result["student_name"].as_str().unwrap_or("Ẩn danh");
    // Handle both student_class (from payload) and student_className (potential variation)
    let student_class = result["student_class"].as_str()
        .or_else(|| result["student_className"].as_str())
        .unwrap_or("");
    
    // Convert timestamps (number) to string if possible, or just use as-is if string
    let started_at = result["start_time"].to_string(); 
    let completed_at = result["end_time"].to_string();
    
    let total_points = result["max_score"].as_i64().unwrap_or(0);
    let earned_points = result["score"].as_i64().unwrap_or(0);
    
    let percentage = if total_points > 0 {
        (earned_points as f64 / total_points as f64) * 100.0
    } else {
        0.0
    };
    
    let passed = result["passed"].as_bool().unwrap_or(false);
    let question_results_json = result["results"].to_string();
    let machine_id = result["machine_id"].as_str().unwrap_or("");

    sqlx::query(
        "INSERT INTO quiz_results (
            id, quiz_id, quiz_title, student_id, student_name,
            started_at, completed_at, total_points, earned_points,
            percentage, passed, question_results_json, machine_id, submitted_via
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'qfr')"
    )
    .bind(&id)
    .bind(quiz_id)
    .bind(result["quiz_title"].as_str().unwrap_or("Imported Result"))
    .bind(student_id)
    .bind(student_name)
    .bind(&started_at)
    .bind(&completed_at)
    .bind(total_points)
    .bind(earned_points)
    .bind(percentage)
    .bind(passed as i64)
    .bind(&question_results_json)
    .bind(machine_id)
    .execute(&db.pool)
    .await?;

    Ok(())
}
