use mdns_sd::{ServiceDaemon, ServiceEvent};
use std::time::Duration;
use serde_json::Value;

#[tauri::command]
pub async fn discover_lan_server() -> Result<Vec<String>, String> {
    let mdns = ServiceDaemon::new().map_err(|e| e.to_string())?;
    let receiver = mdns.browse("_quizforge._tcp.local.").map_err(|e| e.to_string())?;
    
    let mut servers = Vec::new();
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(5);

    while start.elapsed() < timeout {
        if let Ok(event) = receiver.recv_timeout(Duration::from_millis(500)) {
            match event {
                ServiceEvent::ServiceResolved(info) => {
                    for addr in info.get_addresses() {
                        servers.push(format!("{}:{}", addr, info.get_port()));
                    }
                }
                _ => {}
            }
        }
    }

    Ok(servers)
}

#[tauri::command]
pub async fn send_result_http(url: String, result: Value) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client.post(url)
        .json(&result)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if res.status().is_success() {
        Ok("Success".to_string())
    } else {
        Err(format!("Server returned error: {}", res.status()))
    }
}

#[tauri::command]
pub fn get_machine_id() -> Result<String, String> {
    machine_uid::get().map_err(|e| e.to_string())
}
