module.exports = {
  plugins: {
    'postcss-import': {},
    // Note: @tailwindcss/postcss removed to prevent CSS leakage to parent apps.
    // All styles use custom cp- prefixed classes defined in tailwind.css
    autoprefixer: {},
  },
};

