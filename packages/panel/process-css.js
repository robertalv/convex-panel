const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const postcssConfig = require('./postcss.config.js');

async function processCss() {
  try {
    // Ensure the dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Read the source CSS file
    const srcPath = path.join(__dirname, 'src', 'styles', 'tailwind.css');
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Source CSS file not found: ${srcPath}`);
    }

    const css = fs.readFileSync(srcPath, 'utf8');

    // Load plugins from config
    const plugins = [];
    const configPlugins = postcssConfig.plugins || {};
    
    for (const [pluginName, pluginOptions] of Object.entries(configPlugins)) {
      const plugin = require(pluginName);
      // Handle both function and object plugin formats
      if (typeof plugin === 'function') {
        plugins.push(plugin(pluginOptions && typeof pluginOptions === 'object' ? pluginOptions : {}));
      } else if (plugin.default && typeof plugin.default === 'function') {
        plugins.push(plugin.default(pluginOptions && typeof pluginOptions === 'object' ? pluginOptions : {}));
      } else {
        plugins.push(plugin);
      }
    }

    // Process CSS with PostCSS
    const result = await postcss(plugins).process(css, {
      from: srcPath,
      to: path.join(distDir, 'index.css'),
      map: { inline: false },
    });

    // Write the processed CSS to dist/index.css
    const destPath = path.join(distDir, 'index.css');
    fs.writeFileSync(destPath, result.css);

    // Write source map if available
    if (result.map) {
      fs.writeFileSync(destPath + '.map', result.map.toString());
    }

    console.info('CSS processed and built successfully!');
  } catch (error) {
    console.error('Error processing CSS file:', error);
    process.exit(1);
  }
}

processCss(); 