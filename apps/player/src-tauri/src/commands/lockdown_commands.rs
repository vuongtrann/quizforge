use tauri::WebviewWindow;

/// Enable lockdown: fullscreen + always-on-top + no decorations
#[tauri::command]
pub fn set_lockdown_mode(window: WebviewWindow, enabled: bool) -> Result<(), String> {
    if enabled {
        window.set_fullscreen(true).map_err(|e| e.to_string())?;
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window.set_decorations(false).map_err(|e| e.to_string())?;
    } else {
        window.set_fullscreen(false).map_err(|e| e.to_string())?;
        window.set_always_on_top(false).map_err(|e| e.to_string())?;
        window.set_decorations(true).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Force close the window (called after user confirms quit)
#[tauri::command]
pub fn force_quit(window: WebviewWindow) {
    window.close().ok();
}
