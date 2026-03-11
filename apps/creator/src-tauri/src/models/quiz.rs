use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Quiz {
    pub id: String,
    pub schema_version: String,
    pub created_at: String,
    pub updated_at: String,
    
    // In Rust we can parse the JSON fields or just pass them as generic Values, 
    // but the frontend requires them un-stringified.
    pub information: serde_json::Value,
    pub settings: serde_json::Value,
    pub result: serde_json::Value,
    pub security: serde_json::Value,
    pub theme: serde_json::Value,
    
    // Populated from questions table
    pub questions: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizSummary {
    pub id: String,
    pub title: String,
    pub author: Option<String>,
    pub question_count: i64,
    pub total_points: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateQuizDto {
    pub title: String,
    pub author: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateQuizDto {
    pub information: Option<serde_json::Value>,
    pub settings: Option<serde_json::Value>,
    pub result: Option<serde_json::Value>,
    pub security: Option<serde_json::Value>,
    pub theme: Option<serde_json::Value>,
}
