const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

function getDirSize(dir) {
  let total = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      total += getDirSize(fullPath);
    } else {
      try {
        total += fs.statSync(fullPath).size;
      } catch {
        // Ignore files that disappear between readdir and stat
      }
    }
  }

  return total;
}

if (fs.existsSync(distDir)) {
  const bytes = getDirSize(distDir);
  const kb = bytes / 1024;
  const mb = kb / 1024;

  console.log(
    `[convex-panel] dist size: ${bytes.toLocaleString()} bytes (${kb.toFixed(
      1,
    )} KB, ${mb.toFixed(2)} MB)`,
  );
} else {
  console.log('[convex-panel] dist directory does not exist yet.');
}


