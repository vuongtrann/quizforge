use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::security::crypto;

#[derive(Debug, Serialize, Deserialize)]
pub struct QuestionAnswer {
    pub id: String,
    pub correct_answer: Value,
    pub points: f32,
    pub correct_feedback: Option<String>,
    pub incorrect_feedback: Option<String>,
}

#[derive(Default)]
pub struct QuizState {
    pub answers: Mutex<Option<Vec<QuestionAnswer>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuizBundle {
    pub display_data: Value,
    pub encrypted_answers: String,
    pub salt: String,
    pub nonce: String,
    pub timestamp: String,
}

#[tauri::command]
pub fn load_quiz_data(state: tauri::State<'_, QuizState>) -> Result<Value, String> {
    // Try to read from embedded data first
    let bundle: QuizBundle = match read_embedded_data() {
        Ok(data) => serde_json::from_slice(&data).map_err(|e| format!("Dữ liệu nhúng không hợp lệ: {}", e))?,
        Err(_) => {
            // Fallback to quiz.dat for dev mode
            let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
            path.pop();
            path.push("quiz.dat");

            if !path.exists() {
                return Err("Không tìm thấy dữ liệu bài thi (Embedded or quiz.dat).".to_string());
            }

            let raw_data = fs::read_to_string(&path).map_err(|e| format!("Không thể đọc quiz.dat: {}", e))?;
            serde_json::from_str(&raw_data).map_err(|e| format!("Định dạng quiz.dat không hợp lệ: {}", e))?
        }
    };

    // Decrypt answers
    let quiz_id = bundle.display_data["id"].as_str().unwrap_or("unknown");
    let decrypted_answers = crypto::decrypt_data(
        &bundle.encrypted_answers,
        quiz_id,
        &bundle.timestamp,
        &bundle.salt,
        &bundle.nonce
    )?;

    let answers: Vec<QuestionAnswer> = serde_json::from_str(&decrypted_answers)
        .map_err(|e| format!("Dữ liệu đáp án không hợp lệ: {}", e))?;

    // Save to state
    let mut state_answers = state.answers.lock().unwrap();
    *state_answers = Some(answers);

    Ok(bundle.display_data)
}

fn read_embedded_data() -> Result<Vec<u8>, String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let mut file = File::open(&exe_path).map_err(|e| e.to_string())?;
    
    let file_len = file.seek(SeekFrom::End(0)).map_err(|e| e.to_string())?;
    if file_len < 16 {
        return Err("File quá nhỏ".to_string());
    }

    // Read last 16 bytes: [8 bytes data_len][8 bytes MAGIC]
    file.seek(SeekFrom::End(-16)).map_err(|e| e.to_string())?;
    
    let mut trailer = [0u8; 16];
    file.read_exact(&mut trailer).map_err(|e| e.to_string())?;
    
    let magic = &trailer[8..16];
    if magic != b"QFFORGE\0" {
        return Err("No embedded data found".to_string());
    }
    
    let data_len = u64::from_le_bytes(trailer[0..8].try_into().unwrap());
    if data_len > file_len - 16 {
        return Err("Dữ liệu nhúng không hợp lệ (size mismatch)".to_string());
    }

    let data_offset = file_len - 16 - data_len;
    
    file.seek(SeekFrom::Start(data_offset)).map_err(|e| e.to_string())?;
    let mut data = vec![0u8; data_len as usize];
    file.read_exact(&mut data).map_err(|e| e.to_string())?;
    
    Ok(data)
}

#[tauri::command]
pub fn get_students() -> Result<Value, String> {
    // 1. Try embedded data first
    if let Ok(data) = read_embedded_data() {
        if let Ok(bundle) = serde_json::from_slice::<QuizBundleWithStudents>(&data) {
            if let Some(students) = bundle.students {
                return Ok(students);
            }
        }
    }

    // 2. Fallback to students.dat for dev/legacy
    let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
    path.pop();
    path.push("students.dat");

    if !path.exists() {
        return Ok(serde_json::json!([]));
    }

    let raw_data = fs::read_to_string(&path).map_err(|e| format!("Không thể đọc students.dat: {}", e))?;
    serde_json::from_str(&raw_data).map_err(|e| format!("Định dạng students.dat không hợp lệ: {}", e))
}

#[derive(Debug, Serialize, Deserialize)]
struct QuizBundleWithStudents {
    pub display_data: Value,
    pub encrypted_answers: String,
    pub students: Option<Value>, // Added students field
    pub salt: String,
    pub nonce: String,
    pub timestamp: String,
}

#[tauri::command]
pub fn save_quiz_state(state: Value) -> Result<(), String> {
    let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
    path.pop();
    path.push("resume.json");
    let json_str = serde_json::to_string(&state).map_err(|e| e.to_string())?;
    fs::write(path, json_str).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn load_quiz_state() -> Result<Value, String> {
    let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
    path.pop();
    path.push("resume.json");
    if !path.exists() {
        return Ok(serde_json::json!(null));
    }
    let raw_data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_quiz_state() -> Result<(), String> {
    let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
    path.pop();
    path.push("resume.json");
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
