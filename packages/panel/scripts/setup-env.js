#!/usr/bin/env node

/**
 * Setup script to help users configure environment variables for Convex Panel.
 *
 * It will:
 * - Detect or create a .env file in the current working directory
 *   (preferring .env.local, then .env).
 * - Prompt for:
 *   - Convex deployment URL (VITE_CONVEX_URL)
 *   - Convex OAuth client ID (VITE_OAUTH_CLIENT_ID)
 *   - Token exchange URL (VITE_CONVEX_TOKEN_EXCHANGE_URL)
 *   - Convex OAuth client secret (CONVEX_CLIENT_SECRET)
 * - Append any missing variables without overwriting existing ones.
 */

const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function selectOption(options, promptText) {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    let linesToClear = 0;

    // Enable raw mode
    const wasRawMode = process.stdin.isRaw;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    // Enable keypress events
    readline.emitKeypressEvents(process.stdin);

    const render = () => {
      // Move cursor up to clear previous menu
      if (linesToClear > 0) {
        process.stdout.write(`\x1B[${linesToClear}A`);
        process.stdout.write('\x1B[0J');
      }

      // Print prompt
      process.stdout.write(promptText + '\n');
      
      // Print options
      options.forEach((option, index) => {
        if (index === selectedIndex) {
          process.stdout.write(
            colorize('  → ', "cyan") + 
            colorize(option.name, "bright") + 
            '\n'
          );
        } else {
          process.stdout.write('    ' + option.name + '\n');
        }
      });
      
      // Print instructions
      process.stdout.write('\n' + colorize(`Use ↑↓ arrows or numbers (1-${options.length}) to select, Enter/Space to confirm`, "dim") + '\n');
      
      // Calculate lines to clear next time (prompt + options + blank + instructions)
      linesToClear = 1 + options.length + 2;
    };

    // Initial render
    console.log();
    render();

    let escapeSequence = '';
    let escapeTimeout = null;
    
    const onData = (chunk) => {
      const str = chunk.toString();
      
      // Handle Ctrl+C
      if (str === '\x03') {
        // Restore terminal state
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(wasRawMode);
        }
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        if (escapeTimeout) clearTimeout(escapeTimeout);
        process.exit(0);
      }
      
      // Handle escape sequences (arrow keys come as multiple chunks: \x1b, then [A or [B)
      if (str === '\x1b' || str === '\u001b' || str.charCodeAt(0) === 27) {
        escapeSequence = str;
        // Set timeout to reset if sequence doesn't complete
        if (escapeTimeout) clearTimeout(escapeTimeout);
        escapeTimeout = setTimeout(() => {
          escapeSequence = '';
        }, 100);
        return; // Wait for next chunk
      }
      
      if (escapeSequence) {
        escapeSequence += str;
        if (escapeTimeout) clearTimeout(escapeTimeout);
        
        // Check for complete escape sequences
        if (escapeSequence.match(/^\x1b\[A/) || escapeSequence.match(/^\u001b\[A/)) {
          // Up arrow
          selectedIndex = (selectedIndex - 1 + options.length) % options.length;
          render();
          escapeSequence = '';
          return;
        } else if (escapeSequence.match(/^\x1b\[B/) || escapeSequence.match(/^\u001b\[B/)) {
          // Down arrow
          selectedIndex = (selectedIndex + 1) % options.length;
          render();
          escapeSequence = '';
          return;
        } else if (escapeSequence.length > 10) {
          // Invalid or incomplete sequence, reset
          escapeSequence = '';
        } else if (!escapeSequence.match(/^\x1b\[/)) {
          // Not an arrow key sequence, reset
          escapeSequence = '';
        } else {
          // Still building sequence
          escapeTimeout = setTimeout(() => {
            escapeSequence = '';
          }, 100);
          return;
        }
      }
      
      // Handle Enter
      if (str === '\r' || str === '\n') {
        // Restore terminal state
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(wasRawMode);
        }
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        if (escapeTimeout) clearTimeout(escapeTimeout);
        
        // Clear the menu area
        if (linesToClear > 0) {
          process.stdout.write(`\x1B[${linesToClear}A`);
          process.stdout.write('\x1B[0J');
        }
        
        resolve(selectedIndex);
      } else if (str === ' ') {
        // Space
        // Restore terminal state
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(wasRawMode);
        }
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        if (escapeTimeout) clearTimeout(escapeTimeout);
        
        // Clear the menu area
        if (linesToClear > 0) {
          process.stdout.write(`\x1B[${linesToClear}A`);
          process.stdout.write('\x1B[0J');
        }
        
        resolve(selectedIndex);
      } else if (str === 'k' || str === 'K') {
        // Vim-style up
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
      } else if (str === 'j' || str === 'J') {
        // Vim-style down
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
      } else if (str >= '1' && str <= String(options.length)) {
        // Number key selection
        const num = parseInt(str) - 1;
        if (num >= 0 && num < options.length) {
          // Restore terminal state
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(wasRawMode);
          }
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          if (escapeTimeout) clearTimeout(escapeTimeout);
          
          // Clear the menu area
          if (linesToClear > 0) {
            process.stdout.write(`\x1B[${linesToClear}A`);
            process.stdout.write('\x1B[0J');
          }
          
          resolve(num);
        }
      }
    };

    // Also handle keypress events for better compatibility (this should work better)
    const onKeypress = (str, key) => {
      if (key) {
        if (key.ctrl && key.name === 'c') {
          // Restore terminal state
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(wasRawMode);
          }
          process.stdin.pause();
          process.stdin.removeListener('keypress', onKeypress);
          process.stdin.removeListener('data', onData);
          if (escapeTimeout) clearTimeout(escapeTimeout);
          process.exit(0);
        }
        
        // Handle arrow keys - this should work
        if (key.name === 'up' || (key.sequence === '\x1b[A' || key.sequence === '\u001b[A')) {
          selectedIndex = (selectedIndex - 1 + options.length) % options.length;
          render();
          return;
        } else if (key.name === 'down' || (key.sequence === '\x1b[B' || key.sequence === '\u001b[B')) {
          selectedIndex = (selectedIndex + 1) % options.length;
          render();
          return;
        } else if (key.name === 'return' || key.name === 'enter') {
          // Restore terminal state
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(wasRawMode);
          }
          process.stdin.pause();
          process.stdin.removeListener('keypress', onKeypress);
          process.stdin.removeListener('data', onData);
          if (escapeTimeout) clearTimeout(escapeTimeout);
          
          // Clear the menu area
          if (linesToClear > 0) {
            process.stdout.write(`\x1B[${linesToClear}A`);
            process.stdout.write('\x1B[0J');
          }
          
          resolve(selectedIndex);
          return;
        } else if (key.name && key.name.match(/^\d+$/) && parseInt(key.name) >= 1 && parseInt(key.name) <= options.length) {
          // Number key selection
          const num = parseInt(key.name) - 1;
          if (num >= 0 && num < options.length) {
            // Restore terminal state
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(wasRawMode);
            }
            process.stdin.pause();
            process.stdin.removeListener('keypress', onKeypress);
            process.stdin.removeListener('data', onData);
            if (escapeTimeout) clearTimeout(escapeTimeout);
            
            // Clear the menu area
            if (linesToClear > 0) {
              process.stdout.write(`\x1B[${linesToClear}A`);
              process.stdout.write('\x1B[0J');
            }
            
            resolve(num);
            return;
          }
        } else if (key.name === 'space') {
          // Restore terminal state
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(wasRawMode);
          }
          process.stdin.pause();
          process.stdin.removeListener('keypress', onKeypress);
          process.stdin.removeListener('data', onData);
          if (escapeTimeout) clearTimeout(escapeTimeout);
          
          // Clear the menu area
          if (linesToClear > 0) {
            process.stdout.write(`\x1B[${linesToClear}A`);
            process.stdout.write('\x1B[0J');
          }
          
          resolve(selectedIndex);
          return;
        }
      }
    };

    // Prioritize keypress events, fallback to data events
    process.stdin.on('keypress', onKeypress);
    process.stdin.on('data', onData);
  });
}

