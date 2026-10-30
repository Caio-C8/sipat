const nodeExternals = require("webpack-node-externals");
const path = require("node:path");

module.exports = function configureWebpack(options) {
  return {
    ...options,
    entry: {
      main: path.resolve(__dirname, "src/main.ts"),
      "commands/provisionar-administrador": path.resolve(
        __dirname,
        "src/commands/provisionar-administrador.ts",
      ),
      "commands/seed-geral": path.resolve(
        __dirname,
        "src/commands/seed-geral.ts",
      ),
    },
    output: {
      ...options.output,
      filename: "[name].js",
    },
    externals: [
      nodeExternals({
        allowlist: [/^@repo\//],
      }),
    ],
  };
};
