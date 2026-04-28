const path = require('path');
const fs = require('fs');

module.exports = (request, options) => {
  // For paths that resolve to a .js file, try .ts first if it exists
  try {
    const resolved = options.defaultResolver(request, options);
    if (resolved && resolved.endsWith('.js') && !resolved.includes('node_modules')) {
      const tsPath = resolved.replace(/\.js$/, '.ts');
      if (fs.existsSync(tsPath)) {
        return tsPath;
      }
    }
    return resolved;
  } catch (e) {
    return options.defaultResolver(request, options);
  }
};
