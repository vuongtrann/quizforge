use tauri::{State, Manager};
use crate::database::DbState;
use crate::error::AppError;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use image::ImageFormat;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaFile {
    pub id: String,
    pub quiz_id: Option<String>,
    pub filename: String,
    pub mime_type: String,
    pub file_path: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub size_bytes: i64,
}

#[tauri::command]
pub async fn upload_media(
    quiz_id: Option<String>,
    file_path: String,
    db: State<'_, DbState>,
    app_handle: tauri::AppHandle,
) -> Result<MediaFile, AppError> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(AppError::NotFound(format!("File not found: {}", file_path)));
    }

    let extension = path.extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    let id = Uuid::new_v4().to_string();
    
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let media_dir = app_data_dir.join("media");
    fs::create_dir_all(&media_dir).map_err(|e| AppError::Internal(e.to_string()))?;

    let mut final_filename = format!("{}.{}", id, extension);
    let mut final_path = media_dir.join(&final_filename);
    let mut mime_type = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "m4a" => "audio/mp4",
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        "avi" => "video/x-msvideo",
        "mov" => "video/quicktime",
        _ => "application/octet-stream",
    };

    // Auto-convert images to WebP if they are jpg or png
    if extension == "jpg" || extension == "jpeg" || extension == "png" {
        let img = image::open(path).map_err(|e| AppError::Internal(format!("Failed to open image: {}", e)))?;
        final_filename = format!("{}.webp", id);
        final_path = media_dir.join(&final_filename);
        img.save_with_format(&final_path, ImageFormat::WebP)
            .map_err(|e| AppError::Internal(format!("Failed to convert to WebP: {}", e)))?;
        mime_type = "image/webp";
    } else {
        fs::copy(path, &final_path).map_err(|e| AppError::Internal(format!("Failed to copy file: {}", e)))?;
    }

    let size_bytes = fs::metadata(&final_path).map(|m| m.len() as i64).unwrap_or(0);
    
    // Get image dimensions if it's an image
    let (width, height) = if mime_type.starts_with("image/") {
        if let Ok(img) = image::open(&final_path) {
            (Some(img.width() as i32), Some(img.height() as i32))
        } else {
            (None, None)
        }
    } else {
        (None, None)
    };

    let media = MediaFile {
        id: id.clone(),
        quiz_id: quiz_id.clone(),
        filename: final_filename.clone(),
        mime_type: mime_type.to_string(),
        file_path: final_path.to_str()
            .ok_or_else(|| AppError::Internal("Invalid path encoding".to_string()))?
            .to_string(),
        width,
        height,
        size_bytes,
    };

    sqlx::query(
        r#"
        INSERT INTO media_files (id, quiz_id, filename, mime_type, file_path, width, height, size_bytes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&media.id)
    .bind(&media.quiz_id)
    .bind(&media.filename)
    .bind(&media.mime_type)
    .bind(&media.file_path)
    .bind(media.width)
    .bind(media.height)
    .bind(media.size_bytes)
    .execute(&db.pool)
    .await?;

    Ok(media)
}

#[tauri::command]
pub async fn delete_media(id: String, db: State<'_, DbState>) -> Result<(), AppError> {
    let row = sqlx::query("SELECT file_path FROM media_files WHERE id = ?")
        .bind(&id)
        .fetch_optional(&db.pool)
        .await?;

    if let Some(row) = row {
        let file_path: String = sqlx::Row::get(&row, "file_path");
        let path = Path::new(&file_path);
        if path.exists() {
            let _ = fs::remove_file(path);
        }
    }

    sqlx::query("DELETE FROM media_files WHERE id = ?")
        .bind(&id)
        .execute(&db.pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn get_media_data(id: String, db: State<'_, DbState>) -> Result<String, AppError> {
    let row = sqlx::query("SELECT file_path, mime_type FROM media_files WHERE id = ?")
        .bind(&id)
        .fetch_optional(&db.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Media {} not found", id)))?;

    let file_path: String = sqlx::Row::get(&row, "file_path");
    let mime_type: String = sqlx::Row::get(&row, "mime_type");
    let data = fs::read(file_path).map_err(|e| AppError::Internal(e.to_string()))?;

    use base64::{Engine as _, engine::general_purpose};
    let b64 = general_purpose::STANDARD.encode(data);
    Ok(format!("data:{};base64,{}", mime_type, b64))
}
