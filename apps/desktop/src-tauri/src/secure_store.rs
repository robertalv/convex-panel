use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use sha2::{Sha256, Digest};

const SECRETS_FILE: &str = "secrets.enc";

#[derive(Serialize, Deserialize, Default)]
struct SecureStore {
    secrets: HashMap<String, String>,
}

fn get_storage_path() -> Result<PathBuf, String> {
    // Use a simple path in the user's home directory
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Failed to get home directory")?;
    
    let app_data = PathBuf::from(home)
        .join(".convex-panel");
    
    fs::create_dir_all(&app_data)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data.join(SECRETS_FILE))
}

// Generate a consistent key based on machine ID
fn get_encryption_key() -> Result<[u8; 32], String> {
    // Use machine-specific information to derive a key
    let machine_id = machine_uid::get()
        .map_err(|e| format!("Failed to get machine ID: {}", e))?;
    
    let mut hasher = Sha256::new();
    hasher.update(b"convex-panel-desktop-v1");
    hasher.update(machine_id.as_bytes());
    
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result[..32]);
    
    Ok(key)
}

fn encrypt_data(data: &[u8]) -> Result<Vec<u8>, String> {
    let key = get_encryption_key()?;
    let cipher = Aes256Gcm::new(&key.into());
    
    let nonce = Nonce::from_slice(b"convexpanel1"); // 12 bytes for GCM
    
    cipher
        .encrypt(nonce, data)
        .map_err(|e| format!("Encryption failed: {}", e))
}

fn decrypt_data(data: &[u8]) -> Result<Vec<u8>, String> {
    let key = get_encryption_key()?;
    let cipher = Aes256Gcm::new(&key.into());
    
    let nonce = Nonce::from_slice(b"convexpanel1");
    
    cipher
        .decrypt(nonce, data)
        .map_err(|e| format!("Decryption failed: {}", e))
}

fn load_store() -> Result<SecureStore, String> {
    let path = get_storage_path()?;
    
    if !path.exists() {
        return Ok(SecureStore::default());
    }
    
    let encrypted = fs::read(&path)
        .map_err(|e| format!("Failed to read secrets file: {}", e))?;
    
    if encrypted.is_empty() {
        return Ok(SecureStore::default());
    }
    
    let decrypted = decrypt_data(&encrypted)?;
    
    serde_json::from_slice(&decrypted)
        .map_err(|e| format!("Failed to parse secrets: {}", e))
}

fn save_store(store: &SecureStore) -> Result<(), String> {
    let path = get_storage_path()?;
    
    let json = serde_json::to_vec(store)
        .map_err(|e| format!("Failed to serialize secrets: {}", e))?;
    
    let encrypted = encrypt_data(&json)?;
    
    fs::write(&path, encrypted)
        .map_err(|e| format!("Failed to write secrets file: {}", e))
}

#[tauri::command]
pub async fn set_secret(key: String, value: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut store = load_store()?;
        store.secrets.insert(key, value);
        save_store(&store)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn get_secret(key: String) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = load_store()?;
        Ok(store.secrets.get(&key).cloned())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn delete_secret(key: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut store = load_store()?;
        store.secrets.remove(&key);
        save_store(&store)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}
