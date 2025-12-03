// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tiny_http::{Server, Response};
use url::Url;
use std::thread;
use std::sync::{Arc, Mutex};

// Store server state to allow cleanup
struct OAuthServerState {
    port: Option<u16>,
}

#[tauri::command]
async fn start_oauth_server(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, Arc<Mutex<OAuthServerState>>>
) -> Result<u16, String> {
    println!("[Tauri] Starting OAuth server...");
    
    // Try to bind to port 14200, or find an available port
    let port = 14200;
    let server = Server::http(format!("127.0.0.1:{}", port))
        .map_err(|e| {
            eprintln!("[Tauri] Failed to start OAuth server: {}", e);
            format!("Failed to start OAuth server: {}", e)
        })?;
    
    println!("[Tauri] OAuth server started on port {}", port);
    
    // Update state
    {
        let mut state = state.lock().unwrap();
        state.port = Some(port);
    }

    thread::spawn(move || {
        println!("[Tauri] OAuth server thread started, waiting for request...");
        
        match server.recv() {
            Ok(request) => {
                println!("[Tauri] Received OAuth callback request: {}", request.url());
                
                let url_string = format!("http://localhost:{}", request.url());
                match Url::parse(&url_string) {
                    Ok(url) => {
                        let params: std::collections::HashMap<_, _> = 
                            url.query_pairs().into_owned().collect();
                        
                        if let Some(code) = params.get("code") {
                            println!("[Tauri] OAuth code received, emitting event");
                            let _ = app_handle.emit_all("oauth-code", code);
                            
                            // Send success response
                            let response = Response::from_string(
                                r#"
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>Authentication Successful</title>
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            height: 100vh;
                                            margin: 0;
                                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                        }
                                        .container {
                                            background: white;
                                            padding: 2rem;
                                            border-radius: 8px;
                                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                            text-align: center;
                                        }
                                        h1 { color: #333; margin-top: 0; }
                                        p { color: #666; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>✓ Authentication Successful!</h1>
                                        <p>You can close this window and return to the app.</p>
                                    </div>
                                </body>
                                </html>
                                "#
                            ).with_header(
                                tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap()
                            );
                            
                            if let Err(e) = request.respond(response) {
                                eprintln!("[Tauri] Failed to send response: {}", e);
                            }
                        } else if let Some(error) = params.get("error") {
                            eprintln!("[Tauri] OAuth error received: {}", error);
                            let error_description = params.get("error_description")
                                .map(|s| s.as_str())
                                .unwrap_or("Unknown error");
                            
                            let response = Response::from_string(
                                format!(
                                    r#"
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <title>Authentication Failed</title>
                                        <style>
                                            body {{
                                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                height: 100vh;
                                                margin: 0;
                                                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                                            }}
                                            .container {{
                                                background: white;
                                                padding: 2rem;
                                                border-radius: 8px;
                                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                                text-align: center;
                                            }}
                                            h1 {{ color: #333; margin-top: 0; }}
                                            p {{ color: #666; }}
                                        </style>
                                    </head>
                                    <body>
                                        <div class="container">
                                            <h1>✗ Authentication Failed</h1>
                                            <p>{}: {}</p>
                                            <p>Please close this window and try again.</p>
                                        </div>
                                    </body>
                                    </html>
                                    "#,
                                    error, error_description
                                )
                            ).with_header(
                                tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap()
                            );
                            
                            let _ = request.respond(response);
                        }
                    }
                    Err(e) => {
                        eprintln!("[Tauri] Failed to parse OAuth callback URL: {}", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("[Tauri] Failed to receive OAuth request: {}", e);
            }
        }
        
        println!("[Tauri] OAuth server thread finished");
    });

    Ok(port)
}

fn main() {
    let oauth_state = Arc::new(Mutex::new(OAuthServerState { port: None }));
    
    tauri::Builder::default()
        .manage(oauth_state)
        .invoke_handler(tauri::generate_handler![start_oauth_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
