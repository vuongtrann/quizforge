// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod security;

fn main() {
    // Acquire a named mutex so only one Player instance per quiz can run.
    // We use "generic" here because the quiz_id is not yet known at startup
    // (it is loaded later via load_quiz_data). A per-quiz lock could be
    // re-acquired inside load_quiz_data once the id is available.
    let _mutex = security::mutex::AppMutex::try_acquire("generic")
        .expect("Failed to create instance mutex")
        .unwrap_or_else(|| {
            eprintln!("Another instance of QuizForge Player is already running.");
            std::process::exit(1);
        });

    quizforge_player_lib::run()
}
