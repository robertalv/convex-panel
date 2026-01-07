/**
 * GitHub OAuth Device Flow Handler
 *
 * Implements the Device Flow for GitHub authentication:
 * 1. POST /github/device/code - Initiate device flow, get user_code to display
 * 2. POST /github/device/token - Poll for access token after user authorizes
 *
 * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
 */

const express = require("express");
const router = express.Router();

const GITHUB_DEVICE_CODE_URL = "https://github.com/login/device/code";
const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

/**
 * POST /github/device/code
 *
 * Initiates the GitHub Device Flow and returns the user_code and verification_uri
 * that the user needs to complete authorization.
 *
 * Request body:
 *   - scope (optional): OAuth scopes, defaults to 'repo read:user'
 *
 * Response:
 *   - device_code: Code used to poll for the token
 *   - user_code: Code user enters at verification_uri
 *   - verification_uri: URL where user enters the code
 *   - expires_in: Seconds until codes expire
 *   - interval: Seconds to wait between polling attempts
 */
router.post("/device/code", async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    console.error("GITHUB_CLIENT_ID not configured");
    return res.status(500).json({
      error: "GitHub OAuth not configured",
      code: "GITHUB_NOT_CONFIGURED",
    });
  }

  const scope = req.body.scope || "repo read:user";

  try {
    const response = await fetch(GITHUB_DEVICE_CODE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        scope,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "GitHub device code request failed:",
        response.status,
        errorText,
      );
      return res.status(response.status).json({
        error: "Failed to initiate device flow",
        code: "DEVICE_FLOW_INIT_FAILED",
        details: errorText,
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error("GitHub device code error:", data);
      return res.status(400).json({
        error: data.error_description || data.error,
        code: data.error,
      });
    }

    console.debug("Device flow initiated successfully");
    res.json({
      device_code: data.device_code,
      user_code: data.user_code,
      verification_uri: data.verification_uri,
      expires_in: data.expires_in,
      interval: data.interval,
    });
  } catch (error) {
    console.error("Error initiating device flow:", error);
    res.status(500).json({
      error: "Internal error initiating device flow",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * POST /github/device/token
 *
 * Polls GitHub for the access token after user has entered the code.
 * The client should poll this endpoint at the interval specified in /device/code response.
 *
 * Request body:
 *   - device_code: The device_code from /device/code response
 *
 * Response (success):
 *   - access_token: The GitHub access token
 *   - token_type: Usually 'bearer'
 *   - scope: Granted scopes
 *
 * Response (pending):
 *   - error: 'authorization_pending' - User hasn't authorized yet
 *   - error: 'slow_down' - Polling too fast, increase interval
 *
 * Response (failure):
 *   - error: 'expired_token' - Device code expired
 *   - error: 'access_denied' - User denied access
 */
router.post("/device/token", async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    console.error("GITHUB_CLIENT_ID not configured");
    return res.status(500).json({
      error: "GitHub OAuth not configured",
      code: "GITHUB_NOT_CONFIGURED",
    });
  }

  const { device_code } = req.body;

  if (!device_code) {
    return res.status(400).json({
      error: "device_code is required",
      code: "MISSING_DEVICE_CODE",
    });
  }

  try {
    const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub token request failed:", response.status, errorText);
      return res.status(response.status).json({
        error: "Failed to exchange device code",
        code: "TOKEN_EXCHANGE_FAILED",
        details: errorText,
      });
    }

    const data = await response.json();

    if (data.error) {
      if (
        data.error === "authorization_pending" ||
        data.error === "slow_down"
      ) {
        return res.status(200).json({
          error: data.error,
          error_description: data.error_description,
          interval: data.error === "slow_down" ? 10 : undefined,
        });
      }

      console.error("GitHub token error:", data);
      return res.status(400).json({
        error: data.error_description || data.error,
        code: data.error,
      });
    }

    console.debug("GitHub token obtained successfully");
    res.json({
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
    });
  } catch (error) {
    console.error("Error exchanging device code:", error);
    res.status(500).json({
      error: "Internal error exchanging device code",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * POST /github/token/revoke
 *
 * Revokes a GitHub access token. Used for logout.
 *
 * Request body:
 *   - access_token: The token to revoke
 */
router.post("/token/revoke", async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("GitHub OAuth credentials not configured");
    return res.status(500).json({
      error: "GitHub OAuth not configured",
      code: "GITHUB_NOT_CONFIGURED",
    });
  }

  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({
      error: "access_token is required",
      code: "MISSING_TOKEN",
    });
  }

  try {
    // GitHub uses a DELETE request to revoke tokens
    const response = await fetch(
      `https://api.github.com/applications/${clientId}/token`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization:
            "Basic " +
            Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ access_token }),
      },
    );

    if (response.status === 204) {
      console.debug("GitHub token revoked successfully");
      return res.status(204).send();
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "GitHub token revocation failed:",
        response.status,
        errorText,
      );
      return res.status(204).send();
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error revoking token:", error);
    res.status(204).send();
  }
});

module.exports = router;
