const nodeExternals = require("webpack-node-externals");

module.exports = function configureWebpack(options) {
  return {
    ...options,
    externals: [
      nodeExternals({
        allowlist: [/^@repo\//],
      }),
    ],
  };
};
