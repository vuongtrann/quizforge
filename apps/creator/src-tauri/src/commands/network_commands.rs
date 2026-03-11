use tauri::{State, AppHandle, Emitter, Manager};
use crate::database::DbState;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use axum::{
    routing::post,
    Router,
    Json,
    extract::State as AxumState,
};
use std::net::SocketAddr;
use mdns_sd::{ServiceDaemon, ServiceInfo};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LanServerStatus {
    pub is_running: bool,
    pub port: u16,
    pub ip: String,
}

pub struct LanServerState {
    pub shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
    pub is_running: bool,
    pub port: u16,
}

pub type SharedLanState = Arc<Mutex<LanServerState>>;

#[tauri::command]
pub async fn get_local_ip() -> Result<String, AppError> {
    // Simple way to get local IP
    let socket = std::net::UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| AppError::Internal(e.to_string()))?;
    socket.connect("8.8.8.8:80")
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let local_addr = socket.local_addr()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(local_addr.ip().to_string())
}

#[tauri::command]
pub async fn get_lan_server_status(state: State<'_, SharedLanState>) -> Result<LanServerStatus, AppError> {
    let s = state.lock().await;
    let ip = get_local_ip().await.unwrap_or_else(|_| "0.0.0.0".to_string());
    Ok(LanServerStatus {
        is_running: s.is_running,
        port: s.port,
        ip,
    })
}

async fn handle_post_result(
    AxumState(app_handle): AxumState<AppHandle>,
    Json(result): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    // Persist to database
    let db = app_handle.state::<DbState>();
    let id = uuid::Uuid::new_v4().to_string();
    let question_results_json = result["questionResults"].to_string();

    let insert_result = sqlx::query(
        "INSERT INTO quiz_results (
            id, quiz_id, quiz_title, student_id, student_name,
            started_at, completed_at, total_points, earned_points,
            percentage, passed, question_results_json, machine_id, submitted_via
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lan')"
    )
    .bind(&id)
    .bind(result["quizId"].as_str().unwrap_or(""))
    .bind(result["quizTitle"].as_str().unwrap_or(""))
    .bind(result["studentId"].as_str().unwrap_or(""))
    .bind(result["studentName"].as_str().unwrap_or("Ẩn danh"))
    .bind(result["startedAt"].as_str().unwrap_or(""))
    .bind(result["completedAt"].as_str().unwrap_or(""))
    .bind(result["totalPoints"].as_i64().unwrap_or(0))
    .bind(result["earnedPoints"].as_i64().unwrap_or(0))
    .bind(result["percentage"].as_f64().unwrap_or(0.0))
    .bind(result["passed"].as_bool().unwrap_or(false) as i64)
    .bind(&question_results_json)
    .bind(result["machineId"].as_str().unwrap_or(""))
    .execute(&db.pool)
    .await;

    if let Err(e) = insert_result {
        eprintln!("[LAN] Failed to save result to DB: {}", e);
    }

    // Emit to frontend (with our generated ID so UI can track it)
    let mut emit_payload = result.clone();
    if let Some(obj) = emit_payload.as_object_mut() {
        obj.insert("id".to_string(), serde_json::json!(id));
    }
    let _ = app_handle.emit("result-received", emit_payload);

    Json(serde_json::json!({ "status": "ok", "id": id }))
}

async fn handle_heartbeat(
    AxumState(app_handle): AxumState<AppHandle>,
    Json(heartbeat): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    // Emit to frontend
    let _ = app_handle.emit("heartbeat-received", heartbeat);
    Json(serde_json::json!({ "status": "ok" }))
}

#[tauri::command]
pub async fn start_receive_mode(
    port: u16,
    state: State<'_, SharedLanState>,
    app_handle: AppHandle,
) -> Result<(), AppError> {
    let mut s = state.lock().await;
    if s.is_running {
        return Ok(());
    }

    let (tx, rx) = tokio::sync::oneshot::channel::<()>();
    s.shutdown_tx = Some(tx);
    s.is_running = true;
    s.port = port;

    let app_handle_clone = app_handle.clone();
    
    tokio::spawn(async move {
        // Advertise via mDNS so Player apps can discover this Creator
        let mdns_daemon = ServiceDaemon::new().ok();
        if let Some(ref mdns) = mdns_daemon {
            let local_ip = get_local_ip().await.unwrap_or_else(|_| "0.0.0.0".to_string());
            if let Ok(service) = ServiceInfo::new(
                "_quizforge._tcp.local.",
                "QuizForge_Creator",
                "quizforge-creator.local.",
                local_ip.as_str(),
                port,
                None,
            ) {
                if let Err(e) = mdns.register(service) {
                    eprintln!("[mDNS] Failed to register service: {}", e);
                } else {
                    println!("[mDNS] Advertised _quizforge._tcp.local. on port {}", port);
                }
            }
        }

        let app = Router::new()
            .route("/result", post(handle_post_result))
            .route("/heartbeat", post(handle_heartbeat))
            .with_state(app_handle_clone);

        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        let listener = match tokio::net::TcpListener::bind(addr).await {
            Ok(l) => l,
            Err(e) => {
                eprintln!("[LAN] Failed to bind port {}: {}", port, e);
                return;
            }
        };

        if let Err(e) = axum::serve(listener, app)
            .with_graceful_shutdown(async {
                rx.await.ok();
            })
            .await
        {
            eprintln!("[LAN] Server error: {}", e);
        }

        // Unregister mDNS when server shuts down
        if let Some(mdns) = mdns_daemon {
            let _ = mdns.unregister("QuizForge_Creator._quizforge._tcp.local.");
            let _ = mdns.shutdown();
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_receive_mode(state: State<'_, SharedLanState>) -> Result<(), AppError> {
    let mut s = state.lock().await;
    if let Some(tx) = s.shutdown_tx.take() {
        let _ = tx.send(());
    }
    s.is_running = false;
    Ok(())
}
