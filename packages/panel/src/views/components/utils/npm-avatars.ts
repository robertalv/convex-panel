/**
 * Utility functions for working with NPM user avatars
 */

export interface NpmMaintainer {
  name: string;
  email?: string;
  avatar?: string; // NPM sometimes provides this
}

/**
 * Get avatar URL from NPM's API for a specific user
 * This fetches the avatar URL (JWT token) from NPM's user API
 * Returns the full JWT-based avatar URL like: https://www.npmjs.com/npm-avatar/{JWT}
 */
export async function getNpmUserAvatar(username: string): Promise<string | null> {
  try {
    // Try NPM's user API endpoint
    const response = await fetch(`https://registry.npmjs.org/-/user/org.couchdb.user:${username}`);
    if (!response.ok) {
      console.log(`[NPM Avatar] User API returned ${response.status} for ${username}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[NPM Avatar] User API response for ${username}:`, data);
    
    // NPM might return the avatar URL directly, or we need to construct it
    if (data.avatar) {
      // If it's already a full URL, return it
      if (data.avatar.startsWith('http')) {
        return data.avatar;
      }
      // If it's a JWT token, construct the full URL
      if (data.avatar.includes('eyJ')) {
        return `https://www.npmjs.com/npm-avatar/${data.avatar}`;
      }
    }
    
    // Try alternative: NPM's profile endpoint
    try {
      const profileResponse = await fetch(`https://www.npmjs.com/~${username}`);
      // This might redirect or contain avatar info, but it's HTML
      // For now, we'll rely on the user API
    } catch (e) {
      // Ignore
    }
    
    return null;
  } catch (error) {
    console.error(`[NPM Avatar] Failed to fetch NPM avatar for ${username}:`, error);
    return null;
  }
}

/**
 * Get NPM avatar URL using their JWT-based service
 * Note: This generates a URL similar to what NPM uses internally
 */
export function getNpmAvatarServiceUrl(
  gravatarHash: string,
  size: number = 100
): string {
  // NPM's avatar service wraps Gravatar URLs in a JWT
  // The simplest approach is to use the Gravatar URL directly
  // since NPM's JWT service is mainly for their internal use
  return `https://s.gravatar.com/avatar/${gravatarHash}?size=${size}&default=retro`;
}

/**
 * Extract Gravatar hash from an NPM avatar URL
 * NPM avatar URLs are JWTs that encode Gravatar URLs
 * Example: https://www.npmjs.com/npm-avatar/{JWT_TOKEN}
 * The JWT payload contains: { "avatarURL": "https://s.gravatar.com/avatar/{HASH}?size=100&default=retro" }
 */
export function extractGravatarHashFromNpmUrl(npmAvatarUrl: string): string | null {
  try {
    // Check if it's an NPM avatar service URL
    if (!npmAvatarUrl.includes('npm-avatar')) {
      return null;
    }
    
    // Extract the JWT (everything after /npm-avatar/)
    // Handle both full URLs and just the JWT token
    let jwt: string;
    if (npmAvatarUrl.startsWith('http')) {
      jwt = npmAvatarUrl.split('/npm-avatar/')[1]?.split('?')[0]; // Remove query params if any
    } else {
      jwt = npmAvatarUrl.split('?')[0]; // Assume it's just the JWT token
    }
    
    if (!jwt) {
      console.log('[NPM Avatar] No JWT token found in URL:', npmAvatarUrl);
      return null;
    }
    
    // Decode the JWT payload (middle part between dots)
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      console.log('[NPM Avatar] Invalid JWT format, expected 3 parts, got:', parts.length);
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    let decoded: any;
    
    try {
      // Base64 decode and parse JSON
      decoded = JSON.parse(atob(payload));
      console.log('[NPM Avatar] Decoded JWT payload:', decoded);
    } catch (e) {
      console.error('[NPM Avatar] Failed to decode JWT payload:', e);
      return null;
    }
    
    // Extract hash from the Gravatar URL in the payload
    const gravatarUrl = decoded.avatarURL;
    if (!gravatarUrl) {
      console.log('[NPM Avatar] No avatarURL in JWT payload:', decoded);
      return null;
    }
    
    console.log('[NPM Avatar] Gravatar URL from JWT:', gravatarUrl);
    
    // Extract hash from URL like: https://s.gravatar.com/avatar/HASH?...
    // or: https://www.gravatar.com/avatar/HASH?...
    const match = gravatarUrl.match(/avatar\/([a-f0-9]{32})/i);
    if (match) {
      const hash = match[1];
      console.log('[NPM Avatar] Extracted Gravatar hash:', hash);
      return hash;
    }
    
    console.log('[NPM Avatar] Could not extract hash from Gravatar URL:', gravatarUrl);
    return null;
  } catch (error) {
    console.error('[NPM Avatar] Failed to extract Gravatar hash from NPM URL:', error, { npmAvatarUrl });
    return null;
  }
}

/**
 * Decode NPM JWT avatar URL and return the full Gravatar URL
 */
export function decodeNpmAvatarUrl(npmAvatarUrl: string): { gravatarUrl: string; hash: string } | null {
  try {
    const hash = extractGravatarHashFromNpmUrl(npmAvatarUrl);
    if (!hash) return null;
    
    // Extract the JWT to get size and default from the original Gravatar URL
    const jwt = npmAvatarUrl.includes('/npm-avatar/') 
      ? npmAvatarUrl.split('/npm-avatar/')[1]?.split('?')[0]
      : npmAvatarUrl.split('?')[0];
    
    if (!jwt) return null;
    
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    
    const decoded = JSON.parse(atob(parts[1]));
    const gravatarUrl = decoded.avatarURL;
    
    if (gravatarUrl) {
      return { gravatarUrl, hash };
    }
    
    return null;
  } catch (error) {
    console.error('[NPM Avatar] Failed to decode NPM avatar URL:', error);
    return null;
  }
}

/**
 * Get avatar URL for an NPM maintainer
 * Prefers NPM's provided avatar, falls back to Gravatar from email
 */
export function getMaintainerAvatarUrl(
  maintainer: NpmMaintainer,
  size: number = 40,
  getGravatarUrl: (email: string, size: number) => string | null
): string | null {
  // First, try to use NPM's provided avatar URL
  if (maintainer.avatar) {
    // If it's an NPM JWT URL, we can use it directly or extract the Gravatar hash
    if (maintainer.avatar.includes('npm-avatar')) {
      const hash = extractGravatarHashFromNpmUrl(maintainer.avatar);
      if (hash) {
        return `https://s.gravatar.com/avatar/${hash}?size=${size}&default=retro`;
      }
      // If extraction fails, use the NPM URL as-is
      return maintainer.avatar;
    }
    return maintainer.avatar;
  }
  
  // Fall back to generating Gravatar URL from email
  if (maintainer.email) {
    return getGravatarUrl(maintainer.email, size);
  }
  
  return null;
}

/**
 * Batch fetch NPM user avatars
 * Useful for getting avatars for multiple maintainers at once
 */
export async function batchGetNpmUserAvatars(
  usernames: string[]
): Promise<Map<string, string>> {
  const avatarMap = new Map<string, string>();
  
  await Promise.allSettled(
    usernames.map(async (username) => {
      const avatar = await getNpmUserAvatar(username);
      if (avatar) {
        avatarMap.set(username, avatar);
      }
    })
  );
  
  return avatarMap;
}

/**
 * Test function to decode an NPM JWT avatar URL
 * Useful for debugging and verifying the extraction works
 * 
 * Example usage:
 * testDecodeNpmAvatarUrl('https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 */
export function testDecodeNpmAvatarUrl(jwtUrl: string): void {
  console.log('[NPM Avatar Test] ========================================');
  console.log('[NPM Avatar Test] Input URL:', jwtUrl);
  console.log('[NPM Avatar Test] ========================================');
  
  const decoded = decodeNpmAvatarUrl(jwtUrl);
  if (decoded) {
    console.log('[NPM Avatar Test] ✓ Decoded successfully!');
    console.log('[NPM Avatar Test] Gravatar URL from JWT:', decoded.gravatarUrl);
    console.log('[NPM Avatar Test] Extracted hash:', decoded.hash);
    console.log('[NPM Avatar Test] Generated Gravatar URL:', `https://s.gravatar.com/avatar/${decoded.hash}?size=100&default=retro`);
    console.log('[NPM Avatar Test] URLs match:', decoded.gravatarUrl.includes(decoded.hash));
  } else {
    console.log('[NPM Avatar Test] ✗ Failed to decode');
  }
  
  // Also test the hash extraction directly
  const hash = extractGravatarHashFromNpmUrl(jwtUrl);
  if (hash) {
    console.log('[NPM Avatar Test] Direct hash extraction:', hash);
  }
  console.log('[NPM Avatar Test] ========================================');
}

