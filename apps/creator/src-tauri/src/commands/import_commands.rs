use std::path::Path;
use calamine::{open_workbook, Reader, Xlsx, Data, DataType};
use rust_xlsxwriter::{Workbook, Format, Color, FormatAlign, FormatBorder};
use serde_json::Value;
use tauri::State;
use uuid::Uuid;
use crate::database::DbState;
use crate::error::AppError;

/// Generate an Excel template file for quiz import
#[tauri::command]
pub async fn generate_import_template(output_path: String) -> Result<(), AppError> {
    let mut workbook = Workbook::new();

    // ─── Formats ───
    let header_fmt = Format::new()
        .set_bold()
        .set_font_size(11.0)
        .set_background_color(Color::RGB(0x4472C4))
        .set_font_color(Color::White)
        .set_align(FormatAlign::Center)
        .set_border(FormatBorder::Thin);

    let example_fmt = Format::new()
        .set_font_size(11.0)
        .set_border(FormatBorder::Thin)
        .set_font_color(Color::RGB(0x808080))
        .set_italic();

    let type_fmt = Format::new()
        .set_font_size(11.0)
        .set_border(FormatBorder::Thin)
        .set_bold()
        .set_font_color(Color::RGB(0x4472C4));

    // ─── Sheet 1: Câu hỏi ───
    let sheet = workbook.add_worksheet();
    sheet.set_name("Câu hỏi").map_err(|e| AppError::Internal(e.to_string()))?;

    let headers = [
        ("STT", 5.0),
        ("Loại", 8.0),
        ("Nội dung câu hỏi", 40.0),
        ("Điểm", 7.0),
        ("Đáp án A", 20.0),
        ("Đáp án B", 20.0),
        ("Đáp án C", 20.0),
        ("Đáp án D", 20.0),
        ("Đáp án E", 20.0),
        ("Đáp án F", 20.0),
        ("Đáp án đúng", 15.0),
        ("Feedback đúng", 25.0),
        ("Feedback sai", 25.0),
    ];

    for (col, (name, width)) in headers.iter().enumerate() {
        sheet.write_string_with_format(0, col as u16, *name, &header_fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        sheet.set_column_width(col as u16, *width)
            .map_err(|e| AppError::Internal(e.to_string()))?;
    }

    // Example rows
    let examples: Vec<(&str, &str, f64, &[&str], &str, &str, &str)> = vec![
        // (type, question, points, options[], correct, fb_correct, fb_incorrect)
        ("TF", "Trái đất quay quanh mặt trời", 10.0,
         &[] as &[&str], "Đúng", "Chính xác!", "Sai rồi!"),
        ("MC", "Thủ đô của Việt Nam là gì?", 10.0,
         &["Hà Nội", "TP.HCM", "Đà Nẵng", "Huế"], "A", "Chính xác!", "Sai rồi!"),
        ("MR", "Chọn các số nguyên tố:", 15.0,
         &["2", "3", "4", "5", "6"], "A,B,D", "Chính xác!", "Sai rồi!"),
        ("FB", "Việt Nam có ___ tỉnh thành", 10.0,
         &[] as &[&str], "63", "Chính xác!", "Sai rồi!"),
        ("MT", "Nối thủ đô với quốc gia", 20.0,
         &["Hà Nội::Việt Nam", "Tokyo::Nhật Bản", "Seoul::Hàn Quốc"], "", "Chính xác!", "Sai rồi!"),
        ("SQ", "Sắp xếp theo thứ tự tăng dần", 15.0,
         &["Một", "Hai", "Ba", "Bốn"], "", "Chính xác!", "Sai rồi!"),
    ];

    for (row_idx, (q_type, question, points, options, correct, fb_ok, fb_bad)) in examples.iter().enumerate() {
        let row = (row_idx + 1) as u32;
        let fmt = if row_idx == 0 { &example_fmt } else { &example_fmt };

        sheet.write_number_with_format(row, 0, (row_idx + 1) as f64, fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        sheet.write_string_with_format(row, 1, *q_type, &type_fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        sheet.write_string_with_format(row, 2, *question, fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        sheet.write_number_with_format(row, 3, *points, fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        for (opt_idx, opt) in options.iter().enumerate() {
            sheet.write_string_with_format(row, (4 + opt_idx) as u16, *opt, fmt)
                .map_err(|e| AppError::Internal(e.to_string()))?;
        }

        sheet.write_string_with_format(row, 10, *correct, fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        sheet.write_string_with_format(row, 11, *fb_ok, fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        sheet.write_string_with_format(row, 12, *fb_bad, fmt)
            .map_err(|e| AppError::Internal(e.to_string()))?;
    }

    // ─── Sheet 2: Hướng dẫn ───
    let guide = workbook.add_worksheet();
    guide.set_name("Hướng dẫn").map_err(|e| AppError::Internal(e.to_string()))?;
    guide.set_column_width(0, 20.0).map_err(|e| AppError::Internal(e.to_string()))?;
    guide.set_column_width(1, 80.0).map_err(|e| AppError::Internal(e.to_string()))?;

    let title_fmt = Format::new()
        .set_bold()
        .set_font_size(14.0)
        .set_font_color(Color::RGB(0x4472C4));

    let section_fmt = Format::new()
        .set_bold()
        .set_font_size(11.0)
        .set_background_color(Color::RGB(0xD9E2F3))
        .set_border(FormatBorder::Thin);

    let guide_fmt = Format::new()
        .set_font_size(11.0)
        .set_text_wrap();

    guide.write_string_with_format(0, 0, "HƯỚNG DẪN IMPORT CÂU HỎI TỪ EXCEL", &title_fmt)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let instructions = [
        ("", ""),
        ("LOẠI CÂU HỎI", "MÃ SỬ DỤNG"),
        ("Đúng/Sai", "TF — Cột 'Đáp án đúng' ghi: Đúng hoặc Sai"),
        ("Trắc nghiệm (1 đáp án)", "MC — Điền đáp án vào cột A-F. Cột 'Đáp án đúng' ghi chữ cái: A, B, C..."),
        ("Trắc nghiệm (nhiều đáp án)", "MR — Giống MC nhưng cột 'Đáp án đúng' ghi nhiều chữ: A,B,D (phân cách bằng dấu phẩy)"),
        ("Điền vào chỗ trống", "FB — Dùng dấu ___ (3 gạch dưới) trong câu hỏi để đánh dấu chỗ trống. Cột 'Đáp án đúng' ghi đáp án (nhiều đáp án phân cách bằng dấu |)"),
        ("Nối cặp", "MT — Mỗi cặp ghi vào 1 ô đáp án theo format: Vế trái::Vế phải (phân cách bằng ::)"),
        ("Sắp xếp thứ tự", "SQ — Ghi các mục vào cột Đáp án A-F THEO THỨ TỰ ĐÚNG. Không cần điền cột 'Đáp án đúng'."),
        ("", ""),
        ("LƯU Ý QUAN TRỌNG", ""),
        ("1. Dòng đầu tiên", "Dòng 1 là tiêu đề cột, KHÔNG được xóa. Bắt đầu nhập từ dòng 2."),
        ("2. Cột STT", "Số thứ tự, có thể bỏ trống (hệ thống tự đánh)."),
        ("3. Cột Điểm", "Mặc định 10 nếu bỏ trống."),
        ("4. Cột Feedback", "Có thể bỏ trống, hệ thống sẽ dùng feedback mặc định."),
        ("5. Xóa dòng mẫu", "Hãy xóa các dòng ví dụ (in nghiêng) trước khi import."),
    ];

    for (row_idx, (col_a, col_b)) in instructions.iter().enumerate() {
        let row = (row_idx + 2) as u32;
        let fmt = if *col_a == "LOẠI CÂU HỎI" || *col_a == "LƯU Ý QUAN TRỌNG" {
            &section_fmt
        } else {
            &guide_fmt
        };
        if !col_a.is_empty() {
            guide.write_string_with_format(row, 0, *col_a, fmt)
                .map_err(|e| AppError::Internal(e.to_string()))?;
        }
        if !col_b.is_empty() {
            guide.write_string_with_format(row, 1, *col_b, fmt)
                .map_err(|e| AppError::Internal(e.to_string()))?;
        }
    }

    workbook.save(&output_path).map_err(|e| AppError::Internal(format!("Không thể lưu file template: {}", e)))?;
    Ok(())
}

/// Import quiz from Excel file
#[tauri::command]
pub async fn import_quiz_from_excel(
    file_path: String,
    quiz_title: String,
    db: State<'_, DbState>,
) -> Result<Value, AppError> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(AppError::Validation("File không tồn tại.".to_string()));
    }

    let mut workbook: Xlsx<_> = open_workbook(&file_path)
        .map_err(|e| AppError::Validation(format!("Không thể đọc file Excel: {}", e)))?;

    // Find the data sheet (first sheet or "Câu hỏi")
    let sheet_name = workbook.sheet_names().first()
        .ok_or_else(|| AppError::Validation("File Excel không có sheet nào.".to_string()))?
        .clone();

    let range = workbook.worksheet_range(&sheet_name)
        .map_err(|e| AppError::Validation(format!("Không thể đọc sheet: {}", e)))?;

    let rows: Vec<Vec<Data>> = range.rows().skip(1) // skip header
        .filter(|row| {
            // Skip empty rows
            row.iter().any(|cell| !cell.is_empty())
        })
        .map(|row| row.to_vec())
        .collect();

    if rows.is_empty() {
        return Err(AppError::Validation("File Excel không có dữ liệu câu hỏi nào (dòng 2 trở đi đều trống).".to_string()));
    }

    // Create quiz
    let quiz_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let information = serde_json::json!({
        "title": quiz_title,
        "author": "",
        "description": format!("Imported từ Excel — {} câu hỏi", rows.len()),
        "introMessage": "",
        "branding": { "logoUrl": "", "companyName": "" },
        "collectParticipantData": { "name": true, "email": false, "className": true, "studentId": false }
    });

    let default_settings = serde_json::json!({
        "timeLimit": { "enabled": false, "totalMinutes": 30 },
        "questionTimeLimit": { "enabled": false, "secondsPerQuestion": 60 },
        "randomization": { "shuffleQuestions": false, "shuffleOptions": false },
        "navigation": { "allowBacktrack": true, "showQuestionList": true },
        "submission": { "autoSubmit": false, "confirmBeforeSubmit": true },
        "attempts": { "maxAttempts": 1, "showCorrectAfterFail": false },
        "display": { "showPointsPerQuestion": true, "showQuestionNumber": true, "showProgressBar": true }
    });

    let result_settings = serde_json::json!({
        "showScore": true,
        "showPercentage": true,
        "showPassFail": true,
        "passingScore": 60,
        "showCorrectAnswers": true,
        "showStatistics": true,
        "passMessage": "Chúc mừng! Bạn đã đạt!",
        "failMessage": "Chưa đạt. Hãy cố gắng thêm!"
    });

    let security = serde_json::json!({
        "passwordProtection": { "enabled": false, "password": "" },
        "userList": { "enabled": false, "listId": "" },
        "domainRestriction": { "enabled": false, "allowedDomains": [] }
    });

    let theme = serde_json::json!({
        "primaryColor": "#4472C4",
        "backgroundColor": "#FFFFFF",
        "fontFamily": "Inter",
        "fontSize": "medium",
        "questionLayout": "card",
        "progressStyle": "bar",
        "navigationStyle": "bottom"
    });

    sqlx::query(
        r#"
        INSERT INTO quizzes (
            id, schema_version, information_json, settings_json,
            result_settings_json, security_json, theme_json,
            created_at, updated_at
        )
        VALUES (?, '1.0', ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&quiz_id)
    .bind(information.to_string())
    .bind(default_settings.to_string())
    .bind(result_settings.to_string())
    .bind(security.to_string())
    .bind(theme.to_string())
    .bind(&now)
    .bind(&now)
    .execute(&db.pool)
    .await?;

    // Parse and insert questions
    let mut questions_json = Vec::new();
    let mut errors: Vec<String> = Vec::new();

    for (idx, row) in rows.iter().enumerate() {
        let row_num = idx + 2; // 1-indexed, skip header
        match parse_question_row(row, idx as i64) {
            Ok(question) => {
                let q_id = question["id"].as_str().unwrap_or("").to_string();
                let q_type = question["type"].as_str().unwrap_or("multiple_choice").to_string();
                let order_index = question["order"].as_i64().unwrap_or(idx as i64);
                let text = question["text"].as_str().unwrap_or("").to_string();
                let points_correct = question["points"]["correct"].as_i64().unwrap_or(10);
                let points_incorrect = question["points"]["incorrect"].as_i64().unwrap_or(0);
                let feedback_correct = question["feedback"]["correct"].as_str().unwrap_or("Chính xác !").to_string();
                let feedback_incorrect = question["feedback"]["incorrect"].as_str().unwrap_or("Không chính xác !").to_string();

                // Extract type-specific data
                let mut type_data = question.clone();
                if let Some(obj) = type_data.as_object_mut() {
                    for key in &["id", "type", "order", "text", "richText", "media", "points", "feedback", "feedbackMode", "attempts", "branching", "group"] {
                        obj.remove(*key);
                    }
                }

                if let Err(e) = sqlx::query(
                    r#"
                    INSERT INTO questions (
                        id, quiz_id, type, order_index, text, rich_text,
                        points_correct, points_incorrect, feedback_correct, feedback_incorrect,
                        attempts, branching, question_group, type_data_json
                    )
                    VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 1, NULL, NULL, ?)
                    "#
                )
                .bind(&q_id)
                .bind(&quiz_id)
                .bind(&q_type)
                .bind(order_index)
                .bind(&text)
                .bind(points_correct)
                .bind(points_incorrect)
                .bind(&feedback_correct)
                .bind(&feedback_incorrect)
                .bind(type_data.to_string())
                .execute(&db.pool)
                .await {
                    errors.push(format!("Dòng {}: Lỗi lưu DB — {}", row_num, e));
                    continue;
                }

                questions_json.push(question);
            }
            Err(e) => {
                errors.push(format!("Dòng {}: {}", row_num, e));
            }
        }
    }

    if questions_json.is_empty() {
        // Clean up the empty quiz
        let _ = sqlx::query("DELETE FROM quizzes WHERE id = ?")
            .bind(&quiz_id)
            .execute(&db.pool)
            .await;
        return Err(AppError::Validation(format!(
            "Không import được câu hỏi nào.\n{}",
            errors.join("\n")
        )));
    }

    let total_points: i64 = questions_json.iter()
        .map(|q| q["points"]["correct"].as_i64().unwrap_or(10))
        .sum();

    Ok(serde_json::json!({
        "quizId": quiz_id,
        "imported": questions_json.len(),
        "total": rows.len(),
        "errors": errors,
        "totalPoints": total_points,
        "title": quiz_title
    }))
}

fn cell_to_string(cell: &Data) -> String {
    match cell {
        Data::String(s) => s.trim().to_string(),
        Data::Float(f) => {
            // If the float is a whole number, show without decimal
            if *f == f.floor() && f.is_finite() {
                format!("{}", *f as i64)
            } else {
                format!("{}", f)
            }
        }
        Data::Int(i) => format!("{}", i),
        Data::Bool(b) => if *b { "Đúng".to_string() } else { "Sai".to_string() },
        Data::DateTime(dt) => format!("{}", dt),
        _ => String::new(),
    }
}

fn get_cell(row: &[Data], col: usize) -> String {
    row.get(col).map(cell_to_string).unwrap_or_default()
}

fn parse_question_row(row: &[Data], order: i64) -> Result<Value, String> {
    let q_type_raw = get_cell(row, 1).to_uppercase();
    let question_text = get_cell(row, 2);
    let points_str = get_cell(row, 3);
    let correct_answer = get_cell(row, 10);
    let feedback_correct = get_cell(row, 11);
    let feedback_incorrect = get_cell(row, 12);

    if question_text.is_empty() {
        return Err("Nội dung câu hỏi trống.".to_string());
    }

    let q_type = match q_type_raw.as_str() {
        "TF" => "true_false",
        "MC" => "multiple_choice",
        "MR" => "multiple_response",
        "FB" => "fill_in_blank",
        "MT" => "matching",
        "SQ" => "sequence",
        other => return Err(format!("Loại câu hỏi '{}' không hợp lệ. Dùng: TF, MC, MR, FB, MT, SQ", other)),
    };

    let points: f64 = if points_str.is_empty() {
        10.0
    } else {
        points_str.parse::<f64>().map_err(|_| format!("Điểm '{}' không hợp lệ", points_str))?
    };

    let id = Uuid::new_v4().to_string();
    let fb_ok = if feedback_correct.is_empty() { "Chính xác !".to_string() } else { feedback_correct };
    let fb_bad = if feedback_incorrect.is_empty() { "Không chính xác !".to_string() } else { feedback_incorrect };

    // Get options from columns E-J (index 4-9)
    let options_raw: Vec<String> = (4..=9)
        .map(|col| get_cell(row, col))
        .filter(|s| !s.is_empty())
        .collect();

    let mut question = serde_json::json!({
        "id": id,
        "type": q_type,
        "order": order,
        "text": question_text,
        "points": { "correct": points as i64, "incorrect": 0 },
        "feedback": { "correct": fb_ok, "incorrect": fb_bad },
        "feedbackMode": "by_question",
        "attempts": 1
    });

    match q_type {
        "true_false" => {
            let answer = correct_answer.to_lowercase();
            let correct = match answer.as_str() {
                "đúng" | "dung" | "true" | "d" | "t" | "1" | "yes" | "có" | "co" => "true",
                "sai" | "false" | "s" | "f" | "0" | "no" | "không" | "khong" => "false",
                _ => return Err(format!("Đáp án Đúng/Sai '{}' không hợp lệ. Ghi: Đúng hoặc Sai", correct_answer)),
            };
            question["correctAnswer"] = Value::String(correct.to_string());
        }

        "multiple_choice" => {
            if options_raw.len() < 2 {
                return Err("Trắc nghiệm cần ít nhất 2 đáp án (cột E, F).".to_string());
            }
            if correct_answer.is_empty() {
                return Err("Thiếu đáp án đúng cho câu trắc nghiệm.".to_string());
            }
            let correct_idx = letter_to_index(&correct_answer)?;
            if correct_idx >= options_raw.len() {
                return Err(format!("Đáp án đúng '{}' vượt quá số lượng đáp án ({} đáp án)", correct_answer, options_raw.len()));
            }

            let options: Vec<Value> = options_raw.iter().enumerate().map(|(i, text)| {
                serde_json::json!({
                    "id": Uuid::new_v4().to_string(),
                    "text": text,
                    "isCorrect": i == correct_idx
                })
            }).collect();
            question["options"] = Value::Array(options);
            question["shuffleOptions"] = Value::Bool(false);
        }

        "multiple_response" => {
            if options_raw.len() < 2 {
                return Err("Trắc nghiệm nhiều đáp án cần ít nhất 2 đáp án.".to_string());
            }
            if correct_answer.is_empty() {
                return Err("Thiếu đáp án đúng cho câu trắc nghiệm nhiều đáp án.".to_string());
            }

            let correct_indices: Vec<usize> = correct_answer
                .split(',')
                .map(|s| letter_to_index(s.trim()))
                .collect::<Result<Vec<_>, _>>()?;

            for &idx in &correct_indices {
                if idx >= options_raw.len() {
                    return Err(format!("Đáp án đúng chứa chữ cái vượt quá số lượng đáp án"));
                }
            }

            let options: Vec<Value> = options_raw.iter().enumerate().map(|(i, text)| {
                serde_json::json!({
                    "id": Uuid::new_v4().to_string(),
                    "text": text,
                    "isCorrect": correct_indices.contains(&i)
                })
            }).collect();
            question["options"] = Value::Array(options);
            question["shuffleOptions"] = Value::Bool(false);
            question["partialScoring"] = Value::Bool(true);
        }

        "fill_in_blank" => {
            // Replace ___ with {{blank_id}} in text
            let mut template = question_text.clone();
            let mut blanks = Vec::new();

            // Split answers by | for multiple blanks
            let answers: Vec<&str> = if correct_answer.is_empty() {
                return Err("Thiếu đáp án cho câu điền vào chỗ trống.".to_string());
            } else {
                correct_answer.split('|').collect()
            };

            for (i, answer) in answers.iter().enumerate() {
                let blank_id = Uuid::new_v4().to_string();
                let placeholder = format!("{{{{{}}}}}", blank_id);

                // Replace first occurrence of ___
                if let Some(pos) = template.find("___") {
                    template.replace_range(pos..pos + 3, &placeholder);
                } else if i == 0 {
                    // If no ___ found, append blank at end
                    template.push_str(&format!(" {}", placeholder));
                }

                // Support multiple acceptable answers separated by ;
                let acceptable: Vec<Value> = answer.split(';')
                    .map(|a| Value::String(a.trim().to_string()))
                    .collect();

                blanks.push(serde_json::json!({
                    "id": blank_id,
                    "acceptableAnswers": acceptable,
                    "caseSensitive": false,
                    "trimWhitespace": true
                }));
            }

            question["text"] = Value::String(template.clone());
            question["template"] = Value::String(template);
            question["blanks"] = Value::Array(blanks);
        }

        "matching" => {
            // Pairs in format "left::right" in option columns
            if options_raw.is_empty() {
                return Err("Câu nối cặp cần ít nhất 1 cặp (format: Vế trái::Vế phải).".to_string());
            }

            let mut pairs = Vec::new();
            for (i, opt) in options_raw.iter().enumerate() {
                let parts: Vec<&str> = opt.splitn(2, "::").collect();
                if parts.len() != 2 {
                    return Err(format!("Cặp thứ {} '{}' không đúng format. Dùng: Vế trái::Vế phải", i + 1, opt));
                }
                pairs.push(serde_json::json!({
                    "id": Uuid::new_v4().to_string(),
                    "choice": parts[0].trim(),
                    "match": parts[1].trim()
                }));
            }
            question["pairs"] = Value::Array(pairs);
            question["shuffleOptions"] = Value::Bool(true);
        }

        "sequence" => {
            // Items in option columns, already in correct order
            if options_raw.len() < 2 {
                return Err("Câu sắp xếp cần ít nhất 2 mục.".to_string());
            }

            let items: Vec<Value> = options_raw.iter().enumerate().map(|(i, text)| {
                serde_json::json!({
                    "id": Uuid::new_v4().to_string(),
                    "text": text,
                    "correctOrder": i
                })
            }).collect();
            question["items"] = Value::Array(items);
        }

        _ => {}
    }

    Ok(question)
}

fn letter_to_index(letter: &str) -> Result<usize, String> {
    match letter.trim().to_uppercase().as_str() {
        "A" => Ok(0),
        "B" => Ok(1),
        "C" => Ok(2),
        "D" => Ok(3),
        "E" => Ok(4),
        "F" => Ok(5),
        other => Err(format!("Chữ cái '{}' không hợp lệ. Dùng A-F.", other)),
    }
}
