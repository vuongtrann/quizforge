use std::fs::{self, File};
use std::io::{Write, Read};
use serde_json::Value;
use rand::Rng;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce, Key
};
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use base64::{Engine as _, engine::general_purpose};
use zip::{write::FileOptions, read::ZipArchive};
use tauri::{State, Manager};
use crate::database::DbState;
use crate::error::AppError;
use sqlx::Row;
use std::path::Path;

#[tauri::command]
pub async fn export_quiz_to_qfz(
    quiz_id: String, 
    export_path: String, 
    db: State<'_, DbState>
) -> Result<(), AppError> {
    let quiz = sqlx::query("SELECT * FROM quizzes WHERE id = ?")
        .bind(&quiz_id)
        .fetch_optional(&db.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Quiz {} not found", quiz_id)))?;

    let questions = sqlx::query("SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC")
        .bind(&quiz_id)
        .fetch_all(&db.pool)
        .await?;

    if questions.is_empty() {
        return Err(AppError::Validation("Cần ít nhất 1 câu hỏi để xuất file QFZ.".to_string()));
    }

    let media_files = sqlx::query("SELECT * FROM media_files WHERE quiz_id = ?")
        .bind(&quiz_id)
        .fetch_all(&db.pool)
        .await?;

    let file = File::create(&export_path).map_err(|e| AppError::Internal(e.to_string()))?;
    let mut zip = zip::ZipWriter::new(file);
    let options: FileOptions<'_, ()> = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 1. Write manifest
    zip.start_file("manifest.json", options).map_err(|e| AppError::Internal(e.to_string()))?;
    let manifest = serde_json::json!({
        "version": "1.0",
        "type": "quiz_forge_package",
        "quizId": quiz_id,
        "exportedAt": chrono::Utc::now().to_rfc3339(),
        "mediaCount": media_files.len(),
        "questionCount": questions.len()
    });
    zip.write_all(manifest.to_string().as_bytes()).map_err(|e| AppError::Internal(e.to_string()))?;
    
    // 2. Write quiz.json (metadata + settings)
    zip.start_file("quiz.json", options).map_err(|e| AppError::Internal(e.to_string()))?;
    let quiz_meta = serde_json::json!({
        "id": quiz_id,
        "schemaVersion": quiz.get::<String, _>("schema_version"),
        "information": serde_json::from_str::<Value>(&quiz.get::<String, _>("information_json")).unwrap_or_default(),
        "settings": serde_json::from_str::<Value>(&quiz.get::<String, _>("settings_json")).unwrap_or_default(),
        "result": serde_json::from_str::<Value>(&quiz.get::<String, _>("result_settings_json")).unwrap_or_default(),
        "security": serde_json::from_str::<Value>(&quiz.get::<String, _>("security_json")).unwrap_or_default()
    });
    zip.write_all(quiz_meta.to_string().as_bytes()).map_err(|e| AppError::Internal(e.to_string()))?;

    // 3. Write questions.json
    zip.start_file("questions.json", options).map_err(|e| AppError::Internal(e.to_string()))?;
    let mut qs = Vec::new();
    for q_row in questions {
        let mut q_json = serde_json::json!({
            "id": q_row.get::<String, _>("id"),
            "type": q_row.get::<String, _>("type"),
            "order": q_row.get::<i64, _>("order_index"),
            "text": q_row.get::<String, _>("text"),
            "richText": q_row.get::<Option<String>, _>("rich_text"),
            "mediaId": q_row.get::<Option<String>, _>("media_id"),
            "points": {
                "correct": q_row.get::<i64, _>("points_correct"),
                "incorrect": q_row.get::<i64, _>("points_incorrect")
            },
            "feedback": {
                "correct": q_row.get::<String, _>("feedback_correct"),
                "incorrect": q_row.get::<String, _>("feedback_incorrect")
            }
        });
        
        let type_data_json: String = q_row.get("type_data_json");
        if let Ok(parsed_type_data) = serde_json::from_str::<Value>(&type_data_json) {
            if let Some(obj) = q_json.as_object_mut() {
                if let Some(type_data_obj) = parsed_type_data.as_object() {
                    for (k, v) in type_data_obj {
                        obj.insert(k.clone(), v.clone());
                    }
                }
            }
        }
        qs.push(q_json);
    }
    zip.write_all(serde_json::to_string(&qs).map_err(|e| AppError::Internal(e.to_string()))?.as_bytes()).map_err(|e| AppError::Internal(e.to_string()))?;

    // 4. Write theme.json
    zip.start_file("theme.json", options).map_err(|e| AppError::Internal(e.to_string()))?;
    let theme_json: String = quiz.get("theme_json");
    zip.write_all(theme_json.as_bytes()).map_err(|e| AppError::Internal(e.to_string()))?;

    // 5. Write media/ folder
    for m_row in media_files {
        let filename: String = m_row.get("filename");
        let file_path: String = m_row.get("file_path");
        let zip_path = format!("media/{}", filename);
        
        if Path::new(&file_path).exists() {
            zip.start_file(zip_path, options).map_err(|e| AppError::Internal(e.to_string()))?;
            let data = fs::read(file_path).map_err(|e| AppError::Internal(e.to_string()))?;
            zip.write_all(&data).map_err(|e| AppError::Internal(e.to_string()))?;
        }
    }
    
    // 6. Export student lists associated with this quiz
    let student_lists = sqlx::query(
        "SELECT sl.id, sl.name FROM student_lists sl
         JOIN quiz_student_lists qsl ON qsl.student_list_id = sl.id
         WHERE qsl.quiz_id = ?"
    )
    .bind(&quiz_id)
    .fetch_all(&db.pool)
    .await
    .unwrap_or_default();

    let mut all_students: Vec<serde_json::Value> = Vec::new();
    for list in &student_lists {
        let list_id: String = list.get("id");
        let list_name: String = list.get("name");
        let students = sqlx::query("SELECT * FROM students WHERE list_id = ?")
            .bind(&list_id)
            .fetch_all(&db.pool)
            .await
            .unwrap_or_default();
        for s in students {
            all_students.push(serde_json::json!({
                "id": s.get::<String, _>("id"),
                "studentId": s.get::<String, _>("student_id"),
                "name": s.get::<String, _>("name"),
                "className": s.get::<Option<String>, _>("class_name"),
                "email": s.get::<Option<String>, _>("email"),
                "listId": list_id,
                "listName": list_name,
            }));
        }
    }

    let students_json = serde_json::to_string(&all_students)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    zip.start_file("students.json", options).map_err(|e| AppError::Internal(e.to_string()))?;
    zip.write_all(students_json.as_bytes()).map_err(|e| AppError::Internal(e.to_string()))?;

    zip.finish().map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn prepare_player_bundle(
    quiz: Value,
    students: Value,
    output_path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Guard: quiz must have at least 1 question
    let question_count = quiz["questions"].as_array().map(|q| q.len()).unwrap_or(0);
    if question_count == 0 {
        return Err("Cần ít nhất 1 câu hỏi để xuất bài thi.".to_string());
    }

    // 1. Read player template from resources
    let resource_path = app_handle.path().resource_dir().map_err(|e| e.to_string())?
        .join("resources")
        .join("player-template.exe");
    
    // Fallback for dev mode
    let template_path = if resource_path.exists() {
        resource_path
    } else {
        // Look in relative paths for dev
        let mut dev_path = std::path::PathBuf::from("../../player/src-tauri/target/release/quizforge-player.exe");
        if !dev_path.exists() {
            dev_path = std::path::PathBuf::from("../../player/src-tauri/target/debug/quizforge-player.exe");
        }
        dev_path
    };

    if !template_path.exists() {
        return Err(format!("Không tìm thấy file mẫu Player tại {:?}", template_path));
    }

    let template_bytes = fs::read(&template_path).map_err(|e| format!("Không thể đọc file mẫu: {}", e))?;

    // 2. Prepare payload
    let (display_json, answers_json) = split_quiz_data(&quiz);
    let quiz_id = quiz["id"].as_str().unwrap_or("unknown");
    let timestamp = chrono::Utc::now().timestamp().to_string();

    // Encryption
    let mut salt = [0u8; 16];
    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill_bytes(&mut salt);
    rand::rng().fill_bytes(&mut nonce_bytes);

    let mut key_bytes = [0u8; 32];
    let password = format!("{}{}", quiz_id, timestamp);
    pbkdf2_hmac::<Sha256>(password.as_bytes(), &salt, 100_000, &mut key_bytes);

    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let encrypted_answers = cipher.encrypt(nonce, answers_json.to_string().as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Build the final bundle JSON
    let bundle = serde_json::json!({
        "display_data": display_json,
        "encrypted_answers": general_purpose::STANDARD.encode(encrypted_answers),
        "students": students, // Included student list (optional)
        "salt": general_purpose::STANDARD.encode(salt),
        "nonce": general_purpose::STANDARD.encode(nonce_bytes),
        "timestamp": timestamp
    });

    let payload_bytes = serde_json::to_vec(&bundle).map_err(|e| e.to_string())?;

    // 3. Write: Template + Payload + [PayloadLen (8b)] + [MAGIC (8b)]
    let mut final_file = File::create(&output_path).map_err(|e| format!("Không thể tạo file đầu ra: {}", e))?;
    final_file.write_all(&template_bytes).map_err(|e| e.to_string())?;
    final_file.write_all(&payload_bytes).map_err(|e| e.to_string())?;
    
    // Trailer: length as u64 LE + magic
    final_file.write_all(&(payload_bytes.len() as u64).to_le_bytes()).map_err(|e| e.to_string())?;
    final_file.write_all(b"QFFORGE\0").map_err(|e| e.to_string())?;

    Ok(())
}

fn split_quiz_data(quiz: &Value) -> (Value, Value) {
    let mut display = quiz.clone();
    let mut answers = Vec::new();

    if let Some(questions) = display["questions"].as_array_mut() {
        for q in questions {
            let q_type = q["type"].as_str().unwrap_or("unknown");
            let q_id = q["id"].clone();
            // Store only the correct points value as f32-compatible number
            let points = q["points"]["correct"].as_f64().unwrap_or(10.0);
            let correct_feedback = q["feedback"]["correct"].as_str().map(String::from);
            let incorrect_feedback = q["feedback"]["incorrect"].as_str().map(String::from);

            let correct_answer = match q_type {
                "true_false" => {
                    serde_json::json!({
                        "type": "true_false",
                        "value": q["correctAnswer"]
                    })
                }
                "multiple_choice" => {
                    let correct_id = q["options"].as_array()
                        .and_then(|opts| {
                            opts.iter().find(|o| o["isCorrect"].as_bool().unwrap_or(false))
                        })
                        .map(|o| o["id"].clone())
                        .unwrap_or(Value::Null);
                    serde_json::json!({ "type": "multiple_choice", "value": correct_id })
                }
                "multiple_response" => {
                    let correct_ids: Vec<Value> = q["options"].as_array()
                        .map(|opts| {
                            opts.iter()
                                .filter(|o| o["isCorrect"].as_bool().unwrap_or(false))
                                .map(|o| o["id"].clone())
                                .collect()
                        })
                        .unwrap_or_default();
                    serde_json::json!({ "type": "multiple_response", "value": correct_ids })
                }
                "fill_in_blank" => {
                    let blanks_map: serde_json::Map<String, Value> = q["blanks"].as_array()
                        .map(|blanks| {
                            blanks.iter().filter_map(|b| {
                                let id = b["id"].as_str()?.to_string();
                                let val = serde_json::json!({
                                    "acceptable": b["acceptableAnswers"],
                                    "case_sensitive": b["caseSensitive"].as_bool().unwrap_or(false)
                                });
                                Some((id, val))
                            }).collect()
                        })
                        .unwrap_or_default();
                    serde_json::json!({ "type": "fill_in_blank", "blanks": blanks_map })
                }
                "matching" => {
                    // Map: choice_id → match text (correct pairing)
                    let pairs_map: serde_json::Map<String, Value> = q["pairs"].as_array()
                        .map(|pairs| {
                            pairs.iter().filter_map(|p| {
                                let id = p["id"].as_str()?.to_string();
                                Some((id, p["match"].clone()))
                            }).collect()
                        })
                        .unwrap_or_default();
                    serde_json::json!({ "type": "matching", "value": pairs_map })
                }
                "sequence" => {
                    // Sort items by correctOrder → produce ordered ID array
                    let mut items: Vec<(i64, Value)> = q["items"].as_array()
                        .map(|items| {
                            items.iter().map(|item| {
                                (item["correctOrder"].as_i64().unwrap_or(0), item["id"].clone())
                            }).collect()
                        })
                        .unwrap_or_default();
                    items.sort_by_key(|(order, _)| *order);
                    let ordered_ids: Vec<Value> = items.into_iter().map(|(_, id)| id).collect();
                    serde_json::json!({ "type": "sequence", "value": ordered_ids })
                }
                "word_bank" => {
                    // wordAnswers is { slot_id: word_id } stored by editor
                    serde_json::json!({
                        "type": "word_bank",
                        "value": q["wordAnswers"]
                    })
                }
                "click_map" => {
                    // Store hotspot definitions for server-side hit detection
                    serde_json::json!({
                        "type": "click_map",
                        "hotspots": q["hotspots"]
                    })
                }
                "short_essay" => {
                    serde_json::json!({
                        "type": "short_essay",
                        "keywords": q["keywords"],
                        "evaluationGuide": q["evaluationGuide"]
                    })
                }
                _ => {
                    serde_json::json!({ "type": q_type, "value": Value::Null })
                }
            };

            answers.push(serde_json::json!({
                "id": q_id,
                "points": points,
                "correct_feedback": correct_feedback,
                "incorrect_feedback": incorrect_feedback,
                "correct_answer": correct_answer
            }));

            // Strip answer data from display copy
            if let Some(obj) = q.as_object_mut() {
                obj.remove("correctAnswer"); // true_false
                // Remove isCorrect from options (MC/MR)
                if let Some(opts) = obj.get_mut("options").and_then(|o| o.as_array_mut()) {
                    for opt in opts.iter_mut() {
                        if let Some(opt_obj) = opt.as_object_mut() {
                            opt_obj.remove("isCorrect");
                        }
                    }
                }
                // Remove wordAnswers (word_bank)
                obj.remove("wordAnswers");
            }
        }
    }
    (display, Value::Array(answers))
}

#[tauri::command]
pub async fn import_quiz_from_qfz(
    qfz_path: String, 
    db: State<'_, DbState>, 
    app_handle: tauri::AppHandle
) -> Result<Value, AppError> {
    let file = File::open(&qfz_path)
        .map_err(|_| AppError::Validation("Không thể mở file. File có thể bị hỏng hoặc không phải định dạng QFZ.".to_string()))?;
    let mut archive = ZipArchive::new(file)
        .map_err(|_| AppError::Validation("File QFZ không hợp lệ hoặc bị hỏng.".to_string()))?;

    // 1. Read manifest + version check
    let manifest: Value = {
        let mut manifest_file = archive.by_name("manifest.json")
            .map_err(|_| AppError::Validation("File QFZ thiếu manifest.json — file có thể bị hỏng.".to_string()))?;
        serde_json::from_reader(&mut manifest_file)
            .map_err(|_| AppError::Validation("manifest.json không đọc được — file bị hỏng.".to_string()))?
    };

    // Version migration: current supported = "1.0"
    let file_version = manifest["version"].as_str().unwrap_or("1.0");
    let current_version = "1.0";
    if file_version != current_version {
        // For now: warn but still attempt import (forward compatibility)
        eprintln!("[QFZ Import] Version mismatch: file={}, app={} — attempting migration", file_version, current_version);
    }
    
    // 2. Read quiz
    let quiz_meta: Value = {
        let mut quiz_file = archive.by_name("quiz.json").map_err(|_| AppError::Internal("Quiz metadata not found in QFZ".into()))?;
        serde_json::from_reader(&mut quiz_file).map_err(|e| AppError::Internal(e.to_string()))?
    };

    // 3. Read questions
    let questions_data: Value = {
        let mut q_file = archive.by_name("questions.json").map_err(|_| AppError::Internal("Questions not found in QFZ".into()))?;
        serde_json::from_reader(&mut q_file).map_err(|e| AppError::Internal(e.to_string()))?
    };

    // 4. Read theme
    let theme_data: String = {
        let mut t_file = archive.by_name("theme.json").map_err(|_| AppError::Internal("Theme not found in QFZ".into()))?;
        let mut s = String::new();
        t_file.read_to_string(&mut s).map_err(|e| AppError::Internal(e.to_string()))?;
        s
    };

    // Construct full quiz object for save_quiz_object_to_db
    let mut full_quiz = quiz_meta.clone();
    if let Some(obj) = full_quiz.as_object_mut() {
        obj.insert("questions".to_string(), questions_data);
        obj.insert("theme".to_string(), serde_json::from_str(&theme_data).unwrap_or_default());
    }

    // 5. Save to database
    let new_id = crate::commands::quiz_commands::save_quiz_object_to_db(full_quiz.clone(), &db.pool)
        .await?;
    
    // 6. Handle media
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let media_dir = app_data_dir.join("media");
    fs::create_dir_all(&media_dir).map_err(|e| AppError::Internal(e.to_string()))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| AppError::Internal(e.to_string()))?;
        if file.name().starts_with("media/") && !file.is_dir() {
            let filename = file.name().strip_prefix("media/").unwrap_or_default().to_string();
            let dest_path = media_dir.join(&filename);
            let mut dest_file = File::create(&dest_path).map_err(|e| AppError::Internal(e.to_string()))?;
            std::io::copy(&mut file, &mut dest_file).map_err(|e| AppError::Internal(e.to_string()))?;

            // Record media in DB if not exists
            let id = filename.split('.').next().unwrap_or("").to_string();
            let ext = filename.split('.').last().unwrap_or("").to_string();
            let mime_type = match ext.as_str() {
                "webp" => "image/webp",
                "mp3" => "audio/mpeg",
                "mp4" => "video/mp4",
                _ => "application/octet-stream"
            };
            let size = fs::metadata(&dest_path).map(|m| m.len() as i64).unwrap_or(0);

            sqlx::query(
                "INSERT OR IGNORE INTO media_files (id, quiz_id, filename, mime_type, file_path, size_bytes) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(id)
            .bind(&new_id)
            .bind(filename)
            .bind(mime_type)
            .bind(dest_path.to_str().unwrap_or(""))
            .bind(size)
            .execute(&db.pool)
            .await?;
        }
    }
    
    // 7. Return the full quiz object with new ID
    let mut created_quiz = full_quiz.clone();
    if let Some(obj) = created_quiz.as_object_mut() {
        obj.insert("id".to_string(), Value::String(new_id));
    }
    
    Ok(created_quiz)
}
