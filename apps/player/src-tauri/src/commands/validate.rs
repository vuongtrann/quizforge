use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;
use crate::commands::quiz_loader::QuizState;

#[derive(Serialize)]
pub struct ValidationResult {
    pub is_correct: bool,
    pub points_earned: f32,
    pub correct_feedback: Option<String>,
    pub incorrect_feedback: Option<String>,
}

#[tauri::command]
pub fn validate_answer(
    question_id: String, 
    answer: Value, 
    state: State<'_, QuizState>
) -> Result<ValidationResult, String> {
    let answers_guard = state.answers.lock().unwrap();
    let answers = answers_guard.as_ref().ok_or("Quiz data not loaded")?;

    let q_answer = answers.iter()
        .find(|a| a.id == question_id)
        .ok_or("Question not found")?;

    let question_type = q_answer.correct_answer.get("type").and_then(|t| t.as_str()).unwrap_or("unknown");
    let mut is_correct = false;
    let mut points_ratio: f32 = 0.0;

    match question_type {
        "true_false" | "multiple_choice" => {
            is_correct = q_answer.correct_answer["value"] == answer;
            if is_correct { points_ratio = 1.0; }
        },
        "multiple_response" => {
            let correct_ids = q_answer.correct_answer["value"].as_array().ok_or("Invalid correct answer format")?;
            let selected_ids = answer.as_array().ok_or("Invalid selected answer format")?;

            let n_correct = correct_ids.len() as f32;
            if n_correct > 0.0 {
                let mut net_score: f32 = 0.0;
                for id in selected_ids {
                    if correct_ids.contains(id) {
                        net_score += 1.0 / n_correct;
                    } else {
                        net_score -= 1.0 / n_correct; // penalty for wrong selection
                    }
                }
                points_ratio = net_score.clamp(0.0, 1.0);
                is_correct = points_ratio >= 1.0;
            }
        },
        "fill_in_blank" => {
            // answer is a Map<blank_id, string>
            let correct_blanks = q_answer.correct_answer["blanks"].as_object().ok_or("Invalid blanks format")?;
            let selected_blanks = answer.as_object().ok_or("Invalid selected blanks format")?;
            
            let mut correct_count = 0;
            for (id, val) in correct_blanks {
                if let Some(selected_val) = selected_blanks.get(id).and_then(|v| v.as_str()) {
                    let acceptable = val["acceptable"].as_array().unwrap();
                    let case_sensitive = val["case_sensitive"].as_bool().unwrap_or(false);
                    
                    let mut matched = false;
                    for acc in acceptable {
                        let acc_str = acc.as_str().unwrap_or("");
                        if case_sensitive {
                            if acc_str == selected_val { matched = true; break; }
                        } else {
                            if acc_str.to_lowercase() == selected_val.to_lowercase() { matched = true; break; }
                        }
                    }
                    if matched { correct_count += 1; }
                }
            }
            if correct_count == correct_blanks.len() {
                is_correct = true;
                points_ratio = 1.0;
            }
        },
        "matching" => {
            // answer is Map<left_id, right_id>
            is_correct = q_answer.correct_answer["value"] == answer;
            if is_correct { points_ratio = 1.0; }
        },
        "sequence" => {
            // answer is Array<id>
            is_correct = q_answer.correct_answer["value"] == answer;
            if is_correct { points_ratio = 1.0; }
        },
        "word_bank" => {
            // answer is Map<slot_id, word_id>
            is_correct = q_answer.correct_answer["value"] == answer;
            if is_correct { points_ratio = 1.0; }
        },
        "click_map" => {
            // answer is {x: f64, y: f64} — percentage coords (0–100)
            // correct_answer["hotspots"] = Array<{shape, coords, isCorrect}>
            if let (Some(ax), Some(ay)) = (answer["x"].as_f64(), answer["y"].as_f64()) {
                if let Some(hotspots) = q_answer.correct_answer["hotspots"].as_array() {
                    for hs in hotspots {
                        let is_hs_correct = hs["isCorrect"].as_bool().unwrap_or(false);
                        if !is_hs_correct { continue; }
                        let shape = hs["shape"].as_str().unwrap_or("rect");
                        let coords = hs["coords"].as_array().map(|a| a.iter().filter_map(|v| v.as_f64()).collect::<Vec<_>>()).unwrap_or_default();
                        let hit = match shape {
                            "rect" if coords.len() >= 4 => {
                                let (x1, y1, x2, y2) = (coords[0], coords[1], coords[2], coords[3]);
                                ax >= x1 && ax <= x2 && ay >= y1 && ay <= y2
                            },
                            "circle" if coords.len() >= 3 => {
                                let (cx, cy, r) = (coords[0], coords[1], coords[2]);
                                ((ax - cx).powi(2) + (ay - cy).powi(2)).sqrt() <= r
                            },
                            _ => false,
                        };
                        if hit { is_correct = true; points_ratio = 1.0; break; }
                    }
                }
            }
        },
        _ => {
            // default to simple comparison
            is_correct = q_answer.correct_answer["value"] == answer;
            if is_correct { points_ratio = 1.0; }
        }
    }
    
    Ok(ValidationResult {
        is_correct,
        points_earned: points_ratio * q_answer.points,
        correct_feedback: q_answer.correct_feedback.clone(),
        incorrect_feedback: q_answer.incorrect_feedback.clone(),
    })
}
