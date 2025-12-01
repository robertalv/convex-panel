const fs = require('fs');
const path = require('path');

/**
 * Generates a TypeScript file containing CSS as a string for runtime injection
 */
function generateStylesTS() {
  const cssPath = path.join(__dirname, '../dist/index.css');
  const outputPath = path.join(__dirname, '../src/styles/runtime.ts');

  if (!fs.existsSync(cssPath)) {
    throw new Error(`CSS file not found: ${cssPath}. Run 'npm run build:css' first.`);
  }

  const css = fs.readFileSync(cssPath, 'utf8');

  // Escape backticks and ${} for template literal
  const escapedCss = css
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');

  const tsContent = `/**
 * Auto-generated file containing CSS styles for runtime injection.
 * This file is generated from dist/index.css during the build process.
 * DO NOT EDIT MANUALLY - run 'npm run build:styles-ts' to regenerate.
 */

export const panelStyles = \`${escapedCss}\`;

`;

  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, tsContent, 'utf8');
  console.log(`✅ Generated ${outputPath}`);
}

if (require.main === module) {
  generateStylesTS();
}

module.exports = { generateStylesTS };

