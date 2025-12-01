// Prevents additional console window on Windows in release, DO NOT REMOVE!!
use tauri::Manager;
use tiny_http::{Server, Response};
use url::Url;
use std::thread;

#[tauri::command]
async fn start_oauth_server(app_handle: tauri::AppHandle) -> Result<u16, String> {
  let server = Server::http("127.0.0.1:14200").map_err(|e| e.to_string())?;
  let port = 14200;

  thread::spawn(move || {
    if let Ok(request) = server.recv() {
      let url_string = format!("http://localhost:{}", request.url());
      if let Ok(url) = Url::parse(&url_string) {
        let params: std::collections::HashMap<_, _> = url.query_pairs().into_owned().collect();
        if let Some(code) = params.get("code") {
          let _ = app_handle.emit_all("oauth-code", code);
        }
      }

      let response = Response::from_string("Authentication successful! You can close this window.");
      let _ = request.respond(response);
    }
  });

  Ok(port)
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![start_oauth_server])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