function printHeader() {
  console.log("\n" + colorize("╔═══════════════════════════════════════════════════════════╗", "cyan"));
  console.log(colorize("║", "cyan") + colorize("     Convex Panel - Environment Setup", "bright") + colorize("              ║", "cyan"));
  console.log(colorize("╚═══════════════════════════════════════════════════════════╝", "cyan") + "\n");
}

function printSuccess(message) {
  console.log(colorize("✓", "green") + " " + message);
}

function printInfo(message) {
  console.log(colorize("ℹ", "blue") + " " + message);
}

function printWarning(message) {
  console.log(colorize("⚠", "yellow") + " " + message);
}

async function pickEnvFile(cwd) {
  const candidates = [".env.local", ".env"];
  for (const name of candidates) {
    const full = path.join(cwd, name);
    try {
      await fs.access(full);
      return full;
    } catch {
      // ignore
    }
  }
  // Default to .env.local if none exist
  return path.join(cwd, ".env.local");
}

function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const map = new Map();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1);
    map.set(key, value);
  }
  return { lines, map };
}

async function main() {
  printHeader();

  const cwd = process.cwd();
  const envPath = await pickEnvFile(cwd);

  let envContent = "";
  try {
    envContent = await fs.readFile(envPath, "utf8");
  } catch {
    // file doesn't exist yet; we'll create it
  }

  const { lines, map } = parseEnv(envContent);

  printInfo(`Configuring environment variables in: ${colorize(envPath, "cyan")}\n`);

  // Determine framework and prefix
  let prefix = "VITE_";
  const frameworks = [
    { name: "Vite", value: "vite", prefix: "VITE_" },
    { name: "Svelte", value: "svelte", prefix: "VITE_" },
    { name: "Next.js", value: "nextjs", prefix: "NEXT_PUBLIC_" },
    { name: "React (Create React App)", value: "react", prefix: "REACT_APP_" },
    { name: "Other", value: "other", prefix: "VITE_" }
  ];

  // Check if we can detect from existing env vars
  const hasVite = map.has("VITE_CONVEX_URL");
  const hasNext = map.has("NEXT_PUBLIC_CONVEX_URL");
  
  if (hasVite && !hasNext) {
    prefix = "VITE_";
    printInfo(`Detected ${colorize("Vite", "cyan")} framework from existing environment variables.`);
  } else if (hasNext && !hasVite) {
    prefix = "NEXT_PUBLIC_";
    printInfo(`Detected ${colorize("Next.js", "cyan")} framework from existing environment variables.`);
  } else if (!hasVite && !hasNext) {
    // Ask user to select framework
    console.log();
    const selectedIndex = await selectOption(
      frameworks,
      colorize("Select your framework:", "bright")
    );
    
    if (selectedIndex >= 0 && selectedIndex < frameworks.length) {
      prefix = frameworks[selectedIndex].prefix;
      console.log();
      printInfo(`Using ${colorize(frameworks[selectedIndex].name, "cyan")} framework with ${colorize(prefix, "yellow")} prefix.`);
    } else {
      printWarning("Invalid selection, defaulting to Vite.");
      prefix = "VITE_";
    }
  } else {
    // Both exist, ask user
    console.log();
    printWarning("Both VITE_ and NEXT_PUBLIC_ prefixes found. Please select:");
    const selectedIndex = await selectOption(
      frameworks,
      colorize("Select your framework:", "bright")
    );
    
    if (selectedIndex >= 0 && selectedIndex < frameworks.length) {
      prefix = frameworks[selectedIndex].prefix;
      console.log();
      printInfo(`Using ${colorize(frameworks[selectedIndex].name, "cyan")} framework with ${colorize(prefix, "yellow")} prefix.`);
    } else {
      printWarning("Invalid selection, defaulting to Vite.");
      prefix = "VITE_";
    }
  }

  console.log();
  const updates = [];

  // 1) CONVEX_URL
  const convexUrlKey = `${prefix}CONVEX_URL`;
  if (map.has(convexUrlKey)) {
    printSuccess(`${convexUrlKey} ${colorize("already set", "dim")}; leaving existing value unchanged.`);
  } else {
    const url = await ask(
      colorize("→ ", "cyan") + colorize("Convex deployment URL", "bright") + 
      colorize(" (e.g. https://your-deployment.convex.cloud)", "dim") + 
      colorize(` for ${convexUrlKey}: `, "reset")
    );
    if (url) {
      updates.push(`${convexUrlKey}=${url}`);
    }
  }

  // 2) OAUTH_CLIENT_ID
  const oauthClientIdKey = `${prefix}OAUTH_CLIENT_ID`;
  if (map.has(oauthClientIdKey)) {
    printSuccess(`${oauthClientIdKey} ${colorize("already set", "dim")}; leaving existing value unchanged.`);
  } else {
    console.log();
    printInfo(colorize("Get your OAuth Client ID from:", "dim") + " " + colorize("https://dashboard.convex.dev", "cyan"));
    const clientId = await ask(
      colorize("→ ", "cyan") + colorize("OAuth Client ID", "bright") + 
      colorize(" (from Convex dashboard)", "dim") + 
      colorize(` for ${oauthClientIdKey}: `, "reset")
    );
    if (clientId) {
      updates.push(`${oauthClientIdKey}=${clientId}`);
    }
  }

  // 3) CONVEX_CLIENT_SECRET
  if (map.has("CONVEX_CLIENT_SECRET")) {
    printSuccess(`CONVEX_CLIENT_SECRET ${colorize("already set", "dim")}; leaving existing value unchanged.`);
  } else {
    console.log();
    printInfo(colorize("Get your OAuth Client Secret from:", "dim") + " " + colorize("https://dashboard.convex.dev", "cyan"));
    const clientSecret = await ask(
      colorize("→ ", "cyan") + colorize("OAuth Client Secret", "bright") + 
      colorize(" (from Convex dashboard)", "dim") + 
      colorize(" for CONVEX_CLIENT_SECRET: ", "reset")
    );
    if (clientSecret) {
      updates.push(`CONVEX_CLIENT_SECRET=${clientSecret}`);
    }
  }

  // 4) CONVEX_TOKEN_EXCHANGE_URL
  const tokenExchangeUrlKey = `${prefix}CONVEX_TOKEN_EXCHANGE_URL`;
  if (map.has(tokenExchangeUrlKey)) {
    printSuccess(`${tokenExchangeUrlKey} ${colorize("already set", "dim")}; leaving existing value unchanged.`);
  } else {
    // Get the CONVEX_URL from map or from what we just added
    const convexUrl = map.get(convexUrlKey) || 
                     (updates.find(u => u.startsWith(convexUrlKey))?.split("=")[1] || "");
    
    const suggestedSite =
      convexUrl && convexUrl.includes(".convex.cloud")
        ? convexUrl.replace(".convex.cloud", ".convex.site") + "/oauth/exchange"
        : "";

    console.log();
    let prompt = colorize("→ ", "cyan") + colorize("Token Exchange URL", "bright");
    if (suggestedSite) {
      prompt += colorize(" (press Enter to use suggested)", "dim") + 
                colorize(` ${suggestedSite}`, "gray") + 
                colorize(": ", "reset");
    } else {
      prompt += colorize(" (e.g. https://your-deployment.convex.site/oauth/exchange)", "dim") + 
                colorize(": ", "reset");
    }

    let tokenUrl = await ask(prompt);
    if (!tokenUrl && suggestedSite) {
      tokenUrl = suggestedSite;
      printInfo(`Using suggested URL: ${colorize(suggestedSite, "cyan")}`);
    }
    if (tokenUrl) {
      updates.push(`${tokenExchangeUrlKey}=${tokenUrl}`);
    }
  }

  // 5) Add blank line and CONVEX_ACCESS_TOKEN with comment
  if (map.has("CONVEX_ACCESS_TOKEN")) {
    printSuccess(`CONVEX_ACCESS_TOKEN ${colorize("already set", "dim")}; leaving existing value unchanged.`);
  } else {
    console.log();
    printInfo(colorize("Get your access token from:", "dim") + " " + colorize("https://dashboard.convex.dev/t/{team_name}/settings/access-tokens", "cyan"));
    updates.push("");
    updates.push("# Please get your access token from https://dashboard.convex.dev/t/{team_name}/settings/access-tokens");
    updates.push("# Replace team name with your own or just go to https://dashboard.convex.dev -> Team Settings -> Access Tokens -> Create Token")
    updates.push("CONVEX_ACCESS_TOKEN=");
  }

  if (updates.length === 0) {
    console.log();
    printSuccess(colorize("All required environment variables are already set!", "green"));
    console.log();
    return;
  }

  const newContent =
    (envContent ? envContent.replace(/\s*$/, "") + "\n" : "") +
    updates.join("\n") +
    "\n";

  await fs.writeFile(envPath, newContent, "utf8");

  console.log();
  printSuccess(colorize("Successfully added the following environment variables:", "green"));
  for (const line of updates) {
    if (line.trim() && !line.startsWith("#")) {
      const [key] = line.split("=");
      if (key) {
        console.log(colorize("  ✓ ", "green") + colorize(key, "cyan"));
      }
    }
  }
  console.log();
}

main().catch((err) => {
  console.error("setup-env failed:", err);
  process.exit(1);
});


