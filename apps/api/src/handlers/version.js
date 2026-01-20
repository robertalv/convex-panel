/**
 * Version Check Handler
 * 
 * Returns the latest git commit SHA from the main branch of the repository.
 * Used by the desktop app to notify users when a new version is available.
 */

const express = require("express");
const router = express.Router();

const REPO_OWNER = process.env.GITHUB_REPO_OWNER || "robertalv";
const REPO_NAME = process.env.GITHUB_REPO_NAME || "convex-panel";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * GET /v1/version
 * 
 * Returns the latest commit SHA from the main branch.
 * Response: { sha: string | null }
 */
router.get("/", async (req, res) => {
  try {
    const branch = req.query.branch || "main";
    
    // Fetch latest commit from GitHub API
    const headers = {
      "Accept": "application/vnd.github.v3+json",
      ...(GITHUB_TOKEN && { "Authorization": `Bearer ${GITHUB_TOKEN}` }),
    };

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${branch}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
        const rateLimitReset = response.headers.get("x-ratelimit-reset");
        console.warn(
          `GitHub API rate limit exceeded. Remaining: ${rateLimitRemaining}, Reset: ${rateLimitReset}`,
        );
        return res.status(503).json({
          error: "GitHub API rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimitReset
            ? Math.max(0, parseInt(rateLimitReset) - Math.floor(Date.now() / 1000))
            : 60,
        });
      }

      // If branch doesn't exist, try 'main'
      if (response.status === 404 && branch !== "main") {
        const mainResponse = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`,
          { headers },
        );
        if (mainResponse.ok) {
          const mainData = await mainResponse.json();
          return res.json({ sha: mainData.sha });
        }
      }

      // Handle unauthorized (missing or invalid token)
      if (response.status === 401) {
        console.error("GitHub API authentication failed");
        return res.status(500).json({
          error: "Failed to fetch version information",
          code: "AUTH_ERROR",
        });
      }

      console.error(
        `Failed to fetch version: ${response.status} ${response.statusText}`,
      );
      return res.status(500).json({
        error: "Failed to fetch version information",
        code: "VERSION_FETCH_ERROR",
      });
    }

    const data = await response.json();
    res.json({ sha: data.sha || null });
  } catch (error) {
    console.error("Error fetching version:", error);
    res.status(500).json({
      error: "Failed to fetch version information",
      code: "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

module.exports = router;
