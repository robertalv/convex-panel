/**
 * GitHub App Installation Handler
 *
 * Manages GitHub App installations for webhook setup:
 * - GET /github/app/installations - List user's installations
 * - GET /github/app/repos - List repos where app is installed
 * - POST /github/app/webhook/enable - Enable webhook for a repo
 * - POST /github/app/webhook/disable - Disable webhook for a repo
 *
 * @see https://docs.github.com/en/apps/creating-github-apps
 */

const express = require("express");
const router = express.Router();

const GITHUB_API_URL = "https://api.github.com";

/**
 * Middleware to validate GitHub token from Authorization header
 */
const requireGitHubToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "GitHub token required",
      code: "UNAUTHORIZED",
    });
  }
  req.githubToken = authHeader.substring(7);
  next();
};

/**
 * GET /github/app/install-url
 *
 * Returns the URL to install the GitHub App on a repository.
 * The user will be redirected back after installation.
 */
router.get("/install-url", (req, res) => {
  const appSlug = process.env.GITHUB_APP_SLUG;

  if (!appSlug) {
    return res.status(500).json({
      error: "GitHub App not configured",
      code: "APP_NOT_CONFIGURED",
    });
  }

  const installUrl = `https://github.com/apps/${appSlug}/installations/new`;
  res.json({ install_url: installUrl });
});

/**
 * GET /github/app/installations
 *
 * Lists the user's GitHub App installations.
 * Requires GitHub token in Authorization header.
 */
router.get("/installations", requireGitHubToken, async (req, res) => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user/installations`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${req.githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch installations:",
        response.status,
        errorText,
      );
      return res.status(response.status).json({
        error: "Failed to fetch installations",
        code: "FETCH_FAILED",
        details: errorText,
      });
    }

    const data = await response.json();

    const appId = process.env.GITHUB_APP_ID;
    const installations = appId
      ? data.installations.filter((i) => i.app_id === parseInt(appId, 10))
      : data.installations;

    res.json({
      total_count: installations.length,
      installations: installations.map((i) => ({
        id: i.id,
        account: {
          login: i.account.login,
          type: i.account.type,
          avatar_url: i.account.avatar_url,
        },
        repository_selection: i.repository_selection,
        created_at: i.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching installations:", error);
    res.status(500).json({
      error: "Internal error fetching installations",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * GET /github/app/repos
 *
 * Lists repositories accessible via the user's GitHub App installations.
 * Requires GitHub token in Authorization header.
 *
 * Query params:
 *   - installation_id (optional): Filter to specific installation
 */
router.get("/repos", requireGitHubToken, async (req, res) => {
  const { installation_id } = req.query;

  try {
    let allRepos = [];

    if (installation_id) {
      const response = await fetch(
        `${GITHUB_API_URL}/user/installations/${installation_id}/repositories`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${req.githubToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch repos:", response.status, errorText);
        return res.status(response.status).json({
          error: "Failed to fetch repositories",
          code: "FETCH_FAILED",
          details: errorText,
        });
      }

      const data = await response.json();
      allRepos = data.repositories;
    } else {
      const installResponse = await fetch(
        `${GITHUB_API_URL}/user/installations`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${req.githubToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (!installResponse.ok) {
        const errorText = await installResponse.text();
        console.error(
          "Failed to fetch installations:",
          installResponse.status,
          errorText,
        );
        return res.status(installResponse.status).json({
          error: "Failed to fetch installations",
          code: "FETCH_FAILED",
          details: errorText,
        });
      }

      const installData = await installResponse.json();

      const repoPromises = installData.installations.map(
        async (installation) => {
          try {
            const repoResponse = await fetch(
              `${GITHUB_API_URL}/user/installations/${installation.id}/repositories`,
              {
                headers: {
                  Accept: "application/vnd.github+json",
                  Authorization: `Bearer ${req.githubToken}`,
                  "X-GitHub-Api-Version": "2022-11-28",
                },
              },
            );
            if (repoResponse.ok) {
              const repoData = await repoResponse.json();
              return repoData.repositories.map((repo) => ({
                ...repo,
                installation_id: installation.id,
              }));
            }
            return [];
          } catch (e) {
            console.error(
              `Failed to fetch repos for installation ${installation.id}:`,
              e,
            );
            return [];
          }
        },
      );

      const repoArrays = await Promise.all(repoPromises);
      allRepos = repoArrays.flat();
    }

    res.json({
      total_count: allRepos.length,
      repositories: allRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
        default_branch: repo.default_branch,
        installation_id: repo.installation_id,
      })),
    });
  } catch (error) {
    console.error("Error fetching repos:", error);
    res.status(500).json({
      error: "Internal error fetching repositories",
      code: "INTERNAL_ERROR",
    });
  }
});

module.exports = router;
