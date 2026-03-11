use serde_json::Value;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use flate2::write::GzEncoder;
use flate2::Compression;

#[tauri::command]
pub fn save_result_to_qfr(result: Value, save_path: String) -> Result<(), String> {
    let json_str = serde_json::to_string(&result).map_err(|e| e.to_string())?;

    // We can compress it as qfz/qfr using gzip
    let file = File::create(PathBuf::from(save_path)).map_err(|e| e.to_string())?;
    let mut encoder = GzEncoder::new(file, Compression::default());

    encoder.write_all(json_str.as_bytes()).map_err(|e| e.to_string())?;
    encoder.finish().map_err(|e| e.to_string())?;

    Ok(())
}
