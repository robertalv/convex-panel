/**
 * PostCSS plugin to automatically scope all CSS rules to .cp-bottom-sheet
 * This ensures complete CSS isolation without Shadow DOM
 */
module.exports = (opts = {}) => {
  const { scopeSelector = '.cp-bottom-sheet' } = opts;

  return {
    postcssPlugin: 'postcss-scope-plugin',
    Once(root) {
      // Skip if already scoped
      if (root.nodes.some(node => 
        node.type === 'rule' && 
        node.selector && 
        node.selector.startsWith(scopeSelector)
      )) {
        return;
      }

      root.walkRules((rule) => {
        // Skip @keyframes, @media, @supports, etc. - we'll handle them separately
        if (rule.parent && rule.parent.type === 'atrule') {
          return;
        }

        // Skip rules that are already scoped
        if (rule.selector.startsWith(scopeSelector)) {
          return;
        }

        // Skip :root and html selectors (we handle these separately)
        if (rule.selector === ':root' || rule.selector === 'html') {
          return;
        }

        // Scope the selector
        rule.selector = rule.selector
          .split(',')
          .map(sel => {
            const trimmed = sel.trim();
            // Handle pseudo-selectors and combinators
            if (trimmed.startsWith(':') || trimmed.startsWith('::')) {
              return `${scopeSelector}${trimmed}`;
            }
            // Handle descendant selectors
            if (trimmed.includes(' ')) {
              return `${scopeSelector} ${trimmed}`;
            }
            // Default: prepend scope
            return `${scopeSelector} ${trimmed}`;
          })
          .join(',');
      });

      // Handle @keyframes - scope them to prevent conflicts
      root.walkAtRules('keyframes', (atRule) => {
        if (!atRule.params.startsWith('cp-')) {
          atRule.params = `cp-${atRule.params}`;
        }
      });

      // Handle @media queries - ensure rules inside are scoped
      root.walkAtRules('media', (atRule) => {
        atRule.walkRules((rule) => {
          if (!rule.selector.startsWith(scopeSelector)) {
            rule.selector = rule.selector
              .split(',')
              .map(sel => {
                const trimmed = sel.trim();
                if (trimmed.startsWith(':') || trimmed.startsWith('::')) {
                  return `${scopeSelector}${trimmed}`;
                }
                return `${scopeSelector} ${trimmed}`;
              })
              .join(',');
          }
        });
      });
    },
  };
};

module.exports.postcss = true;

