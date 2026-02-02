import { useState } from "react";
import { isTauri } from "@/utils/desktop";
import { invoke } from "@tauri-apps/api/core";
import { testSelfHostedMode } from "@/lib/fetch";

export function SelfHostedTest() {
  const [testUrl, setTestUrl] = useState("https://my-convex-instance.example.com");
  const [testResult, setTestResult] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const runBasicTest = async () => {
    if (!isTauri()) {
      setTestResult("Not running in Tauri environment");
      return;
    }

    setIsTesting(true);
    setTestResult("Running basic self-hosted test...");

    try {
      // Test adding a URL to the allowlist
      await invoke("add_self_hosted_url", { url: testUrl });
      setTestResult(prev => prev + "\n✓ Added URL to allowlist");

      // Check if it's recognized as self-hosted
      const isAllowed = await invoke("is_self_hosted_url_allowed", { url: testUrl });
      setTestResult(prev => prev + `\n✓ URL is ${isAllowed ? 'allowed' : 'not allowed'}`);

      // Get all allowlisted URLs
      const urls = await invoke<string[]>("get_self_hosted_urls");
      setTestResult(prev => prev + `\n✓ Current allowlist: ${urls.join(', ') || 'empty'}`);

      // Remove the URL
      await invoke("remove_self_hosted_url", { url: testUrl });
      setTestResult(prev => prev + "\n✓ Removed URL from allowlist");

      // Verify removal
      const isAllowedAfter = await invoke("is_self_hosted_url_allowed", { url: testUrl });
      setTestResult(prev => prev + `\n✓ URL is ${isAllowedAfter ? 'still allowed' : 'no longer allowed'}`);

      setTestResult(prev => prev + "\n\nBasic test completed successfully!");
    } catch (error) {
      setTestResult(prev => prev + `\n✗ Error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const runFetchTest = async () => {
    if (!isTauri()) {
      setTestResult("Not running in Tauri environment");
      return;
    }

    setIsTesting(true);
    setTestResult("Running fetch integration test...");

    try {
      await testSelfHostedMode();
      setTestResult(prev => prev + "\n✓ Fetch integration test completed");
    } catch (error) {
      setTestResult(prev => prev + `\n✗ Fetch test error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearAllUrls = async () => {
    if (!isTauri()) {
      setTestResult("Not running in Tauri environment");
      return;
    }

    setIsTesting(true);
    setTestResult("Clearing all self-hosted URLs...");

    try {
      const urls = await invoke<string[]>("get_self_hosted_urls");
      for (const url of urls) {
        await invoke("remove_self_hosted_url", { url });
      }
      setTestResult(`✓ Cleared ${urls.length} URLs from allowlist`);
    } catch (error) {
      setTestResult(`✗ Error clearing URLs: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
        Self-Hosted Deployment Test
      </h2>
      
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          Test self-hosted deployment functionality by adding URLs to the allowlist and verifying fetch behavior.
        </p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>
          Test URL:
        </label>
        <input
          type="text"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "14px",
            border: "1px solid var(--color-border-base)",
            borderRadius: "4px",
            backgroundColor: "var(--color-surface-base)",
            color: "var(--color-text-base)",
          }}
          disabled={isTesting}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={runBasicTest}
          disabled={isTesting}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid var(--color-border-base)",
            borderRadius: "4px",
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text-base)",
            cursor: isTesting ? "not-allowed" : "pointer",
            opacity: isTesting ? 0.6 : 1,
          }}
        >
          Run Basic Test
        </button>
        
        <button
          onClick={runFetchTest}
          disabled={isTesting}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid var(--color-border-base)",
            borderRadius: "4px",
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text-base)",
            cursor: isTesting ? "not-allowed" : "pointer",
            opacity: isTesting ? 0.6 : 1,
          }}
        >
          Run Fetch Test
        </button>

        <button
          onClick={clearAllUrls}
          disabled={isTesting}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid var(--color-border-base)",
            borderRadius: "4px",
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text-base)",
            cursor: isTesting ? "not-allowed" : "pointer",
            opacity: isTesting ? 0.6 : 1,
          }}
        >
          Clear All URLs
        </button>
      </div>

      {testResult && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--color-surface-overlay)",
            border: "1px solid var(--color-border-base)",
            borderRadius: "4px",
            fontSize: "13px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            color: "var(--color-text-base)",
          }}
        >
          {testResult}
        </div>
      )}

      <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--color-text-muted)" }}>
        <p><strong>Instructions:</strong></p>
        <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
          <li>Basic Test: Tests adding/removing URLs from the allowlist and verifies allowlist state.</li>
          <li>Fetch Test: Tests the smart fetch integration with self-hosted URLs.</li>
          <li>Clear All URLs: Removes all URLs from the self-hosted allowlist.</li>
        </ul>
      </div>
    </div>
  );
}