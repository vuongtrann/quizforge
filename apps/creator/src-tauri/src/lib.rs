pub mod database;
pub mod models;
pub mod commands;
pub mod network;
pub mod error;

use tauri::{Manager, Emitter};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            if let Err(e) = std::fs::create_dir_all(&app_dir) {
                eprintln!("Failed to create app directory: {}", e);
            }
            
            // Init DB
            let handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                match database::init_db(app_dir).await {
                    Ok(db) => {
                        handle.manage(db);
                        println!("Database initialized successfully.");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                    }
                }
            });

            // Init LAN State
            app.handle().manage(std::sync::Arc::new(tokio::sync::Mutex::new(commands::network_commands::LanServerState {
                shutdown_tx: None,
                is_running: false,
                port: 41235,
            })));
            
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // native close
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::quiz_commands::get_quiz,
            commands::quiz_commands::create_quiz,
            commands::quiz_commands::update_quiz,
            commands::quiz_commands::delete_quiz,
            commands::quiz_commands::duplicate_quiz,
            commands::export_commands::export_quiz_to_qfz,
            commands::export_commands::prepare_player_bundle,
            commands::export_commands::import_quiz_from_qfz,
            commands::question_commands::add_question,
            commands::question_commands::update_question,
            commands::question_commands::delete_question,
            commands::question_commands::reorder_questions,
            commands::question_commands::duplicate_question,
            commands::student_commands::get_student_lists,
            commands::student_commands::create_student_list,
            commands::student_commands::delete_student_list,
            commands::student_commands::get_students_by_list,
            commands::student_commands::bind_student_list_to_quiz,
            commands::student_commands::update_student,
            commands::student_commands::delete_student,
            commands::student_commands::rename_student_list,
            commands::media_commands::upload_media,
            commands::media_commands::delete_media,
            commands::media_commands::get_media_data,
            commands::result_commands::get_quiz_results,
            commands::result_commands::delete_result,
            commands::result_commands::export_results_excel,
            commands::result_commands::import_result_from_qfr,
            commands::network_commands::get_local_ip,
            commands::network_commands::get_lan_server_status,
            commands::network_commands::start_receive_mode,
            commands::network_commands::stop_receive_mode,
            commands::updater_commands::check_for_updates,
            commands::updater_commands::install_update,
            commands::settings_commands::get_settings,
            commands::settings_commands::save_settings,
            commands::import_commands::generate_import_template,
            commands::import_commands::import_quiz_from_excel
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
