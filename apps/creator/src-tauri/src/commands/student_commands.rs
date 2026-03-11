use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct StudentList {
    pub id: String,
    pub name: String,
    pub imported_at: String,
    pub student_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Student {
    pub id: String,
    pub list_id: String,
    pub student_id: String,
    pub name: String,
    pub class_name: Option<String>,
    pub email: Option<String>,
}

#[tauri::command]
pub async fn get_student_lists(db: State<'_, DbState>) -> Result<Vec<StudentList>, AppError> {
    let rows = sqlx::query(
        r#"
        SELECT sl.id, sl.name, sl.imported_at, COUNT(s.id) as student_count
        FROM student_lists sl
        LEFT JOIN students s ON s.list_id = sl.id
        GROUP BY sl.id
        ORDER BY sl.imported_at DESC
        "#
    )
    .fetch_all(&db.pool)
    .await?;

    let mut lists = Vec::new();
    for row in rows {
        lists.push(StudentList {
            id: row.get("id"),
            name: row.get("name"),
            imported_at: row.get("imported_at"),
            student_count: row.get("student_count"),
        });
    }
    Ok(lists)
}

#[tauri::command]
pub async fn create_student_list(name: String, students: Vec<serde_json::Value>, db: State<'_, DbState>) -> Result<String, AppError> {
    let list_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let mut tx = db.pool.begin().await?;

    sqlx::query("INSERT INTO student_lists (id, name, imported_at) VALUES (?, ?, ?)")
        .bind(&list_id)
        .bind(&name)
        .bind(&now)
        .execute(&mut *tx)
        .await?;

    for s in students {
        let s_id = Uuid::new_v4().to_string();
        let student_id = s["studentId"].as_str().unwrap_or("").to_string();
        let s_name = s["name"].as_str().unwrap_or("").to_string();
        let class_name = s["className"].as_str().map(|s| s.to_string());
        let email = s["email"].as_str().map(|s| s.to_string());

        sqlx::query(
            "INSERT INTO students (id, list_id, student_id, name, class_name, email) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&s_id)
        .bind(&list_id)
        .bind(&student_id)
        .bind(&s_name)
        .bind(&class_name)
        .bind(&email)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(list_id)
}

#[tauri::command]
pub async fn delete_student_list(id: String, db: State<'_, DbState>) -> Result<(), AppError> {
    sqlx::query("DELETE FROM student_lists WHERE id = ?")
        .bind(&id)
        .execute(&db.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn get_students_by_list(list_id: String, db: State<'_, DbState>) -> Result<Vec<Student>, AppError> {
    let rows = sqlx::query("SELECT * FROM students WHERE list_id = ?")
        .bind(&list_id)
        .fetch_all(&db.pool)
        .await?;

    let mut students = Vec::new();
    for row in rows {
        students.push(Student {
            id: row.get("id"),
            list_id: row.get("list_id"),
            student_id: row.get("student_id"),
            name: row.get("name"),
            class_name: row.get("class_name"),
            email: row.get("email"),
        });
    }
    Ok(students)
}

#[tauri::command]
pub async fn bind_student_list_to_quiz(quiz_id: String, list_id: String, db: State<'_, DbState>) -> Result<(), AppError> {
    sqlx::query("INSERT OR REPLACE INTO quiz_student_lists (quiz_id, student_list_id) VALUES (?, ?)")
        .bind(&quiz_id)
        .bind(&list_id)
        .execute(&db.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn update_student(
    student_id: String,
    name: String,
    class_name: Option<String>,
    email: Option<String>,
    db: State<'_, DbState>,
) -> Result<(), AppError> {
    sqlx::query("UPDATE students SET name = ?, class_name = ?, email = ? WHERE id = ?")
        .bind(&name)
        .bind(&class_name)
        .bind(&email)
        .bind(&student_id)
        .execute(&db.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn delete_student(
    student_id: String,
    db: State<'_, DbState>,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM students WHERE id = ?")
        .bind(&student_id)
        .execute(&db.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn rename_student_list(
    list_id: String,
    new_name: String,
    db: State<'_, DbState>,
) -> Result<(), AppError> {
    sqlx::query("UPDATE student_lists SET name = ? WHERE id = ?")
        .bind(&new_name)
        .bind(&list_id)
        .execute(&db.pool)
        .await?;
    Ok(())
}
