/**
 * GitHub Webhook Handler
 *
 * Receives webhook events from GitHub when schema.ts files change.
 * Filters for push events that modify schema.ts and broadcasts to SSE clients.
 *
 * POST /github/webhook - Receive GitHub webhook events
 */

const express = require("express");
const crypto = require("crypto");
const router = express.Router();

let broadcastSchemaUpdate = null;

/**
 * Set the broadcast function for SSE updates
 */
function setBroadcaster(broadcaster) {
  broadcastSchemaUpdate = broadcaster;
}

/**
 * Verify GitHub webhook signature
 * @see https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if any of the modified files is a schema.ts file
 */
function hasSchemaChange(commits) {
  const schemaPatterns = [/schema\.ts$/, /convex\/schema\.ts$/];

  for (const commit of commits) {
    const allFiles = [
      ...(commit.added || []),
      ...(commit.modified || []),
      ...(commit.removed || []),
    ];

    for (const file of allFiles) {
      if (schemaPatterns.some((pattern) => pattern.test(file))) {
        return {
          found: true,
          file,
          commit: {
            id: commit.id,
            message: commit.message,
            author: commit.author?.name || commit.author?.username,
            timestamp: commit.timestamp,
          },
        };
      }
    }
  }

  return { found: false };
}

/**
 * POST /github/webhook
 *
 * Receives GitHub webhook events.
 * Only processes 'push' events that modify schema.ts files.
 */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const deliveryId = req.headers["x-github-delivery"];

    console.debug(`Webhook received: event=${event}, delivery=${deliveryId}`);

    if (webhookSecret) {
      const payload =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
        console.warn("Webhook signature verification failed");
        return res.status(401).json({
          error: "Invalid signature",
          code: "INVALID_SIGNATURE",
        });
      }
    }

    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (e) {
      console.error("Failed to parse webhook body:", e);
      return res.status(400).json({
        error: "Invalid JSON body",
        code: "INVALID_BODY",
      });
    }

    if (event !== "push") {
      console.debug(`Ignoring non-push event: ${event}`);
      return res.status(200).json({ message: "Event ignored", event });
    }

    const repo = {
      id: body.repository?.id,
      full_name: body.repository?.full_name,
      default_branch: body.repository?.default_branch,
    };

    const ref = body.ref;
    const branch = ref?.replace("refs/heads/", "");

    const schemaChange = hasSchemaChange(body.commits || []);

    if (!schemaChange.found) {
      console.debug(`No schema.ts changes in push to ${repo.full_name}`);
      return res.status(200).json({
        message: "No schema changes detected",
        repo: repo.full_name,
        branch,
      });
    }

    console.log(`Schema change detected in ${repo.full_name}:${branch}`);
    console.log(`  File: ${schemaChange.file}`);
    console.log(
      `  Commit: ${schemaChange.commit.id.substring(0, 7)} - ${schemaChange.commit.message}`,
    );

    if (broadcastSchemaUpdate) {
      const update = {
        type: "schema_update",
        repo: repo.full_name,
        branch,
        file: schemaChange.file,
        commit: schemaChange.commit,
        timestamp: new Date().toISOString(),
      };

      broadcastSchemaUpdate(repo.full_name, update);
    }

    res.status(200).json({
      message: "Schema update processed",
      repo: repo.full_name,
      branch,
      file: schemaChange.file,
      commit: schemaChange.commit.id,
    });
  },
);

/**
 * GET /github/webhook/test
 *
 * Test endpoint to manually trigger a schema update broadcast.
 * Only available in development.
 */
router.get("/test", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  const { repo } = req.query;
  if (!repo) {
    return res.status(400).json({ error: "repo query param required" });
  }

  if (broadcastSchemaUpdate) {
    const update = {
      type: "schema_update",
      repo,
      branch: "main",
      file: "convex/schema.ts",
      commit: {
        id: "test-" + Date.now(),
        message: "Test schema update",
        author: "Test",
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    broadcastSchemaUpdate(repo, update);
    res.json({ message: "Test update broadcasted", update });
  } else {
    res.status(500).json({ error: "Broadcaster not configured" });
  }
});

module.exports = { router, setBroadcaster };
