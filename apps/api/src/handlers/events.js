/**
 * Server-Sent Events (SSE) Handler
 *
 * Manages SSE connections for real-time schema update notifications.
 * Clients subscribe to specific repositories and receive updates when
 * schema.ts files are modified.
 *
 * GET /events/subscribe - SSE endpoint
 */
const express = require("express");
const router = express.Router();

const connections = new Map();

let totalConnections = 0;
let totalMessages = 0;

/**
 * Add a connection to a repo's subscriber list
 */
function addConnection(repo, res) {
  if (!connections.has(repo)) {
    connections.set(repo, new Set());
  }
  connections.get(repo).add(res);
  totalConnections++;

  console.debug(
    `SSE: Client connected to ${repo} (${connections.get(repo).size} subscribers)`,
  );
}

/**
 * Remove a connection from a repo's subscriber list
 */
function removeConnection(repo, res) {
  const repoConnections = connections.get(repo);
  if (repoConnections) {
    repoConnections.delete(res);
    if (repoConnections.size === 0) {
      connections.delete(repo);
    }
    console.debug(
      `SSE: Client disconnected from ${repo} (${repoConnections?.size || 0} remaining)`,
    );
  }
}

/**
 * Broadcast an update to all subscribers of a repo
 */
function broadcastToRepo(repo, data) {
  const repoConnections = connections.get(repo);
  if (!repoConnections || repoConnections.size === 0) {
    console.debug(`SSE: No subscribers for ${repo}`);
    return 0;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  let sent = 0;

  for (const res of repoConnections) {
    try {
      res.write(message);
      sent++;
      totalMessages++;
    } catch (e) {
      console.error(`SSE: Failed to send to subscriber:`, e);
      repoConnections.delete(res);
    }
  }

  console.debug(
    `SSE: Broadcasted to ${sent}/${repoConnections.size} subscribers of ${repo}`,
  );
  return sent;
}

/**
 * GET /events/subscribe
 *
 * SSE endpoint for receiving real-time schema updates.
 *
 * Query params:
 *   - repos: Comma-separated list of repo full names (e.g., 'owner/repo1,owner/repo2')
 *   - device_id: Unique device identifier for tracking
 *
 * Events sent:
 *   - connected: Initial connection confirmation
 *   - schema_update: Schema file was modified
 *   - heartbeat: Keep-alive ping (every 30s)
 */
router.get("/subscribe", (req, res) => {
  const { repos, device_id } = req.query;

  if (!repos) {
    return res.status(400).json({
      error: "repos query param required",
      code: "MISSING_REPOS",
    });
  }

  const repoList = repos
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  if (repoList.length === 0) {
    return res.status(400).json({
      error: "At least one repo required",
      code: "EMPTY_REPOS",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Accel-Buffering", "no"); 

  res.flushHeaders();

  for (const repo of repoList) {
    addConnection(repo, res);
  }

  const connectedEvent = {
    type: "connected",
    repos: repoList,
    device_id,
    timestamp: new Date().toISOString(),
  };
  res.write(`data: ${JSON.stringify(connectedEvent)}\n\n`);

  const heartbeatInterval = setInterval(() => {
    try {
      res.write(
        `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`,
      );
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    for (const repo of repoList) {
      removeConnection(repo, res);
    }
  });

  req.on("error", () => {
    clearInterval(heartbeatInterval);
    for (const repo of repoList) {
      removeConnection(repo, res);
    }
  });
});

/**
 * GET /events/stats
 *
 * Returns SSE connection statistics.
 * Only available in development.
 */
router.get("/stats", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  const repoStats = {};
  for (const [repo, conns] of connections) {
    repoStats[repo] = conns.size;
  }

  res.json({
    total_repos: connections.size,
    total_active_connections: [...connections.values()].reduce(
      (sum, s) => sum + s.size,
      0,
    ),
    total_connections_ever: totalConnections,
    total_messages_sent: totalMessages,
    repos: repoStats,
  });
});

module.exports = {
  router,
  broadcastToRepo,
};
