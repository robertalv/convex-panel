const fs = require('fs');
const path = require('path');

function processCss() {
  try {
    // Ensure the dist/styles directory exists
    const stylesDir = path.join(__dirname, 'dist', 'styles');
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
    }

    // Copy the CSS file to the dist directory
    const srcPath = path.join(__dirname, 'src', 'styles', 'convex-panel.css');
    const destPath = path.join(stylesDir, 'convex-panel.css');
    
    fs.copyFileSync(srcPath, destPath);

    console.info('CSS file copied successfully!');
  } catch (error) {
    console.error('Error copying CSS file:', error);
    process.exit(1);
  }
}

processCss(); 