/**
 * SSE Client for Real-time Schema Updates
 *
 * Connects to the API server's SSE endpoint to receive
 * real-time notifications when schema.ts files are modified.
 */

import type { SSEEvent, SchemaUpdateEvent } from "./types";
import { getDeviceId } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export type SSEConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface SSEClientOptions {
  onConnect?: (repos: string[]) => void;
  onSchemaUpdate?: (event: SchemaUpdateEvent) => void;
  onHeartbeat?: () => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: SSEConnectionState) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * SSE Client for subscribing to schema updates
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private repos: string[] = [];
  private options: SSEClientOptions;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private state: SSEConnectionState = "disconnected";
  private deviceId: string | null = null;

  constructor(options: SSEClientOptions = {}) {
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...options,
    };
  }

  /**
   * Connect to the SSE endpoint for the given repositories
   */
  async connect(repos: string[]): Promise<void> {
    if (repos.length === 0) {
      throw new Error("At least one repository required");
    }

    this.repos = repos;
    this.deviceId = await getDeviceId();

    this.doConnect();
  }

  private doConnect(): void {
    // Clean up existing connection
    this.disconnect(false);

    this.setState("connecting");

    const url = new URL(`${API_BASE_URL}/v1/events/subscribe`);
    url.searchParams.set("repos", this.repos.join(","));
    if (this.deviceId) {
      url.searchParams.set("device_id", this.deviceId);
    }

    try {
      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        console.log("[SSE] Connected");
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (e) {
          console.error("[SSE] Failed to parse event:", e);
        }
      };

      this.eventSource.onerror = (event) => {
        console.error("[SSE] Connection error:", event);
        this.handleError(new Error("SSE connection error"));
      };
    } catch (e) {
      this.handleError(e instanceof Error ? e : new Error("Failed to connect"));
    }
  }

  private handleEvent(event: SSEEvent): void {
    switch (event.type) {
      case "connected":
        this.setState("connected");
        this.options.onConnect?.(event.repos || this.repos);
        break;

      case "schema_update":
        if (event.repo && event.branch && event.file && event.commit) {
          this.options.onSchemaUpdate?.({
            type: "schema_update",
            repo: event.repo,
            branch: event.branch,
            file: event.file,
            commit: event.commit,
            timestamp: event.timestamp,
          });
        }
        break;

      case "heartbeat":
        this.options.onHeartbeat?.();
        break;
    }
  }

  private handleError(error: Error): void {
    this.setState("error");
    this.options.onError?.(error);

    // Attempt reconnection
    if (this.reconnectAttempts < (this.options.maxReconnectAttempts || 10)) {
      this.reconnectAttempts++;
      const delay = this.options.reconnectInterval || 5000;
      console.log(
        `[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
      );

      this.reconnectTimeout = setTimeout(() => {
        this.doConnect();
      }, delay);
    } else {
      console.error("[SSE] Max reconnection attempts reached");
    }
  }

  private setState(state: SSEConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.options.onStateChange?.(state);
    }
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(clearRepos = true): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (clearRepos) {
      this.repos = [];
      this.setState("disconnected");
    }
  }

  /**
   * Update the list of subscribed repositories
   */
  async updateRepos(repos: string[]): Promise<void> {
    if (repos.length === 0) {
      this.disconnect();
      return;
    }

    this.repos = repos;

    // Reconnect with new repos
    if (this.eventSource) {
      this.doConnect();
    }
  }

  /**
   * Get current connection state
   */
  getState(): SSEConnectionState {
    return this.state;
  }

  /**
   * Get subscribed repositories
   */
  getRepos(): string[] {
    return [...this.repos];
  }
}

// Singleton instance for the app
let sseClientInstance: SSEClient | null = null;

/**
 * Get or create the SSE client singleton
 */
export function getSSEClient(options?: SSEClientOptions): SSEClient {
  if (!sseClientInstance) {
    sseClientInstance = new SSEClient(options);
  } else if (options) {
    // Update options on existing instance
    Object.assign(sseClientInstance["options"], options);
  }
  return sseClientInstance;
}

/**
 * Disconnect and destroy the SSE client singleton
 */
export function destroySSEClient(): void {
  if (sseClientInstance) {
    sseClientInstance.disconnect();
    sseClientInstance = null;
  }
}
