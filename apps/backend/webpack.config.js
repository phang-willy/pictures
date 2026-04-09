const path = require('path');
const fs = require('fs');

function resolveSharedRoot() {
  const insideApp = path.join(__dirname, 'shared');
  if (fs.existsSync(insideApp)) {
    return insideApp;
  }
  return path.join(__dirname, '..', '..', 'shared');
}

module.exports = function (options) {
  const sharedRoot = resolveSharedRoot();

  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve && options.resolve.alias
          ? options.resolve.alias
          : {}),
        '@shared/schemas': path.join(sharedRoot, 'schemas'),
        '@shared': sharedRoot,
      },
    },
  };
};
