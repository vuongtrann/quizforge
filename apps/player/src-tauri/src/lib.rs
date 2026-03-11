mod commands;
mod security;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(commands::quiz_loader::QuizState::default())
        .invoke_handler(tauri::generate_handler![
            commands::quiz_loader::load_quiz_data,
            commands::quiz_loader::get_students,
            commands::network::discover_lan_server,
            commands::network::send_result_http,
            commands::network::get_machine_id,
            commands::validate::validate_answer,
            commands::lockdown_commands::set_lockdown_mode,
            commands::lockdown_commands::force_quit,
            commands::result::save_result_to_qfr,
            commands::quiz_loader::save_quiz_state,
            commands::quiz_loader::load_quiz_state,
            commands::quiz_loader::clear_quiz_state,
            commands::updater::check_for_updates,
            commands::updater::install_update,
        ])
        .setup(move |app| {
            // Disable DevTools in production
            #[cfg(not(debug_assertions))]
            {
                let windows = app.handle().webview_windows();
                for window in windows.values() {
                    window.with_webview(|webview| {
                        #[cfg(target_os = "windows")]
                        unsafe {
                            if let Ok(controller) = webview.controller().CoreWebView2() {
                                if let Ok(settings) = controller.Settings() {
                                    let _ = settings.SetAreDevToolsEnabled(false);
                                }
                            }
                        }
                    }).ok();
                }
            }

            let main_window = app
                .get_webview_window("main")
                .expect("no main window");

            // Override close-requested: let frontend decide when to actually quit
            let win_for_close = main_window.clone();
            main_window.on_window_event(move |event| {
                match event {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        win_for_close.emit("close-requested", ()).ok();
                    }
                    tauri::WindowEvent::Focused(false) => {
                        // Tab-out / window-blur detection.
                        // Frontend listens and decides based on current quiz phase.
                        win_for_close.emit("window-blur", ()).ok();
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
