use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce, Key
};
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use base64::{Engine as _, engine::general_purpose};

pub fn decrypt_data(encrypted_b64: &str, quiz_id: &str, timestamp: &str, salt_b64: &str, nonce_b64: &str) -> Result<String, String> {
    let encrypted_data = general_purpose::STANDARD.decode(encrypted_b64)
        .map_err(|e| format!("Invalid base64 data: {}", e))?;
    let salt = general_purpose::STANDARD.decode(salt_b64)
        .map_err(|e| format!("Invalid base64 salt: {}", e))?;
    let nonce_bytes = general_purpose::STANDARD.decode(nonce_b64)
        .map_err(|e| format!("Invalid base64 nonce: {}", e))?;

    let mut key_bytes = [0u8; 32];
    let password = format!("{}{}", quiz_id, timestamp);
    pbkdf2_hmac::<Sha256>(password.as_bytes(), &salt, 100_000, &mut key_bytes);

    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let decrypted = cipher.decrypt(nonce, encrypted_data.as_ref())
        .map_err(|e| format!("Decryption failed: {}", e))?;

    String::from_utf8(decrypted).map_err(|e| format!("Invalid UTF-8: {}", e))
}
