use axum::{
    routing::{get, post},
    Json, Router, extract::State,
};
use serde_json::Value;
use std::net::SocketAddr;
use tauri::AppHandle;
use tauri::Emitter; // For emitting events in Tauri 2
use mdns_sd::{ServiceDaemon, ServiceInfo};

#[derive(Clone)]
struct ServerState {
    app_handle: AppHandle,
}

pub async fn start_lan_server(app_handle: AppHandle, port: u16) -> Result<(), String> {
    let state = ServerState { app_handle: app_handle.clone() };

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/submit", post(handle_submission))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("LAN Server listening on {}", addr);

    // Start mDNS advertisement
    let mdns = ServiceDaemon::new().map_err(|e| e.to_string())?;
    let service_type = "_quizforge._tcp.local.";
    let instance_name = "QuizForge_Receiver";
    let host_name = "quizforge.local.";
    let properties = [("port", port.to_string())];
    
    let my_service = ServiceInfo::new(
        service_type,
        instance_name,
        host_name,
        "",
        port,
        &properties[..],
    ).map_err(|e| e.to_string())?;

    mdns.register(my_service).map_err(|e| e.to_string())?;

    let listener = tokio::net::TcpListener::bind(addr).await.map_err(|e| e.to_string())?;
    axum::serve(listener, app).await.map_err(|e| e.to_string())?;

    Ok(())
}

async fn handle_submission(
    State(state): State<ServerState>,
    Json(payload): Json<Value>,
) -> Json<Value> {
    println!("Received submission: {:?}", payload);
    
    // Emit to frontend
    state.app_handle.emit("lan-submission-received", &payload).unwrap();
    
    // Save to DB? 
    // In a real app, we'd use the Database state managed by Tauri
    // But for now, we just notify the UI
    
    Json(serde_json::json!({ "status": "success" }))
}
