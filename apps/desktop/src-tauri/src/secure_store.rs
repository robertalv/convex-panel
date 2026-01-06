use keyring::Entry;

const SERVICE_NAME: &str = "convex-panel-desktop";

fn into_error<E: std::fmt::Display>(err: E) -> String {
    err.to_string()
}

fn entry(key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, key).map_err(into_error)
}

#[tauri::command]
pub async fn set_secret(key: String, value: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let entry = entry(&key)?;
        entry.set_password(&value).map_err(into_error)
    })
    .await
    .map_err(into_error)??;
    Ok(())
}

#[tauri::command]
pub async fn get_secret(key: String) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let entry = entry(&key)?;
        match entry.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(err) => Err(into_error(err)),
        }
    })
    .await
    .map_err(into_error)?
}

#[tauri::command]
pub async fn delete_secret(key: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let entry = entry(&key)?;
        match entry.delete_password() {
            Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(into_error(err)),
        }
    })
    .await
    .map_err(into_error)??;
    Ok(())
}
