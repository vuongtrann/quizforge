use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub result_server_url: String,
    pub lan_receive_port: u16,
    pub heartbeat_port: u16,
    pub auto_update_enabled: bool,
    pub theme: String,
    pub language: String,
    pub default_passing_rate: u16,
    pub default_points_correct: i64,
    pub default_points_incorrect: i64,
    pub default_feedback_correct: String,
    pub default_feedback_incorrect: String,
    pub media_max_size_mb: u64,
    pub branding_org_name: String,
    pub branding_website: String,
    pub branding_app_name: String,
    pub branding_bg_color: String,
}

#[tauri::command]
pub async fn get_settings(db: State<'_, DbState>) -> Result<AppSettings, AppError> {
    let rows = sqlx::query("SELECT key, value FROM app_settings")
        .fetch_all(&db.pool)
        .await?;

    let mut map: HashMap<String, String> = HashMap::new();
    for row in rows {
        let key: String = row.get("key");
        let value: String = row.get("value");
        map.insert(key, value);
    }

    let get = |k: &str, default: &str| map.get(k).cloned().unwrap_or_else(|| default.to_string());

    Ok(AppSettings {
        result_server_url: get("result_server_url", ""),
        lan_receive_port: get("lan_receive_port", "41235").parse().unwrap_or(41235),
        heartbeat_port: get("heartbeat_port", "41236").parse().unwrap_or(41236),
        auto_update_enabled: get("auto_update_enabled", "true") == "true",
        theme: get("theme", "light"),
        language: get("language", "vi"),
        default_passing_rate: get("default_passing_rate", "95").parse().unwrap_or(95),
        default_points_correct: get("default_points_correct", "10").parse().unwrap_or(10),
        default_points_incorrect: get("default_points_incorrect", "0").parse().unwrap_or(0),
        default_feedback_correct: get("default_feedback_correct", "Chính xác !"),
        default_feedback_incorrect: get("default_feedback_incorrect", "Không chính xác !"),
        media_max_size_mb: get("media_max_size_mb", "50").parse().unwrap_or(50),
        branding_org_name: get("branding_org_name", ""),
        branding_website: get("branding_website", ""),
        branding_app_name: get("branding_app_name", "QuizForge Creator"),
        branding_bg_color: get("branding_bg_color", "#eff6ff"),
    })
}

#[tauri::command]
pub async fn save_settings(settings: AppSettings, db: State<'_, DbState>) -> Result<(), AppError> {
    let pairs: Vec<(&str, String)> = vec![
        ("result_server_url", settings.result_server_url),
        ("lan_receive_port", settings.lan_receive_port.to_string()),
        ("heartbeat_port", settings.heartbeat_port.to_string()),
        ("auto_update_enabled", settings.auto_update_enabled.to_string()),
        ("theme", settings.theme),
        ("language", settings.language),
        ("default_passing_rate", settings.default_passing_rate.to_string()),
        ("default_points_correct", settings.default_points_correct.to_string()),
        ("default_points_incorrect", settings.default_points_incorrect.to_string()),
        ("default_feedback_correct", settings.default_feedback_correct),
        ("default_feedback_incorrect", settings.default_feedback_incorrect),
        ("media_max_size_mb", settings.media_max_size_mb.to_string()),
        ("branding_org_name", settings.branding_org_name),
        ("branding_website", settings.branding_website),
        ("branding_app_name", settings.branding_app_name),
        ("branding_bg_color", settings.branding_bg_color),
    ];

    for (key, value) in pairs {
        sqlx::query("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)")
            .bind(key)
            .bind(value)
            .execute(&db.pool)
            .await?;
    }

    Ok(())
}
