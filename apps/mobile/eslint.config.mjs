import baseConfig from "@repo/config/eslint/base";
import expoConfig from "eslint-config-expo/flat.js";

export default [
  ...baseConfig,
  ...expoConfig,
  {
    ignores: ["dist/**"],
  },
];
