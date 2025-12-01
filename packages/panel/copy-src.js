const fs = require('fs');
const path = require('path');

// Create destination directory if it doesn't exist
const destDir = path.join(__dirname, 'dist');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Create assets directory in dist if it doesn't exist
const assetsDir = path.join(__dirname, 'dist', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Function to copy a directory recursively
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Get all files and directories in the source directory
  const entries = fs.readdirSync(src);
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Source and destination paths
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Check if source directory exists
if (!fs.existsSync(srcDir)) {
  console.error(`Error: Source directory '${srcDir}' does not exist.`);
  process.exit(1);
}

// Copy assets files to dist/assets
const srcAssetsDir = path.join(__dirname, 'src', 'assets');
if (fs.existsSync(srcAssetsDir)) {
  const assetFiles = fs.readdirSync(srcAssetsDir);
  
  assetFiles.forEach(file => {
    const srcPath = path.join(srcAssetsDir, file);
    const destPath = path.join(assetsDir, file);
    fs.copyFileSync(srcPath, destPath);
  });
}

// Copy the source directory to the destination
copyDir(srcDir, distDir);

console.info('Source files copied successfully!'); 