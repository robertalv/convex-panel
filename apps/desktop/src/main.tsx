import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles.css";

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
    console.error('[Desktop App] Unhandled error:', event.error);
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('[Desktop App] Unhandled promise rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);
