use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => Ok(Some(UpdateInfo {
            version: update.version.clone(),
            body: update.body.clone(),
            date: update.date.map(|d| d.to_string()),
        })),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Lỗi kiểm tra cập nhật: {}", e)),
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => {
            // Download and install
            update.download_and_install(|_, _| {}, || {}).await
                .map_err(|e| format!("Lỗi cài đặt bản cập nhật: {}", e))?;
            Ok(())
        }
        Ok(None) => Err("Không có bản cập nhật mới.".to_string()),
        Err(e) => Err(format!("Lỗi kiểm tra cập nhật: {}", e)),
    }
}

#[derive(serde::Serialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub body: Option<String>,
    pub date: Option<String>,
}
